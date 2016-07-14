package com.vito.tool;

import java.beans.BeanInfo;
import java.beans.IntrospectionException;
import java.beans.Introspector;
import java.beans.PropertyDescriptor;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.lang.annotation.Annotation;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import com.alibaba.fastjson.JSONObject;
import com.vito.anotition.Param;
import com.vito.anotition.ReqBody;
import com.vito.anotition.ResponseWrite;

public class ActionUtil {
	//拦截请求地址  并在 
	public static boolean resolve(HttpServletRequest req,HttpServletResponse res) throws Exception{
		String allurl = req.getPathInfo(),objurl = null,methodurl=null;
		if(allurl.lastIndexOf("/")==0) return false;
		
		int last = allurl.lastIndexOf("/"); 
		objurl = allurl.substring(1,last);
		methodurl = allurl.substring(allurl.lastIndexOf("/")+1);
		
		Class<?> obj = HttpContext.getObj(objurl);
		if(obj!=null){
			Method[] ms = obj.getMethods();
			for(Method method:ms){
				if(method.getName().equals(methodurl)){
					Class<?>[] classes = method.getParameterTypes();
					Object[] objs = new Object[classes.length];
					if(classes!=null&&classes.length>0){
						Annotation[][] anss = method.getParameterAnnotations();
						Annotation[] ans = null;
						for(int i=0,j=classes.length;i<j;i++){
							ans = anss[i];
							for(Annotation a:ans){
								if(a.annotationType().equals(Param.class)){
									objs[i]=req.getParameter(((Param)a).value());
									break;
								}else if(a.annotationType().equals(ReqBody.class)){
									if(((ReqBody)a).value()){
										BufferedReader bf=null;
										try{
											bf=new BufferedReader(new InputStreamReader(req.getInputStream()));
											StringBuilder sb = new StringBuilder();
											String temp = null;
											while ((temp = bf.readLine())!=null) {
												sb.append(temp);
											}
											objs[i]=sb;
										}finally{
											if(bf!=null)
												bf.close();
										}
									}
								}
							}
							if(classes[i].equals(HttpServletRequest.class)){
								objs[i]=req;
							}else if(classes[i].equals(HttpServletRequest.class)){
								objs[i]=res;
							}else if(classes[i].equals(HttpSession.class)){
								objs[i]=req.getSession();
							}else if(classes[i].equals(Map.class)){
								objs[i]= req.getParameterMap();
							}else{
								try{
									if(objs[i]==null){
										Map<String, String[]> map = req.getParameterMap();
										objs[i] = map2Bean(classes[i],map);
									}
								}catch(Exception e){
									e.addSuppressed(new Exception(obj+":"+method+",参数类型异常！"));
									throw e;
								}
							}
						}
					}
					Object result = method.invoke(HttpContext.createInstance(obj), objs);
					res.setCharacterEncoding("UTF-8");
					if(result!=null){
						if(method.getAnnotation(ResponseWrite.class)!=null){
							if(result instanceof String||result instanceof Integer||result instanceof Double){
								res.getWriter().write(result.toString());
							}else{
								String str = JSONObject.toJSONString(result);
								if(str!=null){
									res.getWriter().write(str);
								}
							}
							res.getWriter().close();
						}else{
							//throw new Exception("程序没有定义");
							req.getRequestDispatcher(allurl+".html").forward(req, res);
						}
					}
					return true;
				}
			}
			req.getRequestDispatcher(allurl).forward(req, res);
			return true;
		}else return false;
	}
	

	public static <T> T map2Bean(Class<T> clazz, Map<?,?> map)
			throws IntrospectionException, IllegalAccessException,
			InstantiationException, InvocationTargetException {
		BeanInfo beanInfo = Introspector.getBeanInfo(clazz); // 获取类属性
		T obj = clazz.newInstance(); // 创建 JavaBean 对象
		// 给 JavaBean 对象的属性赋值
		PropertyDescriptor[] propertyDescriptors =  beanInfo.getPropertyDescriptors();
		for (int i = 0; i< propertyDescriptors.length; i++) {
			PropertyDescriptor descriptor = propertyDescriptors[i];
			String propertyName = descriptor.getName();
			if (map.containsKey(propertyName)) {
				Object value = map.get(propertyName);
				descriptor.getWriteMethod().invoke(obj, value);
			}
		}
		return obj;
	}
}
