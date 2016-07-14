package com.vito.act.action;

import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpSession;

import com.vito.act.anotition.Action;
import com.vito.act.anotition.Method;
import com.vito.act.anotition.ReqBody;
import com.vito.act.anotition.ResponseWrite;
import com.vito.act.service.impl.UserServiceImpl;

@Action("/user")
public class UserAction {
	
	@ResponseWrite
	@Method("getTree")
	public Map<String,Object> getTree(HttpSession session){
		Map<String,Object> map = new HashMap<String,Object>();
		try{
			String userId = (String) session.getAttribute("_currentUser");
			map.put("code", "0");
			map.put("data", new UserServiceImpl().getTree(userId));
			map.put("currentUser", userId);
			map.put("msg", "程序执行成功！");
		}catch(Exception e){
			e.printStackTrace();
			map.put("code", "1");
			map.put("msg", "程序执行异常："+e.getMessage());
		}
		return map;
	}
	
	@Method("index")
	public Object index(@ReqBody StringBuilder sb){
		System.out.println(sb.toString());
		return sb.toString();
	}
}
