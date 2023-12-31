'use strict'


var remoteVideo = document.querySelector('video#remotevideo');

var btnConn =  document.querySelector('button#connserver');
var btnLeave = document.querySelector('button#leave');

var sendDataBtn = document.querySelector("button#sendDataBtn");

var offer = document.querySelector('textarea#offer');
var answer = document.querySelector('textarea#answer');

// 文件传输
var fileInput = document.querySelector('input#fileInput');
var sendProgress = document.querySelector('progress#sendProgress');
var btnSendFile = document.querySelector('button#sendFile');
var btnAbort = document.querySelector('button#abortButton');
var statusMessage = document.querySelector('span#status');


var pcConfig = {"iceServers":[{"urls":["stun:stun.l.google.com:19302"]},{"urls":["turn:rtctest.zdomain.top:3478"],"username":"admin","credential":"123456"}],"iceTransportPolicy":"all"};

var localStream = null;
var remoteStream = null;

var sessionMap = new Map();
var pc = null;

var roomid=document.querySelector('#roomId').value;
console.log("roomid="+roomid);
var socket = null;

var offerdesc = null;
var state = 'init';

// 文件传输
var fileReader = null;

var fileName = "";
var fileSize = 0;
var lastModifyTime = 0;
var fileType = "data";

// var receiveBuffer = [];
// var receivedSize = 0;

var srcSocketId = null;

//获取url参数
function getQueryVariable(variable){
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	for (var i=0;i<vars.length;i++) {
		var pair = vars[i].split("=");
		if(pair[0] == variable){return pair[1];}
	}
    return(false);
}

function sendMessage(roomid,data){

	
	if(!socket){
		console.log('socket is null');
	}
	var header = {"roomId":roomid,"toSocketId":srcSocketId};
	console.log('send msg to other end 1', header);
	console.log('send msg to other end 2', data);
	socket.emit('msg', header, data);
}

function sendMessageDes(roomid,desSocketId,data){

	console.log('send message to other end', roomid, data);
	if(!socket){
		console.log('socket is null');
	}
	socket.emit('msg', {"roomId":roomid,"toSocketId":desSocketId}, data);
}

