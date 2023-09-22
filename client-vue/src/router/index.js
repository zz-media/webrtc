import Vue from 'vue'
import VueRouter from 'vue-router'


Vue.use(VueRouter)

const routes = [
  // {
  //   path: '/',
  //   redirect:"/SupervisionList",RelayPage
  // },
  {
    path: '/HelloWorld',
    name: 'HelloWorld',
    component: () => import('../components/HelloWorld.vue')
  },
  {
    path: '/SrcPage',
    name: 'SrcPage',
    component: () => import('../views/SrcPage.vue')
  },
  {
    path: '/SupervisionList',
    name: 'SupervisionList',
    component: () => import('../views/SupervisionList.vue')
  },
  {
    path: '/RelayPage',
    name: 'RelayPage',
    component: () => import('../views/RelayPage.vue')
  }, 
  {
    path: '/DeskCtrlPage',
    name: 'DeskCtrlPage',
    component: () => import('../views/DeskCtrlPage.vue')
  },  
  {
    path: '/SocketManage',
    name: 'SocketManage',
    component: () => import('../views/manage/SocketManage.vue')
  },
]

const router = new VueRouter({
  //mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router