<template>
  <div class="videoDiv" :style="'width:'+videoShowWidth+'px;height:'+videoShowHeight+'px'">
			<div >
					<label>文件传输</label>
					<input type="file" @change="handleFileChange" :disabled="fileDataChannel==null"/>
					<button type="button" @click="handleFileSend" :disabled="fileDataChannel==null">发送</button>
					<!-- <button type="button">中止</button>	 -->
					<progress :max="fileSize" :value="fileSendSize"></progress>	
					<span id="status"></span>
			</div>    
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
      <video :style="hideMouse?'cursor:none':'cursor:auto'" ref="remoteVideo" class="remoteVideo" autoplay playsinline></video>
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
      videoShowWidth:1280,
      videoShowHeight:720,
      videoWidth:0,
      videoHeight:0,  
      useMouseSlide: false,  
      hideMouse:false,
      lastX: null,
      lastY: null,  
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

      fileDataChannel: null,
      selectedFile:null,
      fileSize:0,
      fileSendSize:0,
    };
  },
  methods: {
    start(config) {
      console.log("start config",config);
      this.useMouseSlide = config.useMouseSlide;
      this.hideMouse = config.hideMouse;
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
        if (e.track.kind === 'video') {
            // 等待视频元数据加载完成
            this.$refs.remoteVideo.onloadedmetadata = ()=> {
                console.log('远程视频大小：', this.$refs.remoteVideo.videoWidth, this.$refs.remoteVideo.videoHeight);
                this.videoWidth = this.$refs.remoteVideo.videoWidth;
                this.videoHeight = this.$refs.remoteVideo.videoHeight;
            };
        }         
      }
      this.pc.ondatachannel = (event) => {
        console.log("pc.ondatachannel",event,event.channel.label);
        if(event.channel.label=="sendDataChannel"){//&& !this.pcDataChannel
          this.pcDataChannel = event.channel;
          this.pcDataChannel.onmessage = this.onReceiveMessage;
          this.pcDataChannel.onopen = this.onReceiveChannelStateChange;
          this.pcDataChannel.onclose = this.onReceiveChannelStateChange;
        }else if(event.channel.label=="fileDataChannel"){// && !pcFileChannel
          this.fileDataChannel = event.channel;
          this.fileDataChannel.onmessage = this.onReceiveMessageFile;
          this.fileDataChannel.onopen = this.onReceiveChannelStateChangeFile;
          this.fileDataChannel.onclose = this.onReceiveChannelStateChangeFile;	
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
      if(data.event=="onmousemove" && !this.useMouseSlide && this.videoWidth!=this.videoShowWidth && this.videoHeight!=this.videoShowHeight){//画布坐标系转屏幕坐标系
        data.event = "mousemove";
        data.x = parseInt(data.x * this.videoWidth / this.videoShowWidth);
        data.y = parseInt(data.y * this.videoHeight / this.videoShowHeight);
      }
      if(data.event=="onmousemove" && this.useMouseSlide){
        data.event = "mouseSlide";
        var nowX = parseInt(data.x * this.videoWidth / this.videoShowWidth);
        var nowY = parseInt(data.y * this.videoHeight / this.videoShowHeight);
        if(this.lastX == null || this.lastY ==null){
          this.lastX = nowX;
          this.lastY = nowY;
          return;
        }else{
          data.x = nowX - this.lastX;
          data.y = nowY - this.lastY;

          this.lastX = nowX;
          this.lastY = nowY;
        }
      }
      console.log("ctrlCallback",data);
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
    },
    onReceiveMessageFile(event) {
      console.log("收到事件数据",event.data);	
    },
    onReceiveChannelStateChangeFile(event) {
      if(this.pcDataChannel!=null){
        var readyState = this.pcDataChannel.readyState;
        console.log("onReceiveChannelStateChange",event,readyState);
      }
    },
    handleFileChange(event){
      // 获取选择的文件
      this.selectedFile = event.target.files[0];
      // 处理文件，例如上传到服务器或进行其他操作
      console.log('Selected File:', this.selectedFile);
      if (!this.selectedFile) {
        console.log('No file chosen');
      } else {
        // fileName = selectedFile.name;
        this.fileSize = this.selectedFile.size;
        // fileType = selectedFile.type;
        // lastModifyTime = file.lastModified;

        this.sendMessage(this.roomId, {
          type: 'fileInfo',
          name: this.selectedFile.name,
          size: this.selectedFile.size,
          filetype: this.selectedFile.type,
          lastmodify: this.selectedFile.lastModified
        });
        // btnSendFile.disabled = false;
        this.fileSendSize = 0;
      }
    }, 
    handleFileSend(){
      console.log("handleFileSend");
      var offset = 0;
      var chunkSize = 16384;
      var file = this.selectedFile;
      //console.log(`File is ${[file.name, file.size, file.type, file.lastModified].join(' ')}`);

      // Handle 0 size files.
      //statusMessage.textContent = '';
      //downloadAnchor.textContent = '';
      if (file.size === 0) {
        //bitrateDiv.innerHTML = '';
        //statusMessage.textContent = 'File is empty, please select a non-empty file';
        return;
      }

      //sendProgress.max = file.size;

      var fileReader = new FileReader();
      fileReader.onerror = error => console.error('Error reading file:', error);
      fileReader.onabort = event => console.log('File reading aborted:', event);
      fileReader.onload = e => {
        console.log('FileRead.onload ', e);
        this.fileDataChannel.send(e.target.result);
        offset += e.target.result.byteLength;
        this.fileSendSize = offset;
        if (offset < file.size) {
          readSlice(offset);
          //btnAbort.disabled = false;
        }else{
          //btnAbort.disabled = true;
        }
      }

      var readSlice = o => {
        console.log('readSlice ', o);
        const slice = file.slice(offset, o + chunkSize);
        fileReader.readAsArrayBuffer(slice);
      };

      readSlice(0);      
    },   
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
