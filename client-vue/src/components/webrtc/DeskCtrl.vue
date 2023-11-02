<template>
  <div class="videoDiv" :style="'width:'+videoWidth+'px;height:'+videoHeight+'px'">
      <div class="videoNav">
        decoderImp:{{reportCount.currentReport!=null?reportCount.currentReport.decoderImplementation:""}}<br/>
        bytes:{{reportCount.bytes}}<br/>
        packets:{{reportCount.packets}}<br/>
        packetsLost:{{reportCount.currentReport!=null?reportCount.currentReport.packetsLost:0}}<br/>
        frameSize:{{reportCount.currentReport!=null?reportCount.currentReport.frameWidth:0}} {{reportCount.currentReport!=null?reportCount.currentReport.frameHeight:0}}<br/>
        frames:{{reportCount.currentReport!=null?reportCount.currentReport.framesPerSecond:0}}<br/>
        <!-- delay:{{reportCount.currentReport!=null?reportCount.currentReport.totalSquaredInterFrameDelay:0}}<br/> -->
        LC:{{reportCount.reportLocalCandidate==null?"":reportCount.reportLocalCandidate.candidateType+" "+reportCount.reportLocalCandidate.ip+" "+reportCount.reportLocalCandidate.port}}<br/>
        RC:{{reportCount.reportRemoteCandidate==null?"":reportCount.reportRemoteCandidate.candidateType+" "+reportCount.reportRemoteCandidate.ip+" "+reportCount.reportRemoteCandidate.port}}
      </div>
      <div class="audioNav">
        audioOpen:{{reportCount.audioOpen}}<br/>
        静音:<i style="cursor:pointer" class="el-icon-microphone" @click="audioOpenChange"></i><br/>
      </div>
      <div ref="localVideoDiv" v-show="localStream!=null" class="localVideoDiv" @mousedown="move($event)">
        <video ref="localVideo" class="localVideo" autoplay muted playsinline></video>
      </div>
      <video ref="remoteVideo" class="remoteVideo" autoplay playsinline></video>
  </div>
</template>

<script>
import io from 'socket.io-client';
import mouseListener from '@/utils/mouseListener.js'

