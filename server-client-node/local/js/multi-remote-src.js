const { desktopCapturer } = require('electron')
var robot = require("@jitsi/robotjs");
//var config = require('../config/config.json');
var config = require("./js/util/app-config").getConfigJson();
var localVideo = document.querySelector('video#localvideo');
// var remoteVideo = document.querySelector('video#remotevideo');

var btnConn =  document.querySelector('button#connserver');
var btnLeave = document.querySelector('button#leave');
var callBtn = document.querySelector('button#callBtn');
var optBw = document.querySelector('select#bandwidth')

var offer = document.querySelector('textarea#offer');
var answer = document.querySelector('textarea#answer');
// 文件传输
var receiveProgress = document.querySelector('progress#receiveProgress');

//var pcConfig = {"iceServers":[{"urls":["stun:stun.l.google.com:19302"]},{"urls":["turn:linux.zdomain.top:3478"],"username":"admin","credential":"123456"}],"iceTransportPolicy":"all"};
var pcConfig = config.iceConfig;
var localStream = null;
// var remoteStream = null;
var sessionMap = new Map();

var pc = null;

var roomid=document.querySelector('#roomId').value;
var socket = null;

var offerdesc = null;
var state = 'init';

document.querySelector('#screensize').innerHTML=`宽高比${JSON.stringify(robot.getScreenSize())}`;

function sendMessage(roomid,desSocketId,data){

	console.log('send message to other end', roomid, data);
	if(!socket){
		console.log('socket is null');
	}
	socket.emit('msg', {"roomId":roomid,"toSocketId":desSocketId}, data);
}

