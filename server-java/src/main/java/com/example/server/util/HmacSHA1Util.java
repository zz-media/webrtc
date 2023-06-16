package com.example.server.util;

import java.util.Base64;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

public class HmacSHA1Util {
	/**
    *
    * @param s 需加密的字符串
    * @param key 秘钥
    * @return 加密
    * @throws Exception
	*/
   public static String signHexString(String s, String key) throws Exception {
       //HMAC-SHA1 算法签名
       Mac mac = Mac.getInstance("HmacSHA1");
       SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes("UTF-8"),mac.getAlgorithm());
       mac.init(secretKeySpec);
       byte[] hash = mac.doFinal(s.getBytes("UTF-8"));
       //转16进制String
       String result = "";
       String tmp = "";
       for (byte bt : hash) {
       	tmp = (Integer.toHexString(bt & 0xFF));
           if (tmp.length() == 1) {
               result += "0";
           }
           result += tmp;
       }
       return result;
   }
   
   /**
   *
   * @param s 需加密的字符串
   * @param key 秘钥
   * @return 加密
   * @throws Exception
   */
	public static String signBase64String(String s, String key) throws Exception {
		//HMAC-SHA1 算法签名
		Mac mac = Mac.getInstance("HmacSHA1");
		SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes("UTF-8"),mac.getAlgorithm());
		mac.init(secretKeySpec);
		byte[] hash = mac.doFinal(s.getBytes("UTF-8"));
		//转BASE64进制String
		Base64.Encoder encoder = Base64.getEncoder();
		String base64String = encoder.encodeToString(hash);
		return base64String;
	}
}
