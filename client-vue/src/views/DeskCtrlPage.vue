<template>
  <div>
    <div>
      socket地址：<input v-model="wsUrl"/>
      socket房间：<input v-model="roomId"/>
      只使用中继<el-checkbox true-label="relay" false-label="all" v-model="pcConfig.iceTransportPolicy"></el-checkbox>
      移动相对坐标系<el-checkbox v-model="useMouseSlide"></el-checkbox>
      <button @click="start">启动</button>
      <button @click="stop">关闭</button>
      chrome://webrtc-internals/    
    </div>
    <remote-des ref="RemoteDes"></remote-des>
  </div>
</template>

<script>
import RemoteDes from '@/components/webrtc/DeskCtrl';
import urlUtil from '@/utils/urlUtil.js'
export default {
  components: {
    RemoteDes,
  },
  name: 'DeskCtrl',
  props: {
    msg: String
  },
  data() {
    return {
      wsUrl: urlUtil.getProtocol()+"//"+urlUtil.getUrlDomain()+":"+urlUtil.getUrlPort(),
      roomId: "roomcc",//test-multi room-multi
      //pcConfig: {"iceServers":[{"urls":["stun:stun.l.google.com:19302"]},{"urls":["turn:rtctest.zdomain.top:3478"],"username":"admin","credential":"123456"}],"iceTransportPolicy":"all"},
      pcConfig: {"iceServers":[{"urls":["turn:ruijie.asia:5349"],"username":"admin","credential":"123456"}],"iceTransportPolicy":"all"},
      useMouseSlide : true
    };
  },
  mounted:function(){
  },
  methods: {
    start() {
      console.log("this.localStream",this.localMediaChecked,this.localStream);
      //this.pcConfig.iceServers[0].urls = [this.relayUrl];
      var config = {
        wsUrl:this.wsUrl,
        roomId:this.roomId,
        pcConfig:this.pcConfig,
        localStream: null,
        useMouseSlide: this.useMouseSlide
      };
      //console.log("start=",config);
      this.$refs.RemoteDes.start(config);
    },
    stop(){
      this.$refs.RemoteDes.stop();
    }
  }
}
</script>

<style scoped>

</style>
  