function conn(){
	// socketRobot = io("wss://127.0.0.1:8443");
	// socketRobot.emit('join', roomid);
	roomid=document.querySelector('#roomId').value;
	console.log("roomid="+roomid);	

	console.log("startLocalWebServer="+config.startLocalWebServer);
	if(config.startLocalWebServer){
		var socketUrl = "wss://"+config.httpsServerAddress+":"+config.httpsServerPort;
		var webUrl = "https://"+config.httpsServerAddress+":"+config.httpsServerPort+"/peer/multi-remote-des.html?wss="+socketUrl;
		document.querySelector('#socketInfo').innerHTML = "socket地址："+socketUrl;
		document.querySelector('#webAddress').innerHTML = "web访问地址："+webUrl+" 地址2 "+"http://localhost/peer/multi-remote-des.html?wss=ws://localhost:80"
			+" 地址3 "+"https://"+config.httpsServerAddress+":"+config.httpsServerPort+"/media-web/index.html#/SupervisionList";
		socket = io.connect(socketUrl);
	}else{
		var socketUrl = "wss://"+config.httpsServerAddress+":"+config.httpsServerPort;
		var webUrl = "https://"+config.httpsServerAddress+":"+config.httpsServerPort+"/peer/multi-remote-des.html?wss="+socketUrl+"&wssPath=/soc";
		document.querySelector('#socketInfo').innerHTML = "socket地址："+socketUrl;
		document.querySelector('#webAddress').innerHTML = "web访问地址："+webUrl;
		socket = io.connect(socketUrl,{path:"/soc",transports: ["websocket"]});
	}	

	socket.on('connect_error', e => {
		console.log('connect_error', e);
	  });

	socket.on('src-joined', (roomid, id) => {
		console.log('receive src-joined message!', roomid, id);
		state = 'joined'
		// createPeerConnection();

		btnConn.disabled = true;
		btnLeave.disabled = false;
	});

	socket.on('des-join', (roomid,desDocketId) => {
		console.log('receive des-join message:', roomid, desDocketId);

		//如果是多人的话，每上来一个人都要创建一个新的 peerConnection
		//
		//if(state === 'joined_unbind' || state === 'joined'){
			createPeerConnection(desDocketId);
		//}	

		state = 'joined_conn';
		call(desDocketId);	
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

	socket.on('msg', (header, data) => {
		console.log('receive message!', header, data);
		var sessionInfo = sessionMap.get(header.fromSocketId);
		var peer = sessionInfo.peer;
		if(typeof data === 'string'){
			data = JSON.parse(data);
		}

		if(data === null || data === undefined){
			console.error('the message is invalid!');
			return;	
		}

		if(data.hasOwnProperty('type') && data.type == 'answer'){
			answer.value = data.sdp;
			peer.setRemoteDescription(new RTCSessionDescription(data));
		
		}else if (data.hasOwnProperty('type') && data.type === 'candidate'){
			var candidate = new RTCIceCandidate({
				sdpMLineIndex: data.label,
				candidate: data.candidate
			});
			peer.addIceCandidate(candidate);	
		
		}else if (data.hasOwnProperty('type') && data.type === 'need_offer'){
			call2(data.fromSocketId);
		}else if(data.hasOwnProperty('type') && data.type === 'fileinfo'){
			console.log('fileinfo',data);
			fileName = data.name;
			fileType = data.filetype;
			fileSize = data.size;
			lastModifyTime = data.lastModify;	
			receiveProgress.max = fileSize;
		}
		else{
			console.log('the message is invalid!', data);
		
		}
	
	});

	socket.emit('src-join', roomid);

	return true;
}

function connSignalServer(){
	
	//开启本地视频
	start();

	return true;
}

function getMediaStream(stream){

	// if(localStream){
	// 	stream.getAudioTracks().forEach((track)=>{
	// 		localStream.addTrack(track);	
	// 		stream.removeTrack(track);
	// 	});
	// }else{
	// 	localStream = stream;	
	// }
	localStream = stream;
	localStream.getTracks().forEach((track)=>{
		//logger.info(track, localStream);
		//视频流信息
		console.log(track.getSettings());
		// videoWidth = track.getSettings().width;
		// videoHeight = track.getSettings().height;
		console.log("videoWidth="+track.getSettings().width+",videoHeight="+track.getSettings().height);
	});	
	if(document.querySelector('#videoShowLocal').checked){
		localVideo.srcObject = localStream;
	}

	//这个函数的位置特别重要，
	//一定要放到getMediaStream之后再调用
	//否则就会出现绑定失败的情况
	//
	//setup connection
	conn();

	//btnStart.disabled = true;
	//btnCall.disabled = true;
	//btnHangup.disabled = true;
}


function handleError(err){
	console.error('Failed to get Media Stream!', err);
}


function start(){
	desktopCapturer.getSources({
		types: ['screen'],
		thumbnailSize: {
			width: 320,
			height: 240,
		}
	}).then( sources =>{
		console.log("sources",sources);
		var source = sources[0];
		var constraints = {
			audio: false,
			video: {
				mandatory: {
					chromeMediaSource: 'desktop',
					chromeMediaSourceId: source.id			
				}
			}
		}
		navigator.mediaDevices.getUserMedia(constraints)
		.then(getMediaStream)
		.catch(handleError);		
	}).catch( error => {
		console.error('desktopCapturer.getSources 失败',error);
	});		
}

function handleOfferError(err){
	console.error('Failed to create offer:', err);
}


function createPeerConnection(desSocketId){

	//如果是多人的话，在这里要创建一个新的连接.
	//新创建好的要放到一个map表中。
	//key=userid, value=peerconnection
	console.log('create RTCPeerConnection!');
	var sessionInfo = sessionMap.get(desSocketId);
	if(!sessionInfo){
		if(document.querySelector('#useRelay').checked){
			pcConfig.iceTransportPolicy="relay";
		}else{
			pcConfig.iceTransportPolicy="all";
		}
		//console.log("pcConfig",pcConfig);		
		var peer = new RTCPeerConnection(pcConfig);
		sessionMap.set(desSocketId,{"peer":peer});
		peer.onicecandidate = (e)=>{
			if(e.candidate) {
				sendMessage(roomid,desSocketId, {
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

	console.log('bind tracks into RTCPeerConnection!');

	if(peer === null || peer === undefined) {
		console.error('pc is null or undefined!');
		return;
	}

	if(localStream === null || localStream === undefined) {
		console.error('localstream is null or undefined!');
		return;
	}
	//add all track into peer connection
	localStream.getTracks().forEach((track)=>{
		peer.addTrack(track, localStream);	
	});
	return;	
}
function call(desSocketId){

	//if(state === 'joined_conn'){

	var offerOptions = {
		offerToRecieveAudio: 1,
		offerToRecieveVideo: 1
	}
	var peer = sessionMap.get(desSocketId).peer;
	console.log("peer createOffer",peer);
	peer.createOffer(offerOptions)
		.then((desc)=>{
			peer.setLocalDescription(desc);
			offer.value = desc.sdp;
			offerdesc = desc;
		
			//send offer sdp
			sendMessage(roomid,desSocketId, offerdesc);	
		
		})
		.catch(handleOfferError);
	//}
}
function call2(desSocketId){



		var offerOptions = {
			offerToRecieveAudio: 1,
			offerToRecieveVideo: 1
		}

		var peer = sessionMap.get(desSocketId).peer;
		console.log("peer createOffer",peer);
		peer.createOffer(offerOptions)
			.then((desc)=>{
				peer.setLocalDescription(desc);
				offer.value = desc.sdp;
				offerdesc = desc;
			
				//send offer sdp
				sendMessage(roomid,desSocketId, offerdesc);	
			
			})
			.catch(handleOfferError);

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

//控制传输速率
function chang_bw(){
	//optBw.disabled =true;
	var bw = optBw.options[optBw.selectedIndex].value;
	
	var vsender = null;
	var senders = pc.getSenders();
	senders.forEach(sender=>{
		if(sender&&sender.track && sender.track.kind === 'video'){
			vsender = sender;
		}	
	});
	var parameters= vsender.getParameters();
	if(!parameters.encodings){
		return;
	}
	if(bw === 'unlimited'){
		return;
	}
	console.log("parameters",parameters);
	parameters.encodings[0].maxBitrate = bw * 1000;
	vsender.setParameters(parameters)
		   .then(()=>{
		   		optBw.disabled =false;
		   	 console.log('Successed to set parameters!');
		   })
		   .catch(err=>{
		   		 console.error(err);
		   })
	
}

btnConn.onclick = connSignalServer;
btnLeave.onclick = leave;
callBtn.onclick = call2;
optBw.onchange=chang_bw;

//页面加载启动
start();