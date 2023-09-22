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
      <!-- <video id="remote-video" style="max-height:400px;background-color:gainsboro;"  autoplay></video> -->
      <!-- <video id="remote-video" style="height:840;width:1600;background-color:gainsboro;"  autoplay></video> -->
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
      videoWidth:640,
      videoHeight:360,
      wsUrl: "wss://localhost:8843",
      roomId: "room-multi",
      pcConfig: {"iceServers":[{"urls":["turn:rtctest.zdomain.top:3478"],"username":"admin","credential":"123456"}],"iceTransportPolicy":"all"},
      socket: null,
      pc: null,
      sender: null,
      srcSocketId: null,
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
      console.log("start",config);
      this.wsUrl = config.wsUrl;
      this.roomId = config.roomId;
      this.pcConfig = config.pcConfig;
      if(config.localStream!=null){
        this.localStream = config.localStream;
        this.$refs.localVideo.srcObject = this.localStream;
      }

      console.log("des wss连接"+this.wsUrl+" roomId="+this.roomId); 
      //this.socket = io.connect(this.wsUrl);
      this.socket = io.connect(this.wsUrl,{path: "/socket.io",transports: ["websocket"]});//this.wsUrl+"?token=123456"
      //this.socket = io.connect("https://192.168.1.105:8888",{path: "/socket.io",transports: ["websocket"]});
      //this.socket = io.connect(this.wsUrl+"?token=123456",{path: "/socket.io",transports: ["websocket"]});
      console.log(this.socket);
      this.socket.on('des-joined', (roomid, id) => {
        console.log('receive des-joined message!', roomid, id);
        this.socket.emit('get-ice-servers');
        //this.createPeerConnection();
      });
      this.socket.on('des-joined-fail', (roomid, id) => {
        console.log('receive des-joined-fail message!', roomid, id);
        this.$message({message: '加入房间失败',type: 'warning'}); 
        setTimeout(()=>{
          this.socket.emit('des-join', this.roomId);
        },3000);
      });
      this.socket.on('ice-servers', (header, data) => {
        console.log('receive ice-servers message!', header, data);
        if(typeof data === 'string'){
          data = JSON.parse(data);
        }
        this.pcConfig.iceServers = data;
        this.createPeerConnection();
      });
      
      this.socket.on('msg', (header,data) => {
        console.log('receive message:', header, data);
        if(typeof header === 'string'){
          header = JSON.parse(header);
        }
        if(header === null || header === undefined){
          console.error('the message is header invalid!');
          return;	
        }
        this.srcSocketId = header.fromSocketId;
        if(typeof data === 'string'){
          data = JSON.parse(data);
        }
        if(data === null || data === undefined){
          console.error('the message is invalid!');
          return;	
        }
        if(data.type === 'offer') {//data.hasOwnProperty('type') && 
          this.pc.setRemoteDescription(new RTCSessionDescription(data));
          this.pc.createAnswer()
            .then(this.getAnswer)
            .catch(this.handleAnswerError);
        }else if (data.type === 'candidate'){//data.hasOwnProperty('type') && 
          var candidate = new RTCIceCandidate({
            sdpMLineIndex: data.label,
            candidate: data.candidate
          });
          this.pc.addIceCandidate(candidate);	
        
        }else{
          console.log('the message is invalid!!!', data);
        }
      });

      this.socket.emit('des-join', this.roomId);
      this.startInterval();

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

    },
    localStreamChange(stream){//https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/removeTrack
      this.localStream = stream;
      this.$refs.localVideo.srcObject = stream;

      const senders = this.pc.getSenders();
      senders.forEach((sender) => {
        //this.pc.removeTrack(sender)
        console.log("sender",sender);
        if(sender.track!=null && sender.track.kind=='video'){
          console.log("sender.track.kind video");
          stream.getTracks().forEach((track)=>{
            //this.pc.addTrack(track, this.localStream);
            if(track!=null && track.kind=='video'){
              console.log("this.pc addTrack",track);
              sender.replaceTrack(track);
            }	           
          });
        }
      }); 
    },
    sizeChange(videoWidth,videoHeight){
      this.videoWidth = videoWidth;
      this.videoHeight = videoHeight;
    },
    createPeerConnection() {
      console.log('create RTCPeerConnection!',this.pcConfig);
      this.pc = new RTCPeerConnection(this.pcConfig);
      this.pc.onicecandidate = (e)=>{
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
      if(this.localStream === null || this.localStream === undefined) {
        console.error('localstream is null or undefined!');
      }else{
        this.localStream.getTracks().forEach((track)=>{
          console.log("this.pc.addTrack",track);
          this.pc.addTrack(track, this.localStream);	
          //this.pc.addTrack(track, this.localStream);	
        });
        // const [track] = this.localStream.getVideoTracks();
        // this.sender = this.pc.addTrack(track, this.localStream);
      }
    },
    getAnswer(desc){
      //desc.sdp = desc.sdp.replace(/VP/g,"H26411111111");
      console.log("getAnswer:",desc);
      console.log("getAnswer sdp:",desc.sdp);
      this.pc.setLocalDescription(desc);
      //answer.value = desc.sdp;
      //send answer sdp
      this.sendMessage(this.roomId,desc);
    },
    handleAnswerError(err){
	    console.error('Failed to create answer:', err);
    },
    sendMessage(roomid,data){
      if(!this.socket){
        console.error('sendMessage socket is null');
        return;
      }
      var header = {"roomId":roomid,"toSocketId":this.srcSocketId};
      console.log('send message to other end', JSON.stringify(header), JSON.stringify(data));
      this.socket.emit('msg', JSON.stringify(header), JSON.stringify(data));
    },
    ctrlCallback(data){
      console.log("ctrlCallback",data);
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
