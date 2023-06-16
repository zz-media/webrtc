package com.example.server.config;

import java.util.Collection;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.OnConnect;
import com.corundumstudio.socketio.annotation.OnDisconnect;
import com.corundumstudio.socketio.annotation.OnEvent;
import com.example.server.util.HmacSHA1Util;

import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;


@Component
public class SocketEventListenner {
  private static Logger log = LoggerFactory.getLogger(SocketEventListenner.class);

  @Value("${app.turn.secret}")
  private String secret;
  
  @Value("${app.turn.iceServers}")
  private String iceServers;

  @Autowired 
  private SocketIOServer socketIOServer;
  
  @OnConnect
  public void onConnect(SocketIOClient client) {
	log.info("clientId:{} 连接成功",client.getSessionId());
//	JSONObject jsonObject=new JSONObject();
//	jsonObject.set("event","test");
//      client.sendEvent("message",jsonObject.toString(),"");
	
//	String user = client.getHandshakeData().getSingleUrlParam("user");
//	log.info("onConnect user ={}",user);
//	String token = client.getHandshakeData().getSingleUrlParam("token");
//	log.info("onConnect token ={}",token);
//	if("12345".equals(token)) {
//		client.disconnect();
//	}
  }

  @OnEvent("message")
  public void message(SocketIOClient client, String roomid,Object data) {
	log.info("\n 消息:{},{}",roomid,data);
	socketIOServer.getRoomOperations(roomid).sendEvent("message",client,roomid,data);
  }
  @OnEvent("join")
  public void join(SocketIOClient client, String roomid,String data) {
    client.joinRoom(roomid);
    log.info("{}加入 room:{} 消息:{}",client.getSessionId(),roomid,data);
    Collection collection= socketIOServer.getRoomOperations(roomid).getClients();
    if(collection.size()<3){
      client.sendEvent("joined",roomid,client.getSessionId());
      if(collection.size()>1){
        socketIOServer.getRoomOperations(roomid).sendEvent("otherjoin",client,roomid,client.getSessionId());
      }

    }else{


    }

  }
  
	@OnEvent("get-ice-servers")
	public void getIceServers(SocketIOClient client,Map<String, Object> header,Object data) {
		log.info("{} get-ice-servers",client.getSessionId());
		
		String username = (System.currentTimeMillis()+24*3600*1000)/1000+":"+"user";
		String credential = null;
		try {
			credential = HmacSHA1Util.signBase64String(username,secret);
		} catch (Exception e) {
			log.error("credential fail",e);
		}
		String iceServersCredential = iceServers.replace("$username", username).replace("$credential", credential).replaceAll("'", "\"");
    	log.info("ice-servers:{}",iceServersCredential);
		client.sendEvent("ice-servers","{'header':'test'}",iceServersCredential);
	}
	
	@OnEvent("src-join")
	public void srcJoin(SocketIOClient client, String roomid,String data) {
		client.joinRoom(roomid);
		client.set("terminalType", "src");
		log.info("{} src加入 room:{} 消息:{}",client.getSessionId(),roomid,data);
		client.sendEvent("src-joined",roomid,client.getSessionId());
	}
	@OnEvent("des-join")
	public void desJoin(SocketIOClient client, String roomid,String data) {
		Boolean srcJoined = false;
		Collection<SocketIOClient> clients = socketIOServer.getAllClients();
		for(SocketIOClient socketIOClient : clients) {
			if("src".equals(socketIOClient.get("terminalType"))) {
				srcJoined = true;
			}
		}
		if(srcJoined) {
		//if(true) {
			client.joinRoom(roomid);
			client.set("terminalType", "des");
			log.info("{} des加入 room:{} 消息:{}",client.getSessionId(),roomid,data);
			client.sendEvent("des-joined",roomid,client.getSessionId());
			socketIOServer.getRoomOperations(roomid).sendEvent("des-join",roomid,client.getSessionId());			
		}else {
			log.info("{} des加入 room:{} 失败:{}",client.getSessionId(),roomid,data);
			client.sendEvent("des-joined-fail",roomid,client.getSessionId());		
		}
	}
	  @OnEvent("msg")
	  public void msg(SocketIOClient client, String headerStr,String dataStr) {
		log.info("msg消息:{},{}",headerStr,dataStr);
		JSONObject headerJson = JSONUtil.parseObj(headerStr);
		headerJson.set("fromSocketId", client.getSessionId());
		String roomId = (String) headerJson.get("roomId");
		String toSocketId = (String) headerJson.get("toSocketId");
		//socketIOServer.getRoomOperations(roomId).sendEvent("msg",client,header,data);
		//拿出某个客户端信息
		SocketIOClient socketClient = socketIOServer.getClient(UUID.fromString(toSocketId));
		if(socketClient!=null) {
			String headerStrNow = JSONUtil.toJsonStr(headerJson);
			socketClient.sendEvent("msg",headerStrNow,dataStr);
		}else {
			log.warn("msg send fail {} toSocketId null",toSocketId);
		}
	  }
  @OnEvent("leave")
  public void leave(SocketIOClient client, String roomid) {
    log.info("\n 离开 room:{} ",roomid);

        socketIOServer.getRoomOperations(roomid).sendEvent("bye",client,roomid,client.getSessionId());

        client.sendEvent("leaved", roomid, client.getSessionId());
  }



  @OnDisconnect
  public void onDisconnect(SocketIOClient client) {
      log.info("离线消息:clientId{}",client.getSessionId());
  }
}
