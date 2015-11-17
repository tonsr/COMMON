/**
 * 为JSON对象扩展方法，将json格式数据转换成String类型
 * @author 唐明豪
 * @date 2015-08-03
 * */
var JSON = function(){};
JSON.toStr=function(obj){
	if(JSON.isArray(obj)){
		var res = "[";
		for(var i=0;i<obj.length;i++){
			res+=JSON.toStr(obj[i])+",";
		}
		if(res.charAt(res.length-1)==","){
			res = res.substr(0,res.length-1);
		}
		res +="]";
		return res;
	}else if(JSON.isObject(obj)){
		var res = "{";
		for(var k in obj){
			res += k+":"+JSON.toStr(obj[k])+",";
		}
		if(res.charAt(res.length-1)==","){
			res = res.substr(0,res.length-1);
		}
		res +="}";
		return res;
	}else {
		return "'"+obj+"'";
	}
}
JSON.isObject=function(obj){
	if(Object.prototype.toString.call(obj) === '[object Object]')
		return true;
	return false;
}
JSON.isArray=function(obj){
	if(Object.prototype.toString.call(obj) === '[object Array]')
		return true;
	return false;
}
