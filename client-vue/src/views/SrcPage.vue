<template>
  <div class="supervisionList">
    <div class="timerDiv">
      {{timeFilter?timeFilter:''}}
    </div>
    <div>   
      <label>视频输入设备:</label>
      <el-select v-model="videoInputValue" placeholder="请选择">
        <el-option
          v-for="item in videoInputOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value">
        </el-option>
      </el-select>
      <label>音频输入设备:</label>
      <el-select v-model="audioInputValue" placeholder="请选择">
        <el-option
          v-for="item in audioInputOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value">
        </el-option>
      </el-select>
      <label>音频输出设备:</label>
      <el-select v-model="audioOutputValue" placeholder="请选择">
        <el-option
          v-for="item in audioOutputOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value">
        </el-option>
      </el-select>
    </div>
    <div>
    </div>
      <el-checkbox true-label="relay" false-label="all" v-model="pcConfig.iceTransportPolicy">强制使用中继服务器</el-checkbox>
      socket地址：<input v-model="wsUrl"/>
      socket房间：<input v-model="roomId"/>
      chrome://webrtc-internals/
    <div>
      <button id="connserver" @click="start">启动(摄像头)</button>
      <button id="connserver" @click="startDesk">启动(桌面)</button>
      <button id="leave" disabled>关闭</button>				
    </div>
    <remote-src :wsUrl="wsUrl" :roomId="roomId" ref="RemoteSrc"></remote-src>

  </div>
</template>

<script>
import RemoteSrc from '@/components/webrtc/RemoteSrc';
import urlUtil from '@/utils/urlUtil.js'

export default {
  components: {
    RemoteSrc,
  },
  name: 'SupervisionList',
  props: {
    msg: String
  },
  data() {
    return {
      videoInputOptions: [],
      audioInputOptions: [],
      audioOutputOptions: [],
      videoInputValue: null,
      audioInputValue: null,
      audioOutputValue: null,
      wsUrl: urlUtil.getProtocol()+"//"+urlUtil.getUrlDomain()+":"+urlUtil.getUrlPort(),
      roomId: "room1",
      //relayUrl: "turn:linux.zdomain.top:3478",
      relayUrl: "turn:172.26.180.229:3478",
      //pcConfig: {"iceServers":[{"urls":["stun:stun.l.google.com:19302"]},{"urls":["turn:rtctest.zdomain.top:3478"],"username":"admin","credential":"123456"}],"iceTransportPolicy":"all"},
      pcConfig: {"iceServers":[{"urls":["turn:rtctest.zdomain.top:3478"],"username":"1756976278:user1","credential":"w8PP6hldSaWwxGnWnPnnt9m6h6Y="}],"iceTransportPolicy":"all"},

      timeNum: 0
    };
  },

  computed: {
    timeFilter() {
      var time_num = this.timeNum
      let hour = Math.floor(time_num / 1000 / 60 / 60) < 10 ? '0' + Math.floor(time_num / 1000 / 60 / 60) : Math
        .floor(time_num / 1000 / 60 / 60)
      let minute = Math.floor(time_num / 1000 / 60 % 60) < 10 ? '0' + Math.floor(time_num / 1000 / 60 % 60) :
        Math.floor(time_num / 1000 / 60 % 60);
      let second = Math.floor(time_num / 1000 % 60) < 10 ? '0' + Math.floor(time_num / 1000 % 60) : Math.floor(
        time_num / 1000 % 60);
      let m_second = (time_num % 1000).toString().slice(0, 2)
      let str = (hour == '00' ? '' : hour + 'h' + " ") + (minute == '00' ? '' : minute + 'min' + " ") + second + "." + m_second + 's'
      return str
    }
  },
  mounted:function(){
    if(!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices){
      console.log('enumerateDevices is not supported!');
      return;
    }
    var constraints = {
      video : true, 
      audio : true 
    };
    navigator.mediaDevices.getUserMedia(constraints)
      .then(this.gotMediaStreamForTest)
      .then(this.gotDevices)
      .catch(this.handleError);

    this.startTimer();
  },
  methods: {
    startTimer(){
      setInterval(()=> {
        this.timeNum += 10;
        //console.log("this.timeNum",this.timeNum);
      },10);
    },
    gotDevices(deviceInfos){
      //console.log("deviceInfos",deviceInfos);
      this.videoInputOptions = [];
      this.audioInputOptions = [];
      this.audioOutputOptions = [];
      var vm = this;
      deviceInfos.forEach(function(deviceInfo){
        //console.log(deviceInfo.kind + ": label = " + deviceInfo.label + ": id = " + deviceInfo.deviceId + ": groupId = " + deviceInfo.groupId);	
        if(deviceInfo.kind === 'audioinput'){
          vm.audioInputOptions.push({"value":deviceInfo.deviceId,"label":deviceInfo.label});
          if(vm.audioInputValue == null){
            vm.audioInputValue = deviceInfo.deviceId;
          }
        }else if(deviceInfo.kind === 'audiooutput'){
          vm.audioOutputOptions.push({"value":deviceInfo.deviceId,"label":deviceInfo.label});
          if(vm.audioOutputValue == null){
            vm.audioOutputValue = deviceInfo.deviceId;
          }
        }else if(deviceInfo.kind === 'videoinput'){
          vm.videoInputOptions.push({"value":deviceInfo.deviceId,"label":deviceInfo.label});
          if(vm.videoInputValue == null){
            vm.videoInputValue = deviceInfo.deviceId;
          }
        }
      });

    },
    gotMediaStreamForTest(stream){
      return navigator.mediaDevices.enumerateDevices();
    },
    gotMediaStream(stream){
      console.log("gotMediaStream",stream);
      // var videoTrack = stream.getVideoTracks()[0];
      // var videoConstraints = videoTrack.getSettings();
      
      // divConstraints.textContent = JSON.stringify(videoConstraints, null, 2);

      // window.stream = stream;
      // videoplay.srcObject = stream;
      this.pcConfig.iceServers[0].urls = [this.relayUrl];
      var config = {
        wsUrl: this.wsUrl,
        roomId: this.roomId,
        pcConfig: this.pcConfig,
        localStream: stream,
      };
      console.log("start=",config);
      this.$refs.RemoteSrc.start(config);

      //return navigator.mediaDevices.enumerateDevices();
    },
    handleError(err){
	    console.error('Failed:', err);
    },
    start() {
      if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
        console.log('getUserMedia is not supported!');
        return;
      }
      //navigator.mediaDevices.getUserMedia({audio: true, video: false});
      var deviceId = this.videoInputValue; 
      var constraints = {
        video : {
          //width: 640,	
          //height: 480,
          //frameRate:20,
          //facingMode: 'enviroment',
          deviceId : deviceId ? {exact:deviceId} : undefined 
        }, 
        audio : true 
      }

      navigator.mediaDevices.getUserMedia(constraints)
        .then(this.gotMediaStream)
        //.then(this.gotDevices)
        .catch(this.handleError);
    
    },
    startDesk(){
      //var constraints = {video: true};
      var constraints = {
        video : {
          width: 640,	
          height: 360,
          frameRate:60,
          //facingMode: 'enviroment',
          //deviceId : deviceId ? {exact:deviceId} : undefined 
        }, 
        audio : true 
      }
      navigator.mediaDevices.getDisplayMedia(constraints)
        .then(this.gotMediaStream)
        .catch(this.handleError);
    }
  },

}
</script>

<style scoped>
.timerDiv{
  color: red;
  position: absolute;
  font-weight: bold;
  font-size: 150px;
  top:50%;
  left: 50%;
}
</style>
  