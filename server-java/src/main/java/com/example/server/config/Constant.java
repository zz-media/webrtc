package com.example.server.config;


public class Constant {


    //spring父级application
    public static ResourceBundleHelper resourceBundle = new ResourceBundleHelper("application");

    // 外置文件读取路径
    public static String path = resourceBundle.getString("path");

    // 读取外置配置文件
    public static PropertiesHelper configHelper = new PropertiesHelper(path, "config.properties");


    /**
     * redis配置参数
     * @author shenjun
     */
    public static interface REDIS_PARAMS{
        String REDIS_HOST = configHelper.getString("spring.redis.host").trim();
        int REDIS_PORT = Integer.parseInt(configHelper.getString("spring.redis.port").trim());
        int REDIS_DATABASE = Integer.parseInt(configHelper.getString("spring.redis.database").trim());
        String REDIS_PASSWORD = configHelper.getString("spring.redis.password").trim();
    }

}
