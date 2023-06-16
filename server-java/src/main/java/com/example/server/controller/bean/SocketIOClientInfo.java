package com.example.server.controller.bean;

import java.util.Set;
import java.util.UUID;

public class SocketIOClientInfo {

	private UUID sessionId;
	
	private Set<String> allRooms;

	public UUID getSessionId() {
		return sessionId;
	}

	public void setSessionId(UUID sessionId) {
		this.sessionId = sessionId;
	}

	public Set<String> getAllRooms() {
		return allRooms;
	}

	public void setAllRooms(Set<String> allRooms) {
		this.allRooms = allRooms;
	}
	
}