export default {
  props: {

  },
  data() {
    return {
      videoWidth:1280,
      videoHeight:720,
      wsUrl: null,
      roomId: null,
      pcConfig: null,
      socket: null,
      pc: null,
      pcDataChannel: null,
      sender: null,
      remoteStream: null,
      localStream: null,
      timeInterval: null,

      reportCount:{
        lastReport: null,
        currentReport: null,
        bytes: 0,
        packets: 0,
        audioOpen: false,
        reportRemoteCandidate: null,
        reportLocalCandidate: null
      },

    };
  },
  methods: {
    start(config) {
      console.log("start config",config);
      this.wsUrl = config.wsUrl;
      this.roomId = config.roomId;
      this.pcConfig = config.pcConfig;
      if(config.localStream!=null){
        this.localStream = config.localStream;
        this.$refs.localVideo.srcObject = this.localStream;
      }

      //console.log("des wss连接"+this.wsUrl+" roomId="+this.roomId); 
      //this.socket = io.connect(this.wsUrl);
      this.socket = io.connect(this.wsUrl,{path: "/socket.io",transports: ["websocket"]});//this.wsUrl+"?token=123456"
      //this.socket = io.connect("https://192.168.1.105:8888",{path: "/socket.io",transports: ["websocket"]});
      //this.socket = io.connect(this.wsUrl+"?token=123456",{path: "/socket.io",transports: ["websocket"]});
      this.socket.on('joined', (roomid, id) => {
        console.log('receive joined message!', roomid, id);
        //this.socket.emit('get-ice-servers');
        this.createPeerConnection();
      });
      this.socket.on('otherjoin', (roomid) => {
        console.log('receive otherjoin message:', roomid);
        this.createPeerConnection();
        this.sendMessage(roomid, {
          type: 'need_offer'
        });			
      }); 
      this.socket.on('full', (roomid, id) => {
        console.log('receive full message', roomid, id);
        
      });
      this.socket.on('leaved', (roomid, id) => {
        console.log('receive leaved message', roomid, id);
        this.hangup();
        this.socket.disconnect();
      });  
      this.socket.on('bye', (roomid, id) => {
        console.log('receive bye message', roomid, id);
        this.hangup();
        //this.socket.disconnect();
      });  
      this.socket.on('disconnect', (socket) => {
        console.log('receive disconnect message!',socket);
        this.hangup();
      });                         
      this.socket.on('message', (roomid, data) => {
        console.log('receive message!', roomid, data);
        if(typeof data === 'string'){
          data = JSON.parse(data);
        }

        if(data === null || data === undefined){
          console.error('the message is invalid!');
          return;	
        }

        if(data.type === 'offer') {
          
          //offer.value = data.sdp;

          this.pc.setRemoteDescription(new RTCSessionDescription(data));

          //create answer
          this.pc.createAnswer()
            .then(this.getAnswer)
            .catch(this.handleAnswerError);

        }else if (data.type === 'candidate'){
          var candidate = new RTCIceCandidate({
            sdpMLineIndex: data.label,
            candidate: data.candidate
          });
          this.pc.addIceCandidate(candidate);	
        
        }else{
          console.log('the message is invalid!!!', data);
        
        }
      
      });      

      this.socket.emit('join', this.roomId);
      //监控
      this.startInterval();
      //键鼠事件
      mouseListener.init(this.$refs.remoteVideo,this.ctrlCallback);
    },
    startInterval(){
      //clearInterval(this.timeInterval);
      //this.timeInterval = null;
      this.timeInterval = setInterval(()=>{
        if (!this.pc) {
          return;
        }
        //console.log("getReceivers",this.pc.getReceivers(),this.pc.getReceivers().length);
        var receiver = null;
        for(var i=0;i<this.pc.getReceivers().length;i++){
          //console.log("receiver",this.pc.getReceivers()[i]);
          if(this.pc.getReceivers()[i].track.kind=="video"){
            receiver = this.pc.getReceivers()[i];
          }else if(this.pc.getReceivers()[i].track.kind=="audio"){
            this.reportCount.audioOpen = true;
          }
        }
        if (!receiver) {
          return;
        }
        receiver.getStats().then(res => {
          res.forEach(report => {
            //console.log("report",report);
            if (report.type === 'inbound-rtp') {
              //console.log("report",report);
              if (report.isRemote) {
                return;
              }
              this.reportCount.currentReport = report;
              if(this.reportCount.lastReport && this.reportCount.currentReport){
                this.reportCount.bytes = this.reportCount.currentReport.bytesReceived-this.reportCount.lastReport.bytesReceived;
                this.reportCount.packets = this.reportCount.currentReport.packetsReceived-this.reportCount.lastReport.packetsReceived;
              }
              this.reportCount.lastReport = report;
            }else if(report.type === 'remote-candidate'){
              this.reportCount.reportRemoteCandidate = report;
            }else if(report.type === 'local-candidate'){
              this.reportCount.reportLocalCandidate = report;
            }
          });
          //lastResult = res;
        });

      },1000);
    },
    stop() {
      console.log("stop",this.socket);
      //       wsUrl: null,
      // roomId: null,
      // pcConfig: null,
      // socket: null,
      // pc: null,
      // pcDataChannel: null,
      // sender: null,
      // remoteStream: null,
      // localStream: null,
      // timeInterval: null,
      if(this.socket){
        this.socket.emit('leave', this.roomId); //notify server
      }
      this.hangup();
    },
    hangup(){
      console.log("hangup");
      if(this.pcDataChannel!=null){
        this.pcDataChannel.close();
        this.pcDataChannel = null;
      }
      if(this.pc) {
        this.pc.close();
        this.pc = null;
      }      
    },
    createPeerConnection() {
      console.log('create RTCPeerConnection!',this.pcConfig);
      this.pc = new RTCPeerConnection(this.pcConfig);
      this.pc.onicecandidate = (e)=>{
        //console.log("onicecandidate",e);
        if(e.candidate) {
          this.sendMessage(this.roomId, {
            type: 'candidate',
            label:e.candidate.sdpMLineIndex, 
            id:e.candidate.sdpMid, 
            candidate: e.candidate.candidate
          });
        }else{
          console.log('this is the end candidate');
        }
      }
      //this.pc.ontrack = this.getRemoteStream;
      this.pc.ontrack = (e)=>{
        console.log("ontrack info",e);
        this.remoteStream = e.streams[0];
        this.$refs.remoteVideo.srcObject = this.remoteStream;   
      }
      this.pc.ondatachannel = (event) => {
        console.log("pc.ondatachannel",event,event.channel.label);
        if(event.channel.label=="sendDataChannel"){//&& !this.pcDataChannel
          this.pcDataChannel = event.channel;
          this.pcDataChannel.onmessage = this.onReceiveMessage;
          this.pcDataChannel.onopen = this.onReceiveChannelStateChange;
          this.pcDataChannel.onclose = this.onReceiveChannelStateChange;
        }
      };      
      // if(this.localStream === null || this.localStream === undefined) {
      //   console.error('localstream is null or undefined!');
      // }else{
      //   this.localStream.getTracks().forEach((track)=>{
      //     console.log("this.pc.addTrack",track);
      //     this.pc.addTrack(track, this.localStream);	
      //   });
      // }
    },
    getAnswer(desc){
      console.log("getAnswer:",desc);
      //console.log("getAnswer sdp:",desc.sdp);
      this.pc.setLocalDescription(desc);
      this.sendMessage(this.roomId,desc);
    },
    handleAnswerError(err){
	    console.error('Failed to create answer:', err);
    },
    sendMessage(roomid,data){
      console.log('send message to other end', roomid, data);
      if(!this.socket){
        console.log('socket is null');
      }
      this.socket.emit('message', roomid, data);      
    },    
    ctrlCallback(data){
      //console.log("ctrlCallback",data);
      if(this.pcDataChannel!=null && this.pcDataChannel.readyState=='open'){
        console.log("发送的事件数据",JSON.stringify(data));
        this.pcDataChannel.send(JSON.stringify(data));
      }      
    },
    move(e){
      console.log("movestart");
      var offsetLeftOld = this.$refs.localVideoDiv.offsetLeft;
      var offsetTopOld = this.$refs.localVideoDiv.offsetTop;
      var clientXOld = e.clientX;
      var clientYOld = e.clientY;

      document.onmousemove = (e)=>{       //鼠标按下并移动的事件   
        let left = e.clientX - clientXOld;
        let top = e.clientY - clientYOld;
        this.$refs.localVideoDiv.style.left = offsetLeftOld + left+"px";
        this.$refs.localVideoDiv.style.top = offsetTopOld + top+"px";
      };
      document.onmouseup = (e) => {
        console.log("onmouseup");       
        document.onmousemove = null;
        document.onmouseup = null;
      };
    },
    audioOpenChange(){
      console.log("audioOpenChange",this.$refs.remoteVideo.muted);
      if(this.$refs.remoteVideo.muted){
        this.$refs.remoteVideo.muted = false;
      }else{
        this.$refs.remoteVideo.muted = true;
      }
    },
    onReceiveMessage(event) {
      console.log("收到事件数据",event.data);	
    },
    onReceiveChannelStateChange(event) {
      if(this.pcDataChannel!=null){
        var readyState = this.pcDataChannel.readyState;
        console.log("onReceiveChannelStateChange",event,readyState);
      }
    }  
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.videoDiv{
  float: left;
  position: relative;
}
.videoNav{
  text-align: left;
  font-size: 12px;
  background: rgba(0, 153, 145, 0.7);
  position: absolute;
  z-index: 1000;
}
.audioNav{
  text-align: left;
  font-size: 12px;
  background: rgba(107, 153, 0, 0.7);
  position: absolute;
  z-index: 1000;
  bottom: 0;
}
.localVideoDiv{
  background: rgba(111, 153, 145, 0.9);
  position: absolute;
  right: 0;
  z-index: 1000; 
  width:128px;   
  height:72px;
  cursor: move;
}
.remoteVideo{
  width:100%;
  height:100%;
  background-color:gainsboro;
  object-fit:fill;
}
.localVideo{
  width:100%;
  height:100%;
  background-color:gainsboro;
  object-fit:fill;  
}

</style>
