function init(dom,ctrlCallback) {
	//console.log("dom",dom);
	var inDom = false;
	dom.onmouseenter = (e)=> {
		inDom = true;
		console.log("进入dom 范围")
	}
	dom.onmouseleave = (e)=> {
		inDom = false;
		console.log("离开 dom 范围")
	}
	dom.onmousedown = (e)=> {
		let data = null;
		if(e.button == 1){
			console.log("down鼠标中键",e);
			data = {"event":"middleMouseDown","x":e.offsetX+"","y":e.offsetY+""};
		}else if(e.button == 2){
			console.log("down鼠标右键",e);
			data = {"event":"rightMouseDown","x":e.offsetX+"","y":e.offsetY+""};
		}else{
			console.log("down鼠标左键",e);
			data = {"event":"leftMouseDown","x":e.offsetX+"","y":e.offsetY+""};
		}
		ctrlCallback(data);
	}
	dom.onmouseup = (e)=> {
		let data = null;
		if(e.button == 1){
			console.log("up鼠标中键",e);
			data = {"event":"middleMouseUp","x":e.offsetX+"","y":e.offsetY+""};
		}else if(e.button == 2){
			console.log("up鼠标右键",e);
			data = {"event":"rightMouseUp","x":e.offsetX+"","y":e.offsetY+""};
		}else{
			console.log("up鼠标左键",e);
			data = {"event":"leftMouseUp","x":e.offsetX+"","y":e.offsetY+""};
		}
		ctrlCallback(data);
	}	
	dom.onmousemove = (e)=> {
		//console.log("mouseMove",e);
		//var coorData = {x:x?(x/_this.w).toFixed(5):0,y:y?(y/_this.h).toFixed(5):0}
		let data={"event":"mousemove","x":e.offsetX+"","y":e.offsetY+""};
		ctrlCallback(data);
	}
	dom.onmousewheel = (e)=> {
		if (e.preventDefault){ 
			e.preventDefault();  
		} 
		if (e.stopPropagation){
			e.stopPropagation();
		}
		console.log("mousewheel",e);
		var x = 0;
        var y = e.wheelDelta;
        let data={"event":"mousewheel","x":x,"y":y};
		ctrlCallback(data);
	}
	dom.onclick = (e)=> {
		console.log("onclick",e);
		let data={"event":"click","x":e.offsetX+"","y":e.offsetY+""};
		ctrlCallback(data);
	}		
	dom.oncontextmenu = (e)=> {
		if (e.preventDefault){ 
			e.preventDefault();  
		} 
		if (e.stopPropagation){
			e.stopPropagation();
		}
		let x = e.offsetX;
		let y = e.offsetY; 
		let data = {"event":"contextmenu","x":x,"y":y};
		console.log("oncontextmenu",data);	
		ctrlCallback(data);	
	}
	document.onkeydown = (e)=> {
		if(!inDom){
			return;
		}
		let data={"event":"keyDown","key":e.key,"keyCode":e.keyCode};
		console.log("keydown",e);
		ctrlCallback(data);
	}
	document.onkeyup = (e)=> {
		if(!inDom){
			return;
		}
		let data={"event":"keyUp","key":e.key,"keyCode":e.keyCode};
		console.log("keyUp",e);
		ctrlCallback(data);
	}
	// document.onpaste = (e)=> {
	// 	if(!inDom){
	// 		return;
	// 	}
	// 	console.log("onpaste",e);
	// 	let text = e.clipboardData.getData('text');
	// 	console.log("text",text);
	// 	let file = e.clipboardData.files[0];
	// 	console.log("file",file);
	// }
}

export default {
	init
}