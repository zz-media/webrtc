'use strict'

var localVideo = document.querySelector('video#localvideo');
var remoteVideo = document.querySelector('video#remotevideo');

var btnConn =  document.querySelector('button#connserver');
var btnLeave = document.querySelector('button#leave');

var offer = document.querySelector('textarea#offer');
var answer = document.querySelector('textarea#answer');

var shareDeskBox  = document.querySelector('input#shareDesk');

var pcConfig = {
  'iceServers': [{
    'urls': 'turn:stun.al.learningrtc.cn:3478',
    'credential': "mypasswd",
    'username': "garrylea"
  }]
};

var localStream = null;
var remoteStream = null;

var pc = null;

var roomid;
var socket = null;

var offerdesc = null;
var state = 'init';

function sendMessage(roomid, data){

	console.log('send message to other end', roomid, data);
	if(!socket){
		console.log('socket is null');
	}
	socket.emit('message', roomid, data);
}

function conn(){
	var socketHost = document.querySelector('#socketHost').value;
	if(socketHost.length>0){
		console.log("socketHost /soc",socketHost);
		//socket = io.connect(socketHost);
		socket = io.connect(socketHost,{path:"/soc",transports: ["websocket"]});
	}else{
		console.log("socketHost default");
		socket = io.connect();
	}

	socket.on('joined', (roomid, id) => {
		console.log('receive joined message!', roomid, id);
		state = 'joined'
		//如果是多人的话，第一个人不该在这里创建peerConnection
		//都等到收到一个otherjoin时再创建
		//所以，在这个消息里应该带当前房间的用户数
		//create conn and bind media track
		createPeerConnection();
		bindTracks();

		btnConn.disabled = true;
		btnLeave.disabled = false;
		console.log('receive joined message, state=', state);
	});

	socket.on('otherjoin', (roomid) => {
		console.log('receive joined message:', roomid, state);
		//如果是多人的话，每上来一个人都要创建一个新的 peerConnection
		if(state === 'joined_unbind'){
			createPeerConnection();
			bindTracks();
		}
		state = 'joined_conn';
		call();
		console.log('receive other_join message, state=', state);
	});

	socket.on('full', (roomid, id) => {
		console.log('receive full message', roomid, id);
		hangup();
		closeLocalMedia();
		state = 'leaved';
		console.log('receive full message, state=', state);
		alert('the room is full!');
	});

	socket.on('leaved', (roomid, id) => {
		console.log('receive leaved message', roomid, id);
		state='leaved'
		socket.disconnect();
		console.log('receive leaved message, state=', state);

		btnConn.disabled = false;
		btnLeave.disabled = true;
	});

	socket.on('bye', (room, id) => {
		console.log('receive bye message', roomid, id);
		//state = 'created';
		//当是多人通话时，应该带上当前房间的用户数
		//如果当前房间用户不小于 2, 则不用修改状态
		//并且，关闭的应该是对应用户的peerconnection
		//在客户端应该维护一张peerconnection表，它是
		//一个key:value的格式，key=userid, value=peerconnection
		state = 'joined_unbind';
		hangup();
		offer.value = '';
		answer.value = '';
		console.log('receive bye message, state=', state);
	});

	socket.on('disconnect', (socket) => {
		console.log('receive disconnect message!', roomid);
		if(!(state === 'leaved')){
			hangup();
			closeLocalMedia();

		}
		state = 'leaved';
	
	});

	socket.on('message', (roomid, data) => {
		console.log('receive message!', roomid, data);

		if(data === null || data === undefined){
			console.error('the message is invalid!');
			return;	
		}

		if(data.hasOwnProperty('type') && data.type === 'offer') {		
			offer.value = data.sdp;
			pc.setRemoteDescription(new RTCSessionDescription(data));
			pc.createAnswer()
				.then(getAnswer)
				.catch(handleAnswerError);
		}else if(data.hasOwnProperty('type') && data.type == 'answer'){
			answer.value = data.sdp;
			pc.setRemoteDescription(new RTCSessionDescription(data));
		}else if (data.hasOwnProperty('type') && data.type === 'candidate'){
			var candidate = new RTCIceCandidate({
				sdpMLineIndex: data.label,
				candidate: data.candidate
			});
			pc.addIceCandidate(candidate);
		}else{
			console.log('the message is invalid!', data);
		
		}
	
	});

	roomid = document.querySelector('#roomId').value;
	socket.emit('join', roomid);
	return true;
}


