package com.bk;

import java.io.IOException;
import java.io.OutputStream;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Map.Entry;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class UrlForword extends HttpServlet{
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		doPost(req, resp);
	}
	/**
	 * url转向代理 支持http://全类型数据请求 提交
	 * */
	protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException ,IOException {
		resp.setCharacterEncoding("utf-8");
		String url = req.getRequestURI().replaceAll(req.getContextPath()+"/url/", "http://");
		Enumeration<String> enumeration = req.getHeaderNames();
		Map<String, String> header = new HashMap<String, String>();
		String reqname = null;
		while (enumeration.hasMoreElements()) {
			reqname = enumeration.nextElement();
			header.put(reqname, req.getHeader(reqname));
		}
		StringBuilder sb = new StringBuilder();
		Map<String, String[]> params = req.getParameterMap();
		Iterator<Entry<String, String[]>> it = params.entrySet().iterator();
		Entry<String, String[]> entry = null;
		while (it.hasNext()) {
			entry = it.next();
			if(entry.getKey()!=null){
				if("wsdl".equals(entry.getKey().toLowerCase())){
					url+="?wsdl";
					if(entry.getValue()!=null&&entry.getValue().length!=0){
						url+="="+entry.getValue()[0];
					}
				}else{
					sb.append(entry.getKey()+"="+entry.getValue()[0]);
				}
			}
		}
		HttpClient client = new HttpClient(url);
		OutputStream otsStream = resp.getOutputStream();
		if("".equals(sb.toString().trim())){
			client.get(otsStream);
		}else{
			client.post(sb.toString().getBytes(),otsStream);
		}
		resp.setCharacterEncoding(client.getConn().getContentEncoding());
		resp.setContentLength(client.getConn().getContentLength());
		resp.setContentType(client.getConn().getContentType());
		otsStream.close();
	}
}
