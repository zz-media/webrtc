package com.example.server.entity;

import java.io.Serializable;

/**
 *  作为订阅消息
 */
public class SubMessage implements Serializable {

    private String roomId; //房间内群发
    private String  content;//发送到客户端的内容
    private Integer action;   //对应socketio 监听的事件
    private String clientId;  //消息的id

    public Integer getAction() {
        return action;
    }

    public void setAction(Integer action) {
        this.action = action;
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }
}