function getMediaStream(stream){
	localStream = stream;	
	localVideo.srcObject = localStream;
	conn();
}

function getDeskStream(stream){
	localStream = stream;
}

function handleError(err){
	console.error('Failed to get Media Stream!', err);
}

function start(){
	if(!navigator.mediaDevices ||
		!navigator.mediaDevices.getUserMedia){
		console.error('the getUserMedia is not supported!');
		return;
	}
	navigator.mediaDevices.getDisplayMedia({video: true})
	.then(getMediaStream)
	.catch(handleError);
}

function getRemoteStream(e){
	remoteStream = e.streams[0];
	remoteVideo.srcObject = e.streams[0];
}

function handleOfferError(err){
	console.error('Failed to create offer:', err);
}

function handleAnswerError(err){
	console.error('Failed to create answer:', err);
}

function getAnswer(desc){
	pc.setLocalDescription(desc);
	answer.value = desc.sdp;

	//send answer sdp
	sendMessage(roomid, desc);
}

function getOffer(desc){
	pc.setLocalDescription(desc);
	offer.value = desc.sdp;
	offerdesc = desc;

	//send offer sdp
	sendMessage(roomid, offerdesc);	

}

function createPeerConnection(){
	//如果是多人的话，在这里要创建一个新的连接.
	//新创建好的要放到一个map表中。
	//key=userid, value=peerconnection
	console.log('create RTCPeerConnection!');
	if(!pc){
		pc = new RTCPeerConnection(pcConfig);
		pc.onicecandidate = (e)=>{
			if(e.candidate) {
				sendMessage(roomid, {
					type: 'candidate',
					label:e.candidate.sdpMLineIndex, 
					id:e.candidate.sdpMid, 
					candidate: e.candidate.candidate
				});
			}else{
				console.log('this is the end candidate');
			}
		}
		pc.ontrack = getRemoteStream;
	}else {
		console.warning('the pc have be created!');
	}
	return;	
}

//绑定永远与 peerconnection在一起，
//所以没必要再单独做成一个函数
function bindTracks(){
	console.log('bind tracks into RTCPeerConnection!');
	if( pc === null || pc === undefined) {
		console.error('pc is null or undefined!');
		return;
	}
	if(localStream === null || localStream === undefined) {
		console.error('localstream is null or undefined!');
		return;
	}
	//add all track into peer connection
	localStream.getTracks().forEach((track)=>{
		pc.addTrack(track, localStream);	
	});
}

function call(){
	if(state === 'joined_conn'){
		var offerOptions = {
			offerToRecieveAudio: 1,
			offerToRecieveVideo: 1
		}
		pc.createOffer(offerOptions)
			.then(getOffer)
			.catch(handleOfferError);
	}
}

function hangup(){
	if(pc) {
		offerdesc = null;
		pc.close();
		pc = null;
	}

}

function closeLocalMedia(){
	if(localStream && localStream.getTracks()){
		localStream.getTracks().forEach((track)=>{
			track.stop();
		});
	}
	localStream = null;
}

function leave() {
	if(socket){
		socket.emit('leave', roomid); //notify server
	}
	hangup();
	closeLocalMedia();

	offer.value = '';
	answer.value = '';
	btnConn.disabled = false;
	btnLeave.disabled = true;
}

btnConn.onclick = start;
//btnConn.onclick = conn;
btnLeave.onclick = leave;
