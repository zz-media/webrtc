
## 项目简要说明：
提供socket.io 服务，用来交换webrtc 信息


控制端测试页面： [http://127.0.0.1:8080/client.html](http://127.0.0.1:8080/client.html)   页面上    
  默认的 socket连接地址 为  http://127.0.0.1:9000

被控制端（electron项目）需要修改 socket 连接的地址。（ config/config.json 下的socketServer . ） 