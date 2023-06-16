package com.example.server.controller;


import com.corundumstudio.socketio.SocketIOServer;
import com.example.server.config.SocketEventListenner;
import com.example.server.config.SocketService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;


@Controller
public class SocketController {
    private static Logger log = LoggerFactory.getLogger(SocketController.class);
    public static final String JWT_KEY="scp";


    @Autowired
    private SocketIOServer socketIOServer;


    @Autowired
    private SocketService socketService;

     @GetMapping("/message/send")
     public String sendMessage(String message){
         socketIOServer.getBroadcastOperations().sendEvent("message",String.format("服务器发送了东西给个你：%s",message));
         log.info( "zong个数{}",socketIOServer.getBroadcastOperations().getClients().size());
         log.info( "个数{}",socketIOServer.getRoomOperations("room1").getClients().size());
         return "发送成功";
     }
    @GetMapping("/index")
    public String index(String message){
        return "src-media-data-robot";
    }

}
