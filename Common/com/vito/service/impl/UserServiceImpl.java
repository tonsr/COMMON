package com.vito.act.service.impl;

import java.util.List;
import com.vito.act.db.DBProxy;
import com.vito.act.db.DbUtil;
import com.vito.act.service.UserService;

public class UserServiceImpl implements UserService{

	public List<Object> getTree(String userId) {
		StringBuffer sb = new StringBuffer();
		sb.append(" select d.dept_id id,d.dept_name name,d.dept_parent_id pid,'dept' type,d.dept_id userid from tbl_base_dept d where d.dept_id in (")
		.append("select distinct du.dept_id from act_ex_dept_user du")
		.append(" ) union all")
		.append(" select u.user_id id,u.user_name name ,du.dept_id pid,'user',u.user_id from tbl_base_user u ,act_ex_dept_user du")
		.append(" where u.user_id in du.user_id");

		DBProxy dbp = new DBProxy(new DbUtil<Object>());
		List<Object> list = null;
		try {
			list = dbp.getDb().queryMap(sb.toString());
		} catch (Exception e) {
			e.printStackTrace();
		}
		return list;
	}
	
}
