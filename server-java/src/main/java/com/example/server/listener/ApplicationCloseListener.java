package com.example.server.listener;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.example.server.config.SpringContextHolder;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextClosedEvent;

import java.util.Collection;

public class ApplicationCloseListener implements ApplicationListener<ContextClosedEvent> {
    private Logger logger = LoggerFactory.getLogger(getClass());


    @Override
    public void onApplicationEvent(ContextClosedEvent event) {
        SocketIOServer socketIOServer=SpringContextHolder.getBean(SocketIOServer.class);
        Collection<SocketIOClient> socketIOClients= socketIOServer.getAllClients();
        logger.info("========程序关闭=======");
        for (SocketIOClient client : socketIOClients) {
             logger.info("\n离线 ClientID:【{}】\n  RoomID:【{}】", client.getSessionId().toString(),client.get("userId"),client.get("roomId"));
        }
    }

}
