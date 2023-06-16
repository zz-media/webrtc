<template>
  <div id="app">
    <div class="testNav">
      调测导航<br/>
      <router-link to="/HelloWorld">HelloWorld</router-link><br/>
      <router-link to="/SrcPage">SrcPage</router-link><br/>
      <router-link to="/SupervisionList">SupervisionList</router-link><br/>
      <router-link to="/RelayPage">RelayPage</router-link><br/>
      <router-link to="/SocketManage">SocketManage</router-link><br/>
      <br/>
    </div>
    <router-view/>
  </div>
</template>

<script>
//import HelloWorld from './components/HelloWorld.vue'

export default {
  name: 'App',
  components: {
    //HelloWorld
  }
}
</script>

<style>
html{
  pad: 0px;
  margin: 0px;
}
body{
  pad: 0px;
  margin: 0px;
  height: 1080px;
  width: 100%;
}
#app {
  text-align: center;
  color: #2c3e50;
  height: 100%;
  width: 100%;
}
.testNav{
  background: burlywood;
  position: absolute;
  z-index: 1000;
  right: 0px;
}
</style>
