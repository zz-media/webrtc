function MouseListener(){
    this.dom=null;
    this.setting={//默认的参数
       remoteScreen:[0,0], //用来转化成远程的坐标系
	   sendMsg:this.postEvent,
       pastefile:()=>{},
	   printCoordinate:false,
    }
	this.domWidth=null;
    this.dragMouse=0
    this.w=0//dom 的宽高
    this.h=0
    //有些监听是全局的，所以只有鼠标进入dom 范围的时候才发送相应的数据到远端
    this.inDomScope=false
}
MouseListener.prototype.eventKey={
   "mousemove":"move",
   "click":"click",
   "mousewheel":"mousewheel",

}
MouseListener.prototype.constructor === MouseListener

MouseListener.prototype.init=function(domId,opt){
    let that =this;
     //配置重写
	Object.assign(this.setting,opt);
	
	this.dom=document.getElementById(domId);

    this.w=this.dom.offsetWidth; //用来转化宽度
    this.h=this.dom.offsetHeight;
    // this.dom.style.cursor='none'
    //监听各种鼠标键盘事件
    this.mouseMove();
    // 监听鼠标滚轮事件
    this.mousewheel();
     // 监听双击事件
    this.dblclick();
     // 监听点击事件
   this.onclick();
	      // 监听点击事件
   this.keyDown();

   this.mouseDown();

   this.paste();
   this.dom.onmouseenter = function(e) {
     console.log("进入dom 范围")
     that.inDomScope=true
    
   }

   this.dom.onmouseleave = function(e) {
    console.log("离开 dom 范围")
    that.inDomScope=false
    console.log(this);
  }
}

MouseListener.prototype.mouseMove=function(){
	 let _this= this;
     let move=(e)=>{
        x = e.offsetX;
        y = e.offsetY; 
        let coorData= _this.transforCoordinate(e.offsetX,e.offsetY);
        let data={"event":"mousemove","drag":this.dragMouse,"x":coorData.x+"","y":coorData.y+""}    
       
            _this.setting.sendMsg(data)

     }
    _this.dom.addEventListener("mousemove",move,false);
}
MouseListener.prototype.debounce=function(fn){
    let  timeout=null;
     if(timeout){

     }else{
       
     }
     
}

MouseListener.prototype.mousewheel=function(){
    let _this= this;
    let eventfn=(e)=>{
        if (e.preventDefault)  
        e.preventDefault();  
        if (e.stopPropagation)
        e.stopPropagation();
        //鼠标滚动
        x = 0;
        y = e.wheelDelta;
        let data={"event":"mousewheel","x":x,"y":y}    
        _this.setting.sendMsg(data)
     }
    this.dom.addEventListener("mousewheel",eventfn,false);
}
MouseListener.prototype.dblclick=function(){
    let _this= this;
    let eventfn=(e)=>{
        x = e.offsetX;
        y = e.offsetY; 
        let coorData= _this.transforCoordinate(e.offsetX,e.offsetY);
        let data={"event":"dblclick","x":coorData.x,"y":coorData.y}    
        _this.setting.sendMsg(data)
     }
      this.dom.addEventListener("dblclick",eventfn,false);
}
MouseListener.prototype.onclick=function(){
    let _this =this;
    let eventfn=(e)=>{
        x = e.offsetX;
        y = e.offsetY; 
        let coorData= _this.transforCoordinate(e.offsetX,e.offsetY);
        let data={"event":"click","x":coorData.x,"y":coorData.y}    
        _this.setting.sendMsg(data)
     }
      this.dom.addEventListener("click",eventfn,false);
}


MouseListener.prototype.keyDown=function(){
    let _this =this;
    let eventfn=(e)=>{
        // if (e.preventDefault)  
        // e.preventDefault();  
        // if (e.stopPropagation)
        // e.stopPropagation();
        console.log(e);
        if(_this.inDomScope){
            let data={"event":"keyTap","key":e.key,"combineKey":"","keyCode":e.keyCode}  
            if(e.ctrlKey||e.altKey||e.shiftKey){
                
            }  
            _this.setting.sendMsg(data)
        }else{
            console.log("鼠标不在区域内,不发送键盘事件")
        }
      
     }
     document.addEventListener("keydown",eventfn,false);
    
}


MouseListener.prototype.mouseDown=function(){
    let _this =this;
    let event=(e)=>{
        if (e.preventDefault)  
        e.preventDefault();  
        if (e.stopPropagation)
        e.stopPropagation();
        this.dragMouse=1  
        let coorData= _this.transforCoordinate(e.offsetX,e.offsetY);
        let data={"event":"mousedown","x":coorData.x,"y":coorData.y}   
        console.log("121313")  
        _this.setting.sendMsg(data)
     }
    this.dom.addEventListener("mousedown",event,false);

    let eventfn=(e)=>{
        if (e.preventDefault)  
        e.preventDefault();  
        if (e.stopPropagation)
        e.stopPropagation();
        this.dragMouse=0  
        let coorData= _this.transforCoordinate(e.offsetX,e.offsetY);
        let data={"event":"mouseup","x":coorData.x,"y":coorData.y}     
        _this.setting.sendMsg(data)
     }
    this.dom.addEventListener("mouseup",eventfn,false);

    let event2=(e)=>{
        if (e.preventDefault)  
        e.preventDefault();  
        if (e.stopPropagation)
        e.stopPropagation();
        x = e.offsetX;
        y = e.offsetY; 
        let data={"event":"contextmenu","x":x,"y":y}    
        _this.setting.sendMsg(data)
     }
    this.dom.addEventListener("contextmenu",event2,false);

} 


MouseListener.prototype.postEvent=function(data){ 
    
   console.log("获取的事件数据" +JSON.stringify(data));
    
}

MouseListener.prototype.paste=function(){ 
     console.log("jianting ctrl_V")
     let _this =this;
    let eventfn=(e)=>{
        // 获取文本值
        e.clipboardData.getData('text');
        // 获取图片
        // 读取到图片对象
        let file = e.clipboardData.files[0];
        if(file&&_this.inDomScope){
            _this.setting.pastefile(file);
        }else{
            console.log("鼠标未进入控制区域，或者无文件信息，不执行发送文件操作")
        }
     }  
   document.addEventListener("paste",eventfn,false);    
 }
// 坐标转化用
// type "x"  --代表width 转话后的坐标     ,"y" -- 代表height 转化后 

MouseListener.prototype.transforCoordinate=function(x,y){ 
    let  _this =this;
    return {x:x?(x/_this.w).toFixed(5):0,y:y?(y/_this.h).toFixed(5):0};

}

MouseListener.prototype.logCoor=function(data){ 
  if(this.printCoordinate) console.log()
}

MouseListener.prototype.fn=function(data){ 
    console.log("获取的事件数据" +JSON.stringify(data));
    
 }

