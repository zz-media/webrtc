<template>
  <div class="supervisionList">
    <div>
      <label>视频输入设备:</label>
      <el-input v-model="videoWidth" style="width:60px"></el-input>
      <el-input v-model="videoHeight" style="width:60px"></el-input>
      <el-button @click="sizeChange">修改</el-button>
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
      <el-button @click="localStreamChange">切源</el-button>
    </div>
    <div>
      <el-checkbox true-label="relay" false-label="all" v-model="pcConfig.iceTransportPolicy">强制使用中继服务器</el-checkbox>
      socket地址：<input v-model="wsUrl"/>
      socket房间：<input v-model="roomId"/>
      chrome://webrtc-internals/    
    </div>
    <div>
      <el-checkbox v-model="localMediaChecked">传输本地媒体</el-checkbox>
      <label>额外终端连接:</label>
      <input v-model="moreDesCount" placeholder="额外终端连接"/>
      <button @click="start">启动</button>
      <button disabled>关闭</button>				
    </div>
    <remote-des ref="RemoteDes"></remote-des>
    <!-- <remote-des :wsUrl="wsUrl" :roomId="roomId" :ref="'RemoteDes2'"></remote-des> -->
    <div>
      <remote-des v-show="moreDes<=moreDesCount" v-for="moreDes in 9" :key="moreDes" :ref="'RemoteDes-'+moreDes"></remote-des>
    </div>
  </div>
</template>

<script>
import RemoteDes from '@/components/webrtc/RemoteDes';
import urlUtil from '@/utils/urlUtil.js'
export default {
  components: {
    RemoteDes,
  },
  name: 'SupervisionList',
  props: {
    msg: String
  },
  data() {
    return {
      videoWidth:640,
      videoHeight:360,
      videoInputOptions: [],
      audioInputOptions: [],
      audioOutputOptions: [],
      videoInputValue: null,
      audioInputValue: null,
      audioOutputValue: null,
      localStream: null,
      localMediaChecked: true,
      moreDesCount: 0,
      wsUrl: urlUtil.getProtocol()+"//"+urlUtil.getUrlDomain()+":"+urlUtil.getUrlPort(),
      //wsUrl: "wss://"+urlUtil.getUrlDomain()+":8843",
      roomId: "room1",//test-multi room-multi
      //wsUrl: "wss://172.20.123.9:8843",
      //relayUrl: "turn:linux.zdomain.top:3478",
      relayUrl: "turn:172.26.180.229:3478",
      //pcConfig: {"iceServers":[{"urls":["stun:stun.l.google.com:19302"]},{"urls":["turn:rtctest.zdomain.top:3478"],"username":"admin","credential":"123456"}],"iceTransportPolicy":"all"},
      pcConfig: {"iceServers":[{"urls":["turn:rtctest.zdomain.top:3478"],"username":"1756976278:user1","credential":"w8PP6hldSaWwxGnWnPnnt9m6h6Y="}],"iceTransportPolicy":"all"},
    };
  },
  mounted:function(){

    if(!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices){
      console.log('enumerateDevices is not supported!');
    }else{
      var constraints = {
        video : true, 
        audio : true 
      };
      navigator.mediaDevices.getUserMedia(constraints)
        .then(this.gotMediaStream)
        .then(this.gotDevices)
        .catch(this.handleError);
    }

    //console.log("urlUtil.getUrlDomain()",urlUtil.getUrlDomain());
  },
  methods: {
    start() {
      console.log("this.localStream",this.localMediaChecked,this.localStream);
      this.pcConfig.iceServers[0].urls = [this.relayUrl];
      var config = {
        wsUrl:this.wsUrl,
        roomId:this.roomId,
        pcConfig:this.pcConfig,
        localStream: this.localMediaChecked?this.localStream:null,
        //localStream:null
      };
      console.log("start=",config);
      this.$refs.RemoteDes.start(config);

      for (var i = 1; i <= this.moreDesCount; i++) {
        this.$refs['RemoteDes-'+i][0].start(config);
      }
    },
    localStreamChange(){
      console.log("localStreamChange");
      var constraints = {
        video : {
          width: 640,	
          height: 480,
          frameRate:20,
          facingMode: 'enviroment',
          deviceId : this.videoInputValue ? {exact:this.videoInputValue} : undefined 
        }, 
        audio : true 
      };
      // var constraints = {
      //   video : true, 
      //   audio : true 
      // };
      navigator.mediaDevices.getUserMedia(constraints)
        .then(stream=>{
          this.localStream = stream;
          this.$refs.RemoteDes.localStreamChange(stream);

          for (var i = 1; i <= this.moreDesCount; i++) {
            this.$refs['RemoteDes-'+i][0].localStreamChange(stream);
          }
        })
        .catch(this.handleError);
    },
    sizeChange(){
      this.$refs.RemoteDes.sizeChange(this.videoWidth,this.videoHeight);
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

    gotMediaStream(stream){
      console.log("gotMediaStream",stream);
      this.localStream = stream;
      return navigator.mediaDevices.enumerateDevices();
    },
    handleError(err){
	    console.error('Failed:', err);
    },
  }
}
</script>

<style scoped>

</style>
  