package com.example.server.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileReader;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.util.Properties;

import static java.lang.Boolean.parseBoolean;
import static java.lang.Integer.parseInt;
import static java.lang.Long.parseLong;

public final class PropertiesHelper {
	
	private static Logger logger = LoggerFactory.getLogger(PropertiesHelper.class);
	
    /**
     * 默认 classLoder 路径下
     *
     * @throws Exception
     * @param fileName
     */
    public PropertiesHelper(String fileName){
        try{
            properties = new Properties();
            InputStream in = this.getClass().getClassLoader().getResourceAsStream(fileName);
            properties.load(in);
            in.close();
        }catch (Exception e) {
        	logger.error("PropertiesHelper is fail:",e);
        }
    }
    /**
     * 自己指定路径
     * @param fileName
     * @throws Exception
     */
    public PropertiesHelper(final String path, final String fileName){
        try {
			File file = new File(path + fileName);
			if (null == file || !file.exists()) {
				logger.info("找不到文件");
			}
			properties = new Properties();
			final FileReader reader = new FileReader(file);
			properties.load(reader);
			reader.close();
		} catch (Exception e) {
			logger.error("PropertiesHelper is fail:",e);
		}
    }

    public PropertiesHelper(final Properties properties) {
        this.properties = properties;
    }

    public boolean contains(final Object key) {
        return properties.containsKey(key);
    }

    public <V> V get(final Converter<V> converter, final String key) {
        final String value = properties.getProperty(key);
        if (value == null)
            throw new IllegalArgumentException(key + " is missing.");
        return converter.convert(value.trim());
    }

    public <V> V get(final Converter<V> converter, final String key, final String defaultValue) {
        if (!properties.containsKey(key))
            return converter.convert(defaultValue);
        return converter.convert((properties.getProperty(key).trim()));
    }

	public boolean getBoolean(final String key) {
		final String value = properties.getProperty(key);
		if (value == null)
			throw new IllegalArgumentException(key + " is missing.");
		return parseBoolean(value.trim());
	}

	public boolean getBoolean(final String key, final boolean defaultValue) {
		if (!properties.containsKey(key))
			return defaultValue;
		return parseBoolean(properties.getProperty(key).trim());
	}

	public int getInt(final String key) {
		final String value = properties.getProperty(key);
		if (value == null)
			throw new IllegalArgumentException(key + " is missing.");
		return parseInt(value.trim());
	}

	public int getInt(final String key, final int defaultValue) {
		if (!properties.containsKey(key))
			return defaultValue;
		return parseInt(properties.getProperty(key).trim());
	}

	public long getLong(final String key) {
		final String value = properties.getProperty(key);
		if (value == null)
			throw new IllegalArgumentException(key + " is missing.");
		return parseLong(value.trim());
	}

	public long getLong(final String key, final long defaultValue) {
		if (!properties.containsKey(key))
			return defaultValue;
		return parseLong(properties.getProperty(key).trim());
	}

	public String getString(final String key) {
		final String value = properties.getProperty(key);
		if (value == null || value.length() == 0)
			throw new IllegalArgumentException(key + " is missing.");
		return value.trim();
	}

	public String getString(final String key, final String defaultValue) {
		return properties.getProperty(key, defaultValue).trim();
	}

	private Properties properties;

	public static interface Converter<V> {
		V convert(String value);
	}
    
    /**
     * 获取中文字符串 （若找不到参数，则返回中文简体的“操作失败”）
     * @author shenjun
     * @param key
     * @param defaultValue	默认值
     * @return
     */
    public String getCHString(final String key) {
        String value = properties.getProperty(key);
        if (value == null || value.length() == 0) {
            return "操作失败";
        }
        try {
            value = new String(value.getBytes("ISO-8859-1"),"UTF-8");
        } catch (UnsupportedEncodingException e) {
        	logger.error("getCHString is fail:",e);
        }
        return value.trim();
    }
    
    /**
     * 获取繁体中文字符串（若找不到参数，则返回繁体的“操作失敗”）
     * @author shenjun
     * @param key
     * @param defaultValue	默认值
     * @return
     */
    public String getCHTWString(final String key) {
    	String value = properties.getProperty(key);
    	if (value == null || value.length() == 0) {
    		return "操作失敗";
    	}
    	try {
    		value = new String(value.getBytes("ISO-8859-1"),"UTF-8");
    	} catch (UnsupportedEncodingException e) {
    		logger.error("getCHTWString is fail:",e);
    	}
    	return value.trim();
    }
    
    /**
     * 获取英文默认值（若找不到参数，则返回英文版的“operation failed”）
     * @author shenjun
     * @param key
     * @param defaultValue
     * @return
     */
    public String getENString(final String key) {
        final String value = properties.getProperty(key);
        if (value == null || value.length() == 0){
        	return "operation failed";
        }
        return value.trim();
    }

}
