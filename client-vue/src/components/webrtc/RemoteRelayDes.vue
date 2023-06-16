<template>
  <div class="hello">
    <div>
        <span>relay画面:</span>
        <!-- <video id="remote-video" style="max-height:400px;background-color:gainsboro;"  autoplay></video> -->
        <!-- <video id="remote-video" style="height:840;width:1600;background-color:gainsboro;"  autoplay></video> -->
        <video ref="remoteVideo" id="remotevideo" style="height:360px;width:640px;background-color:gainsboro;object-fit:fill;" autoplay playsinline></video>
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
      wsUrl: "wss://localhost:8843",
      roomId: "room-multi",
      pcConfig: {"iceServers":[{"urls":["stun:stun.l.google.com:19302"]},{"urls":["turn:rtctest.zdomain.top:3478"],"username":"admin","credential":"123456"}],"iceTransportPolicy":"all"},
      socket: null,
      pc: null,
      pcDesSessionMap: new Map(),
      srcSocketId: null,
      remoteStream: null,
    };
  },
  methods: {
    start(config) {
      console.log("start",config);
      this.wsUrl=config.wsUrl;
      this.roomId=config.roomId;
      this.pcConfig=config.pcConfig;

      console.log("this.socket="+this.wsUrl);
      this.socket = io.connect(this.wsUrl,{path: "/socket.io",transports: ["websocket"]});
      console.log(this.socket);
      this.socket.on('des-joined', (roomid, id) => {
        console.log('receive des-joined message!', roomid, id);
        this.createPeerConnection();
      });

      this.socket.on('des-join', (roomid,desDocketId) => {
        console.log('receive des-join message:', roomid, desDocketId);
        if(this.roomId!=roomid){//
          this.createPeerConnectionMysrc(desDocketId);
        }
        

        // call(desDocketId);	
        // console.log('receive des-join message, desDocketId=', desDocketId);
      });
      
      this.socket.on('msg', (header,data) => {
        console.log('receive message!', header, data);

        if(typeof data === 'string'){
          data = JSON.parse(data);
        }
        if(data === null || data === undefined){
          console.error('the message is invalid!');
          return;	
        }

        var peer = null;
        var sessionInfo = this.pcDesSessionMap.get(header.fromSocketId);
        if(sessionInfo==null){
          peer = this.pc;
          this.srcSocketId = header.fromSocketId;
        }else{
          peer = sessionInfo.peer;
        }

        if(data.type === 'offer') {//data.hasOwnProperty('type') && 
          
          this.pc.setRemoteDescription(new RTCSessionDescription(data));
          this.pc.createAnswer()
            .then(this.getAnswer)
            .catch(this.handleAnswerError);
        }else if(data.type == 'answer'){
			    peer.setRemoteDescription(new RTCSessionDescription(data));
		
        }else if (data.type === 'candidate'){//data.hasOwnProperty('type') && 
          var candidate = new RTCIceCandidate({
            sdpMLineIndex: data.label,
            candidate: data.candidate
          });
          peer.addIceCandidate(candidate);	
        
        }else{
          console.log('the message is invalid!!!', data);
        }
      });

      this.socket.emit('des-join', this.roomId);
      this.socket.emit('src-join', this.roomId+"2");
    },
    createPeerConnection() {
      console.log('create RTCPeerConnection!');
      this.pc = new RTCPeerConnection(this.pcConfig);
      var roomIdThat = this.roomId;
      this.pc.onicecandidate = (e)=>{
        if(e.candidate) {
          this.sendMessage(roomIdThat, {
            type: 'candidate',
            label:e.candidate.sdpMLineIndex, 
            id:e.candidate.sdpMid, 
            candidate: e.candidate.candidate
          });
        }else{
          console.log('this is the end candidate');
        }
      }
      this.pc.ontrack = this.getRemoteStream;

    },
    createPeerConnectionMysrc(desSocketId){
      var vm = this;
      console.log('create RTCPeerConnection! '+desSocketId);
      var sessionInfo = this.pcDesSessionMap.get(desSocketId);
      var peer = null;
      if(!sessionInfo){
        // if(document.querySelector('#useRelay').checked){
        //   pcConfig.iceTransportPolicy="relay";
        // }else{
        //   pcConfig.iceTransportPolicy="all";
        // }
        //console.log("pcConfig",pcConfig);		
        peer = new RTCPeerConnection(this.pcConfig);
        this.pcDesSessionMap.set(desSocketId,{"peer":peer});
        peer.onicecandidate = (e)=>{
          if(e.candidate) {
            this.sendMessageDes(this.roomId+"2",desSocketId, {
              type: 'candidate',
              label:e.candidate.sdpMLineIndex, 
              id:e.candidate.sdpMid, 
              candidate: e.candidate.candidate
            });
          }else{
            console.log('this is the end candidate');
          }
        }		
      }else {
        console.warning('the pc have be created!');
      }

      

      if(peer === null || peer === undefined) {
        console.error('pc is null or undefined!');
        return;
      }

      if(this.remoteStream === null || this.remoteStream === undefined) {
        console.error('remoteStream is null or undefined!');
        return;
      }
      //add all track into peer connection
      this.remoteStream.getTracks().forEach((track)=>{
        peer.addTrack(track, vm.remoteStream);	
      });
      console.log('bind copy tracks into RTCPeerConnection! ' +desSocketId);

      console.log("call createOffer "+desSocketId);
      //if(state === 'joined_conn'){

      var offerOptions = {
        offerToRecieveAudio: 1,
        offerToRecieveVideo: 1
      }
      // var peer = this.pcDesSessionMap.get(desSocketId).peer;
      // console.log("peer createOffer",peer);
      peer.createOffer(offerOptions)
        .then((desc)=>{
          peer.setLocalDescription(desc);
          //offer.value = desc.sdp;
          //offerdesc = desc;
          //send offer sdp
          this.sendMessageDes(this.roomId+"2",desSocketId, desc);	
        
        })
        .catch(this.handleOfferError);
      return;
    },
    getRemoteStream(e){
      console.log("ontrack info",e);
      this.remoteStream = e.streams[0];
      this.$refs.remoteVideo.srcObject = this.remoteStream;
    },
    getAnswer(desc){
      console.log("createAnswerzzzzzzz");
      this.pc.setLocalDescription(desc);
      //answer.value = desc.sdp;
      //send answer sdp
      this.sendMessage(this.roomId,desc);
    },
    handleAnswerError(err){
	    console.error('Failed to create answer:', err);
    },
    handleOfferError(err){
	    console.error('Failed to create offer:', err);
    },
    sendMessage(roomid,data){
      if(!this.socket){
        console.log('socket is null');
        return;
      }
      console.log("sendMessage");
      var header = {"roomId":roomid,"toSocketId":this.srcSocketId};
      console.log('send msg to other end', header, data);
      this.socket.emit('msg', header, data);
    },
    sendMessageDes(roomid,desSocketId,data){
      console.log('send message to other end', roomid, data);
      if(!this.socket){
        console.log('socket is null');
        return;
      }
      this.socket.emit('msg', {"roomId":roomid,"toSocketId":desSocketId}, data);
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
