package com;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.net.URLClassLoader;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class Objc {
	private static final Map<String, Class<?>> pool = new ConcurrentHashMap<String, Class<?>>();
	
	private static class ReLoader extends URLClassLoader {
		public ReLoader(ClassLoader parent) {
			super(new URL[0], parent);
		}

		/* (non-Javadoc)
		 * @see java.lang.ClassLoader#loadClass(java.lang.String)
		 */
		@Deprecated
		@Override
		public Class<?> loadClass(String fullName) throws ClassNotFoundException {
			InputStream ins = this.getClass().getClassLoader().getResourceAsStream(fullName);
			ByteArrayOutputStream bos = new ByteArrayOutputStream();
			int b=-1;
			if(ins==null)
				return Class.forName(fullName);
			try {
				while ((b=ins.read())!=-1) {
					bos.write(b);
				}
				byte[] classData = bos.toByteArray();
				fullName = fullName.replace('/', '.');
				return this.defineClass(fullName.substring(0, fullName.lastIndexOf('.')), classData, 0, classData.length);
			} catch (IOException e) {
				e.printStackTrace();
				throw new RuntimeException("类字节码加载失败！");
			}
		}
	}
	
	private static ReLoader RELOADER_CLASS_LOADER = new ReLoader(Objc.class.getClassLoader());
	
	public static <T> T load(Class<?> clazz){
		return load(clazz.getCanonicalName());
	}
	
	public static <T> T load(String clazz){
		Class<?> obj = pool.get(clazz);
		try {
			if(obj==null){
				obj = RELOADER_CLASS_LOADER.loadClass(clazz.replace('.', '/')+".class");
				pool.put(clazz,obj);
			}
			return (T) obj.newInstance();
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}
	
	public static void reload(String... clazzes){
		RELOADER_CLASS_LOADER = new ReLoader(Objc.class.getClassLoader());
		for(String str:clazzes){
			pool.remove(str);
		}
		if(clazzes==null||clazzes.length==0){
			pool.clear();
		}
	}
}
