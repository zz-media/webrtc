package com.example.server.config;

import com.corundumstudio.socketio.SocketIOServer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;

@Component
public class SocketService {
  private static Logger log = LoggerFactory.getLogger(SocketEventListenner.class);

  @Autowired private SocketIOServer socketIOServer;
  @Autowired private SocketEventListenner socketEventListenner;
  @PostConstruct
  public void startSocketServer() {
    socketIOServer.addListeners(socketEventListenner);
    socketIOServer.start();
    log.info("ScoketIo Server启动成功,端口【{}】", socketIOServer.getConfiguration().getPort());
  }

}