function conn(){
	roomid=document.querySelector('#roomId').value;
	console.log("roomid="+roomid);
	var wss = getQueryVariable("wss");
	var wssPath = getQueryVariable("wssPath");
	if(wss){
		if(wssPath){
			document.querySelector('#socketHost').value = wss+" "+wssPath;
			socket = io.connect(wss,{path:wssPath,transports: ["websocket"]});
		}else{
			document.querySelector('#socketHost').value = wss;
			socket = io.connect(wss);
		}
	}else{
		console.log("socketHost default");
		socket = io.connect();
	}
	

	socket.on('des-joined', (roomid, id) => {
		console.log('receive des-joined message!', roomid, id);
		state = 'joined'

		//如果是多人的话，第一个人不该在这里创建peerConnection
		//都等到收到一个otherjoin时再创建
		//所以，在这个消息里应该带当前房间的用户数
		//
		//create conn and bind media track
		createPeerConnection();

		btnConn.disabled = true;
		btnLeave.disabled = false;
	});

	socket.on('des-join', (roomid,desDocketId) => {
		console.log('receive des-join message:', roomid, desDocketId);
		createPeerConnectionMysrc(desDocketId);

		call(desDocketId);	
		console.log('receive des-join message, desDocketId=', desDocketId);
	});

	// socket.on('src-join', (roomid,socketId) => {
	// 	console.log('receive src-join message:', roomid, socketId);
	// 	srcSocketId = socketId;
	// 	//如果是多人的话，每上来一个人都要创建一个新的 peerConnection
	// 	//
	// 	if(state === 'joined_unbind'){
	// 		createPeerConnection();
	// 	}			

	// 	state = 'joined_conn';
	// 	//call();
	// 	sendMessage(roomid, {
	// 		type: 'need_offer'
	// 	});			

	// 	console.log('receive other_join message, state=', state);
	// });

	// socket.on('full', (roomid, id) => {
	// 	console.log('receive full message', roomid, id);
	// 	hangup();
	// 	closeLocalMedia();
	// 	state = 'leaved';
	// 	console.log('receive full message, state=', state);
	// 	alert('the room is full!');
	// });

	socket.on('leaved', (roomid, id) => {
		console.log('receive leaved message', roomid, id);
		state='leaved'
		socket.disconnect();
		console.log('receive leaved message, state=', state);

		btnConn.disabled = false;
		btnLeave.disabled = true;
	});

	// socket.on('bye', (room, id) => {
	// 	console.log('receive bye message', roomid, id);
	// 	//state = 'created';
	// 	//当是多人通话时，应该带上当前房间的用户数
	// 	//如果当前房间用户不小于 2, 则不用修改状态
	// 	//并且，关闭的应该是对应用户的peerconnection
	// 	//在客户端应该维护一张peerconnection表，它是
	// 	//一个key:value的格式，key=userid, value=peerconnection
	// 	state = 'joined_unbind';
	// 	hangup();
	// 	offer.value = '';
	// 	answer.value = '';
	// 	console.log('receive bye message, state=', state);
	// });

	socket.on('disconnect', (socket) => {
		console.log('receive disconnect message!', roomid);
		if(!(state === 'leaved')){
			hangup();
			closeLocalMedia();

		}
		state = 'leaved';
	
	});

	socket.on('msg', (header,data) => {
		//var roomid = header.roomId;
		srcSocketId = header.fromSocketId;
		console.log('receive message!', header, data);
		var sessionInfo = sessionMap.get(header.fromSocketId);

		var peer = null;
		if(sessionInfo==null){
			peer = pc;
		}else{
			peer = sessionInfo.peer;
		}


		if(typeof data === 'string'){
			data = JSON.parse(data);
		}

		if(data === null || data === undefined){
			console.error('the message is invalid!');
			return;	
		}

		if(data.hasOwnProperty('type') && data.type === 'offer') {
			
			offer.value = data.sdp;

			peer.setRemoteDescription(new RTCSessionDescription(data));

			//create answer srcSocketId
			peer.createAnswer()
				.then(getAnswer)
				.catch(handleAnswerError);

		}else if(data.hasOwnProperty('type') && data.type == 'answer'){
			answer.value = data.sdp;
			peer.setRemoteDescription(new RTCSessionDescription(data));
		
		}else if (data.hasOwnProperty('type') && data.type === 'candidate'){
			var candidate = new RTCIceCandidate({
				sdpMLineIndex: data.label,
				candidate: data.candidate
			});
			peer.addIceCandidate(candidate);	
		
		}else{
			console.log('the message is invalid!!!', data);
		
		}
	
	});

	socket.emit('des-join', roomid);
	socket.emit('src-join', roomid+"-copy");

	return true;
}

function handleError(err){
	console.error('Failed to get Media Stream!', err);
}

function getRemoteStream(e){
	console.log("ontrack info",e);
	remoteStream = e.streams[0];
	// console.log("getRemoteStream",remoteStream);
	// remoteStream.getTracks().forEach((track)=>{
	// 	console.log("getRemoteStream",track.getSettings());
	// });	
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
	sendMessage(roomid,desc);
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
		if(document.querySelector('#useRelay').checked){
			pcConfig.iceTransportPolicy="relay";
		}else{
			pcConfig.iceTransportPolicy="all";
		}
		console.log("pcConfig",pcConfig);
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

		//pcDataChannel = pc.createDataChannel('sendDataChannel');		
	}else {
		console.warning('the pc have be created!');
	}
}

