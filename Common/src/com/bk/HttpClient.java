package com.bk;

import java.io.*;
import java.net.*;
import java.util.*;

public class HttpClient {
	/** 
	 * url 地址
	 * */
	private String url = null;
	
	private static final int BYTELENGTH = 2048;
	/**
	 * 请求头信息
	 * */
	private Map<String, String> reqs = new HashMap<String, String>(){
		/**
		 * 
		 */
		private static final long serialVersionUID = -5515725831839932637L;
		{
		}
	};
	
	public HttpClient(String url){
		this.url = url;
	}
	public HttpClient(String url,Map<String, String> reqs){
		this(url);
		this.reqs.putAll(reqs);
	}
	
	private OutputStream out;
	private InputStream ins ;
	private HttpURLConnection conn;
	
	/**
	 * 创建HTTP连接
	 * */
	private void connect() throws IOException{
		URL realUrl = new URL(url);
		conn = (HttpURLConnection) realUrl.openConnection();
		if(reqs!=null){
			Iterator<Map.Entry<String, String>> it = reqs.entrySet().iterator();
			Map.Entry<String, String> entry = null;
			while (it.hasNext()) {
				entry = it.next();
				conn.setRequestProperty(entry.getKey(), entry.getValue());
			}
		}
	}
	/**
	 * post方式提交数据
	 * @param param 需要提交的数据
	 * */
	public void post(byte[] bytes,OutputStream out) throws IOException{
		connect();
		conn.setRequestMethod("POST");
		if(bytes!=null){
			conn.setRequestProperty("Content-Length", bytes.length+"");
		}
		conn.setDoOutput(true);
		conn.setDoInput(true);
		this.out = conn.getOutputStream();
		this.out.write(bytes);
		this.out.flush();
		wirte(out);
	}

	public void get(OutputStream out) throws IOException{
		connect();
		conn.setRequestMethod("GET");
		this.conn.connect();
		wirte(out);
	}
	
	private void wirte(OutputStream out) throws IOException {
		try{
			ins = conn.getInputStream();
			byte[] buffer = new byte[BYTELENGTH];
			int len = 0;
			while ((len = ins.read(buffer))!=-1) {
				out.write(buffer, 0, len);
			}
			out.flush();
			this.conn.disconnect();
		} finally {
			try {
				if(ins!=null)
					ins.close();
			} finally {
				if(this.out!=null) 
					this.out.close();
			}
		}
	}

	public HttpURLConnection getConn() {
		return conn;
	}

}