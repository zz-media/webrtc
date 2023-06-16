package com.example.server.controller;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.example.server.controller.bean.SocketIOClientInfo;
import com.example.server.controller.bean.SocketIOServerInfo;


@RestController
@RequestMapping("/socketManage")
public class SocketManageController {
	
    private static Logger log = LoggerFactory.getLogger(SocketManageController.class);
    
    @Autowired
    private SocketIOServer socketIOServer;

	/**
	 * http://localhost:18080/remote-server/socket-manage/test
	 */	
	@GetMapping(value = "test")
    public String test() {	
		log.info("test socket manage");
        return "test socket manage";
    }
	
	@GetMapping(value = "getSocketIOServerInfo")
    public SocketIOServerInfo getRoomInfo() {	
		SocketIOServerInfo socketIOServerInfo = new SocketIOServerInfo();
		socketIOServerInfo.setClientsCount(socketIOServer.getAllClients().size());
		
		Collection<SocketIOClient> clients = socketIOServer.getAllClients();
		for(SocketIOClient socketIOClient : clients) {
			SocketIOClientInfo socketIOClientInfo = new SocketIOClientInfo();
			socketIOClientInfo.setSessionId(socketIOClient.getSessionId());
			socketIOClientInfo.setAllRooms(socketIOClient.getAllRooms());
			socketIOServerInfo.addSocketIOClientInfo(socketIOClientInfo);
		}

        return socketIOServerInfo;
    }	
}
