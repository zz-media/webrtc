<template>
  <div class="supervisionList">
    <div>
      <button id="connserver" @click="start">启动</button>
      <button id="leave" disabled>关闭</button>				
      socket地址：<input id="socketHost" v-model="wsUrl"/>
      socket房间：<input id="roomId" v-model="roomId"/>
      强制使用中继服务器:<input type="checkbox" id="useRelay" />chrome://webrtc-internals/
    </div>
    <remote-relay-des :wsUrl="wsUrl" :roomId="roomId" ref="RemoteRelayDes"></remote-relay-des>

  </div>
</template>

<script>
import RemoteRelayDes from '@/components/webrtc/RemoteRelayDes';

export default {
  components: {
    RemoteRelayDes,
  },
  name: 'SupervisionList',
  props: {
    msg: String
  },
  data() {
    return {
      wsUrl: "wss://localhost:8843",
      roomId: "room1",
      pcConfig: {"iceServers":[{"urls":["stun:stun.l.google.com:19302"]},{"urls":["turn:rtctest.zdomain.top:3478"],"username":"admin","credential":"123456"}],"iceTransportPolicy":"all"},
    };
  },
  mounted:function(){

  },
  methods: {
    start() {
      var config = {
        wsUrl:this.wsUrl,
        roomId:this.roomId,
        pcConfig:this.pcConfig,
      };
      //console.log("start=",config);
      this.$refs.RemoteRelayDes.start(config);
    },
  }
}
</script>

<style scoped>

</style>
  