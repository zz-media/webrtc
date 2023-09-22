function getProtocol() {
	const protocol = window.location.protocol;
	//console.log("protocol",protocol);
	if(protocol=="https:"){
		return "wss:";
	}
	return "ws:";
}
function getUrlDomain() {
	//const domain = window.location.host;
	const domain = document.domain;
	return domain;
}
function getUrlPort() {
	const port = window.location.port;
	//console.log("window.location.port",port);
	if(port && port>0){
		return port;
	}
	return 443;
}

function test() {
	
}

export default {
	getProtocol,
	getUrlDomain,
	getUrlPort,
	test
}