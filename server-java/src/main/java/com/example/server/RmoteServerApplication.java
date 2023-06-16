package com.example.server;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import com.example.server.listener.ApplicationCloseListener;

/**
 * https://blog.csdn.net/qq_35387940/article/details/126058386
 * @author zz
 *
 */
@SpringBootApplication
public class RmoteServerApplication {
	
	private static Logger log = LoggerFactory.getLogger(RmoteServerApplication.class);
	
	
    public static void main(String[] args){
        SpringApplication application = new SpringApplication(RmoteServerApplication.class);
        application.addListeners(new ApplicationCloseListener()); application.run(args);
        log.info("js socketio访问：io.connect(url,{path: 'socket.io',transports: ['websocket']})");
    }
}
