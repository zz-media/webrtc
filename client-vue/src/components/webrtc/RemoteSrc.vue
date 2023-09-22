<template>
  <div class="hello">
    <div class="videoDiv">
        <div class="videoNav">
          bytes:{{reportCount.bytes}}<br/>
          packets:{{reportCount.packets}}<br/>
          frames:{{reportCount.currentReport!=null?reportCount.currentReport.framesPerSecond:0}}<br/>
          delay:{{reportCount.currentReport!=null?reportCount.currentReport.totalSquaredInterFrameDelay:0}}
        </div>
        <!-- <video id="remote-video" style="max-height:400px;background-color:gainsboro;"  autoplay></video> -->
        <!-- <video id="remote-video" style="height:840;width:1600;background-color:gainsboro;"  autoplay></video> -->
        <!-- controls controlslist="nodownload nofullscreen noremoteplayback" -->
        <video ref="localVideo" class="localVideo" autoplay muted playsinline></video>
    </div>
    <div class="remoteVideoListDiv">
      <div class="remoteVideoDiv" v-for="session in sessionList" :key="session.desSocketId">
        <video :ref="'remoteVideo-'+session.desSocketId" class="remoteVideo" autoplay playsinline></video>
      </div>
    </div>
  </div>
</template>

<script>
import io from 'socket.io-client';

