package com.example.server.common;

import java.io.Serializable;



public class Result implements Serializable {
    private boolean success=true;
    private int code;
    private String msg="";
    private Object data;



    public static  Result successMessage(String msg){
       Result result = new Result();
        result.setSuccess(Boolean.TRUE);
        result.setMsg(msg);
       return result;
    }
    public static  Result success(){
        Result result = new Result();
        result.setSuccess(Boolean.TRUE);
        return result;
    }

    public static  Result success(Object data){
        Result result = new Result();
        result.setSuccess(Boolean.TRUE);
        result.setData(data);
        return result;
    }

    public static  Result fail(String err){
        Result result = new Result();
        result.setSuccess(Boolean.FALSE);
        result.setMsg(err);
        return result;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public int getCode() {
        return code;
    }

    public void setCode(int code) {
        this.code = code;
    }

    public String getMsg() {
        return msg;
    }

    public void setMsg(String msg) {
        this.msg = msg;
    }

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }
}
