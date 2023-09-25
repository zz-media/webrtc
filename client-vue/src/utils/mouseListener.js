function init(dom,ctrlCallback) {
	console.log("dom",dom);
	var inDom = false;
	dom.onmouseenter = (e)=> {
		inDom = true;
		//console.log("进入dom 范围")
	}
	dom.onmouseleave = (e)=> {
		inDom = false;
		//console.log("离开 dom 范围")
	}
	dom.onmousedown = (e)=> {
		console.log("mousedown",e);
		//ctrlCallback(e);
	}
	dom.onmouseup = (e)=> {
		console.log("onmouseup",e);
	}
	dom.onmousemove = (e)=> {
		console.log("mouseMove",e);
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
		//ctrlCallback(data);	
	}
	document.onkeydown = (e)=> {
		if(!inDom){
			return;
		}
		console.log("keydown",e);
	}
	document.onkeyup = (e)=> {
		if(!inDom){
			return;
		}
		console.log("keyup",e);
	}
	document.onpaste = (e)=> {
		if(!inDom){
			return;
		}
		console.log("onpaste",e);
		let text = e.clipboardData.getData('text');
		console.log("text",text);
		let file = e.clipboardData.files[0];
		console.log("file",file);
		// if(file){
		// 		console.log(file);
		// }
	}
}

export default {
	init
}