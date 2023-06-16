<template>
  <div>
    SocketManage
    <div>已连接终端数：{{socketIOServerInfo.clientsCount}}</div>
    <template v-if="socketIOServerInfo.socketIOClientInfoList!=null">
      <div v-for="clientInfo in socketIOServerInfo.socketIOClientInfoList" :key="clientInfo.sessionId">
        终端：{{clientInfo.sessionId}} 已加入房间{{clientInfo.allRooms}}
      </div>
    </template>
  </div>
</template>

<script>

export default {
  components: {

  },
  name: 'SocketManage',
  props: {
 
  },
  data() {
    return {
      timeInterval: null,
      socketIOServerInfo: {

      }
    };
  },
  mounted:function(){
    this.getSocketIOServerInfo();
    this.startInterval();
  },
  methods: {
    startInterval(){
      this.timeInterval = setInterval(()=>{
        this.getSocketIOServerInfo();
      },5000);
    },
    getSocketIOServerInfo(){
      this.$http.get('/remote-server/socketManage/getSocketIOServerInfo').then((response)=>{
        console.log(response.data);
        this.socketIOServerInfo = response.data;
        //this.set(this.socketIOServerInfo,"socketIOClientInfoList",response.data.socketIOClientInfoList)
      }).catch((error)=>{
        console.log(error);
      });
    }
  }
}
</script>

<style scoped>

</style>
  