export default {
  props: {

  },
  data() {
    return {
      wsUrl: "wss://localhost",
      roomId: "room-multi",
      pcConfig: {"iceServers":[{"urls":["turn:rtctest.zdomain.top:3478"],"username":"admin","credential":"123456"}],"iceTransportPolicy":"all"},
      socket: null,
      //pc: null,
      sessionMap: new Map(),
      sessionMapChangeTag: 0,
      srcSocketId: null,
      localStream: null,
      timeInterval: null,

      reportCount:{
        lastReport: null,
        currentReport: null,
        bytes: 0,
        packets: 0,
      }
    };
  },
  computed:{
    sessionList() {
      var x = this.sessionMapChangeTag; //监听到参数的变化  并改变map
      return Array.from(this.sessionMap.values());
    }    
  },
  methods: {
    start(config) {
      console.log("start",config.localStream);
      this.localStream = config.localStream;
      this.$refs.localVideo.srcObject = this.localStream; 


      this.wsUrl=config.wsUrl;
      this.roomId=config.roomId;
      this.pcConfig=config.pcConfig;

      console.log("SRC wss连接"+this.wsUrl+" roomId="+this.roomId); 
      //this.socket = io.connect(this.wsUrl);
      this.socket = io.connect(this.wsUrl,{path: "/socket.io",transports: ["websocket"]});//this.wsUrl+"?token=123456"
      //this.socket = io.connect("https://192.168.1.105:8888",{path: "/socket.io",transports: ["websocket"]});
      //this.socket = io.connect("http://10.52.8.25:19000",{path: 'socket.io',transports: ['websocket']})
      console.log(this.socket);
      this.socket.on('src-joined', (roomid, id) => {
        console.log('receive src-joined message!', roomid, id);
        this.socket.emit('get-ice-servers');
      });
      this.socket.on('ice-servers', (header, data) => {
        console.log('receive ice-servers message!', header, data);
        if(typeof data === 'string'){
          data = JSON.parse(data);
        }
        this.pcConfig.iceServers = data;
      });      
      this.socket.on('des-join', (roomid,desDocketId) => {
        console.log('receive des-join message:', roomid, desDocketId);
        this.createPeerConnection(desDocketId);

      });     

      this.socket.on('msg', (header, data) => {
        console.log('receive message!', header, data);
        if(typeof header === 'string'){
          header = JSON.parse(header);
        }
        if(header === null || header === undefined){
          console.error('the message header is invalid!');
          return;	
        }
        var sessionInfo = this.sessionMap.get(header.fromSocketId);
        var peer = sessionInfo.peer;
        if(typeof data === 'string'){
          data = JSON.parse(data);
        }

        if(data === null || data === undefined){
          console.error('the message is invalid!');
          return;	
        }

        if(data.type == 'answer'){//data.hasOwnProperty('type') && 
          //answer.value = data.sdp;
          peer.setRemoteDescription(new RTCSessionDescription(data));
        
        }else if (data.type === 'candidate'){
          var candidate = new RTCIceCandidate({
            sdpMLineIndex: data.label,
            candidate: data.candidate
          });
          peer.addIceCandidate(candidate);	
        
        }else if (data.type === 'need_offer'){
          //call2(data.fromSocketId);
        }else if(data.type === 'fileinfo'){
          console.log('fileinfo',data);
          // fileName = data.name;
          // fileType = data.filetype;
          // fileSize = data.size;
          // lastModifyTime = data.lastModify;	
          // receiveProgress.max = fileSize;
        }
        else{
          console.log('the message is invalid!', data);
        
        }
      
      });

      this.socket.emit('src-join', this.roomId);
    },
    createPeerConnection(desSocketId){
      var vm = this;
      //如果是多人的话，在这里要创建一个新的连接.
      //新创建好的要放到一个map表中。
      //key=userid, value=peerconnection
      
      var sessionInfo = this.sessionMap.get(desSocketId);
      var peer = null;
      if(!sessionInfo){
        console.log('create new RTCPeerConnection:'+desSocketId,this.pcConfig);
        // if(document.querySelector('#useRelay').checked){
        //   pcConfig.iceTransportPolicy="relay";
        // }else{
        //   pcConfig.iceTransportPolicy="all";
        // }
        //console.log("pcConfig",pcConfig);		
        peer = new RTCPeerConnection(this.pcConfig);
        this.sessionMap.set(desSocketId,{"desSocketId":desSocketId,"peer":peer});
        this.sessionMapChangeTag++;
        console.log('RTCPeerConnection nums:'+this.sessionMap.size);
        peer.onicecandidate = (e)=>{
          if(e.candidate) {
            this.sendMessage(this.roomId,desSocketId, {
              type: 'candidate',
              label:e.candidate.sdpMLineIndex, 
              id:e.candidate.sdpMid, 
              candidate: e.candidate.candidate
            });
          }else{
            console.log('this is the end candidate');
          }
        };
        peer.ontrack = (e)=>{
          // console.log("peer.ontrack",this.$refs['remoteVideo']);
          // console.log("peer.ontrack-2",this.$refs['remoteVideo-'+desSocketId][0]);
          //this.$refs['remoteVideo'].srcObject = e.streams[0];
          this.$refs['remoteVideo-'+desSocketId][0].srcObject = e.streams[0];     
        };		
      }else {
        console.error('the pc have be created!');
      }

      console.log('bind tracks into RTCPeerConnection!');

      if(peer === null || peer === undefined) {
        console.error('pc is null or undefined!');
        return;
      }

      if(this.localStream === null || this.localStream === undefined) {
        console.error('localstream is null or undefined!');
        return;
      }
      //add all track into peer connection
      this.localStream.getTracks().forEach((track)=>{
        peer.addTrack(track, this.localStream);	
      });

      var offerOptions = {
        offerToRecieveAudio: 1,
        offerToRecieveVideo: 1
      }
      // var peer = sessionMap.get(desSocketId).peer;
      // console.log("peer createOffer",peer);
      peer.createOffer(offerOptions)
        .then((desc)=>{
          peer.setLocalDescription(desc);
          vm.sendMessage(vm.roomId,desSocketId, desc);	 
        })
        .catch(this.handleOfferError);
      
      return;	
    },
    sendMessage(roomid,desSocketId,data){
      if(!this.socket){
        console.log('socket is null');
        return;
      }
      var header = {"roomId":roomid,"toSocketId":desSocketId};
      console.log('send message to other end', JSON.stringify(header), JSON.stringify(data));
      this.socket.emit('msg', JSON.stringify(header), JSON.stringify(data));
    },
    handleOfferError(err){
      console.error('Failed to create offer:', err);
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.videoDiv{
  height:360px;
  width:640px;  
}
.videoNav{
  text-align: left;
  font-size: 12px;
  background: rgba(0, 153, 145, 0.7);
  position: absolute;
  z-index: 1000;
}
.localVideo{
  height:360px;
  width:640px;
  background-color:gainsboro;
  object-fit:fill;
}
.remoteVideoListDiv{
  text-align: left;
}
.remoteVideoDiv{
  background: rgba(111, 153, 145, 0.9);
  width:128px;   
  height:72px;
  float: left;
  margin: 3px;
}
.remoteVideo{
  width:128px;   
  height:72px;
  background-color:gainsboro;
  object-fit:fill;  
}
</style>
