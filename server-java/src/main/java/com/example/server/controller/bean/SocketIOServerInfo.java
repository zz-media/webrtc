package com.example.server.controller.bean;

import java.util.ArrayList;
import java.util.Collection;

public class SocketIOServerInfo {
	
	private Integer clientsCount;
	
	private Collection<SocketIOClientInfo> socketIOClientInfoList;
	
	public void addSocketIOClientInfo(SocketIOClientInfo socketIOClientInfo) {
		if(socketIOClientInfoList == null) {
			socketIOClientInfoList = new ArrayList<SocketIOClientInfo>();
		}
		socketIOClientInfoList.add(socketIOClientInfo);
	}

	public Integer getClientsCount() {
		return clientsCount;
	}

	public void setClientsCount(Integer clientsCount) {
		this.clientsCount = clientsCount;
	}

	public Collection<SocketIOClientInfo> getSocketIOClientInfoList() {
		return socketIOClientInfoList;
	}

	public void setSocketIOClientInfoList(Collection<SocketIOClientInfo> socketIOClientInfoList) {
		this.socketIOClientInfoList = socketIOClientInfoList;
	}
	
}
