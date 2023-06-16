package com.example.server.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ResourceBundle;

import static java.lang.Boolean.parseBoolean;
import static java.lang.Integer.parseInt;

/**
 * Created by zhangjunhao on 2019/5/8.
 */
public final class ResourceBundleHelper {
	public static Logger logger = LoggerFactory.getLogger(ResourceBundleHelper.class);
	
    private ResourceBundle rb = null;
    
    public ResourceBundle getRb() {
        return rb;
    }

    public void setRb(ResourceBundle rb) {
        this.rb = rb;
    }

    @SuppressWarnings("unused")
	private ResourceBundleHelper() {

    }

    /**
     * 根据文件名字获取文件
     * @param name
     */
    public ResourceBundleHelper(String name) {
        this(false, name);
    }

    /**
     * 获得当前文件
     * @param isActive 是否访问活跃文件
     * @param name
     */
    public ResourceBundleHelper(boolean isActive, String name) {
        try {
            ResourceBundle tmprb = ResourceBundle.getBundle(name);
            rb = tmprb;
        } catch (Exception e) {
        	logger.error("ResourceBundleHelper is fail:",e);
        }
    }

    public boolean getBoolean(final String key) {
        if (!rb.containsKey(key)) {
            return false;
        }
        return parseBoolean(rb.getString(key).trim());
    }

    public int getInt(final String key) {
        final String value = rb.getString(key);
        if (value == null) {
            throw new IllegalArgumentException(key + " is missing.");
        }
        return parseInt(value.trim());
    }

    public String getString(final String key) {
        final String value = rb.getString(key);
        if (value == null || value.length() == 0) {
            throw new IllegalArgumentException(key + " is missing.");
        }
        return value.trim();
    }



}
