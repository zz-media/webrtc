<template>
  <div>
    <div>
      socket地址：<input v-model="wsUrl"/>
      socket房间：<input v-model="roomId"/>
      <el-checkbox true-label="relay" false-label="all" v-model="pcConfig.iceTransportPolicy">只使用中继协商</el-checkbox>
      <button @click="start">启动</button>
      <button disabled>关闭</button>	      
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
      roomId: "room1",//test-multi room-multi
      //pcConfig: {"iceServers":[{"urls":["stun:stun.l.google.com:19302"]},{"urls":["turn:rtctest.zdomain.top:3478"],"username":"admin","credential":"123456"}],"iceTransportPolicy":"all"},
      pcConfig: {"iceServers":[{"urls":["turn:ruijie.asia:3478"],"username":"admin","credential":"123456"}],"iceTransportPolicy":"all"},
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
      };
      //console.log("start=",config);
      this.$refs.RemoteDes.start(config);
    },
  }
}
</script>

<style scoped>

</style>
  