package com.example.server;

import java.security.MessageDigest;
import java.util.Base64;
import java.util.concurrent.TimeUnit;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.SSLSession;

import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;
import okhttp3.OkHttpClient;

public class TestWs {


 
	public static void main(String[] args) throws Exception {

//		HostnameVerifier myHostnameVerifier = new HostnameVerifier() {
//			@Override
//			public boolean verify(String s, SSLSession sslSession) {
//				return true;
//			}
//
//		};
        
        try{
        	String url ="http://124.220.1.36:19000?token=123456";
            IO.Options options = new IO.Options();
            options.path = "/socket.io";
            options.transports = new String[]{"websocket"};
            options.query = "user=ABC";
//            options.reconnectionAttempts = 2;
//            options.reconnectionDelay = 1000;//失败重连的时间间隔
//            options.timeout = 500;//连接超时时间(ms)
            
//            OkHttpClient okHttpClient = new OkHttpClient.Builder()
//            		.hostnameVerifier(myHostnameVerifier)
//            		.sslSocketFactory(SSLSocketClient.getSSLSocketFactory(), SSLSocketClient.myX509TrustManager).build();
//            		//default settings for all sockets
//            IO.setDefaultOkHttpWebSocketFactory(okHttpClient);
//            IO.setDefaultOkHttpCallFactory(okHttpClient);
//
//            options.callFactory=okHttpClient;
//            options.webSocketFactory=okHttpClient;


            final Socket socket = IO.socket(url, options);

            socket.on(Socket.EVENT_CONNECT, new Emitter.Listener() {
                public void call(Object... args) {
                    //socket.send("Socket.EVENT_CONNECT");
                    System.out.println("Socket.EVENT_CONNECT");
                }
            });
            socket.on(Socket.EVENT_DISCONNECT, new Emitter.Listener() {
                public void call(Object... args) {
                    //socket.send("Socket.EVENT_CONNECT");
                    System.out.println("Socket.EVENT_DISCONNECT");
                }
            });

            //自定义事件
            socket.on("src-joined", new Emitter.Listener() {
                public void call(Object... objects) {
                    //socket.send("hello2");
                    System.out.println("receive src-joined data:" + objects[0].toString());
                }
            });

            socket.connect();
            
            socket.emit("src-join", "test-http-room");
            System.out.println("src-join 已发送");
            TimeUnit.SECONDS.sleep(3000);
            System.out.println("111111111disconnect");
            socket.disconnect();
            System.out.println("disconnect");

        }catch (Exception ex){
            ex.printStackTrace();
         
        }
        
    }




}