function createPeerConnectionMysrc(desSocketId){

	//如果是多人的话，在这里要创建一个新的连接.
	//新创建好的要放到一个map表中。
	//key=userid, value=peerconnection
	console.log('create RTCPeerConnection! '+desSocketId);
	var sessionInfo = sessionMap.get(desSocketId);
	var peer = null;
	if(!sessionInfo){
		if(document.querySelector('#useRelay').checked){
			pcConfig.iceTransportPolicy="relay";
		}else{
			pcConfig.iceTransportPolicy="all";
		}
		//console.log("pcConfig",pcConfig);		
		peer = new RTCPeerConnection(pcConfig);
		sessionMap.set(desSocketId,{"peer":peer});
		peer.onicecandidate = (e)=>{
			if(e.candidate) {
				sendMessageDes(roomid+"-copy",desSocketId, {
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

	if(remoteStream === null || remoteStream === undefined) {
		console.error('remoteStream is null or undefined!');
		return;
	}
	//add all track into peer connection
	remoteStream.getTracks().forEach((track)=>{
		peer.addTrack(track, remoteStream);	
	});
	console.log('bind copy tracks into RTCPeerConnection! ' +desSocketId);

	console.log("call createOffer "+desSocketId);
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
			sendMessageDes(roomid+"-copy",desSocketId, offerdesc);	
		
		})
		.catch(handleOfferError);
	return;	
}

function call(desSocketId){
	console.log("call createOffer zz "+desSocketId);
	//if(state === 'joined_conn'){

	// var offerOptions = {
	// 	offerToRecieveAudio: 1,
	// 	offerToRecieveVideo: 1
	// }
	// var peer = sessionMap.get(desSocketId).peer;
	// console.log("peer createOffer",peer);
	// peer.createOffer(offerOptions)
	// 	.then((desc)=>{
	// 		peer.setLocalDescription(desc);
	// 		offer.value = desc.sdp;
	// 		offerdesc = desc;
		
	// 		//send offer sdp
	// 		sendMessage(roomid+"-copy",desSocketId, offerdesc);	
		
	// 	})
	// 	.catch(handleOfferError);
	//}
}

function onReceiveMessage(event) {
	console.log("收到事件数据",event.data);	
}
function onReceiveMessageFile(event) {
	console.log("收到事件数据",event.data);	
}
function onReceiveChannelStateChange(event) {
	// if(pcDataChannel){
	// 	var readyState = pcDataChannel.readyState;
	// 	if (readyState === 'open') {
	// 		sendDataBtn.disabled = false;
	// 	} else {
	// 		sendDataBtn.disabled = true;
	// 	}
	// }else{
	// 	sendDataBtn.disabled = true;	
	// }
}
function onReceiveChannelStateChangeFile(event) {
	if(pcFileChannel){
		var readyState = pcFileChannel.readyState;
		console.log('file channel state is: ' + readyState);
		if (readyState === 'open') {
			fileInput.disabled = false;
		} else {
			fileInput.disabled = true;
		}
	}else{
		fileInput.disabled = true;	
	}
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

function handleFileInputChange() {
	var file = fileInput.files[0];
	if (!file) {
		console.log('No file chosen');
	} else {
		fileName = file.name;
		fileSize = file.size;
		fileType = file.type;
		lastModifyTime = file.lastModified;

		sendMessage(roomid, {
			type: 'fileinfo',
			name: file.name,
			size: file.size,
			filetype: file.type,
			lastmodify: file.lastModified
		});

		btnSendFile.disabled = false;
		sendProgress.value = 0;
	}
}

function sendfile(){
	sendFileData(fileInput.files[0]);
	btnSendFile.disabled = true;
}
function sendFileData(fileData){
	var offset = 0;
	var chunkSize = 16384;
	var file = fileData
	console.log(`File is ${[file.name, file.size, file.type, file.lastModified].join(' ')}`);

	// Handle 0 size files.
	statusMessage.textContent = '';
	//downloadAnchor.textContent = '';
	if (file.size === 0) {
		bitrateDiv.innerHTML = '';
		statusMessage.textContent = 'File is empty, please select a non-empty file';
		return;
	}

	sendProgress.max = file.size;

	fileReader = new FileReader();
	fileReader.onerror = error => console.error('Error reading file:', error);
	fileReader.onabort = event => console.log('File reading aborted:', event);
	fileReader.onload = e => {
		console.log('FileRead.onload ', e);
		pcFileChannel.send(e.target.result);
		offset += e.target.result.byteLength;
		sendProgress.value = offset;
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

}
function abort(){
	if(fileReader && fileReader.readyState === 1){
		console.log('abort read');
		fileReader.abort();
	}
}


btnConn.onclick = conn;
btnLeave.onclick = leave;
fileInput.onchange = handleFileInputChange;
btnSendFile.onclick=sendfile;
btnAbort.onclick=abort;

sendDataBtn.onclick = () => {
	var data = document.querySelector("#inputData").value;	
	//pcDataChannel.send(data);
};
