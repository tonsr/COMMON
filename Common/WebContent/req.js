/**
R.req('svg.js',function(app){
	app 指向 svg.js 中对this 该对象包含了 R所提供对获取函数
	app.param={"hello":"xxxx"};
	app.init();
}); 

svg.js...
R(function(){
	this.req("svg");
	this.init=function(){
		console.log(this);
	}
});
 * */
var R = function(upfun){
	if(upfun){
		var model = R;
		upfun.call(model); 
		return model;
	}
};
R.extend = function(json){
	for(var key in json){
		this[key] = json[key];
	}
	return this;
};

R.extend({
	/**
	 * 加载js文件
	 * */
	ajax:function(conf){
		var config = {
			url:"",
			dataType:"json",
			async:true,
			method:"GET",
			data:undefined,
			success:function(data){},
			error:function(e){}
		}

		for(var key in conf){
			config[key] = conf[key];
		}
		var oAjax = null;
		if(window.XMLHttpRequest){
		    oAjax = new XMLHttpRequest();
		}else{
		    oAjax = new ActiveXObject('Microsoft.XMLHTTP');
		}
		oAjax.open(config.method, config.url, config.async);
		if(config.method.toLowerCase()=="post"){
			oAjax.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
		}
		oAjax.onreadystatechange=function(){
		    if(oAjax.readyState==4){
		        if(oAjax.status==200){
		            config.success(oAjax.responseText);
		        }else{
		            config.error(oAjax);
		        }
		    }
		};

		if(config.data){
			oAjax.send(config.data);
			return ;
		}
		oAjax.send();
	},
	/**
	 * 辅助R.data 函数
	 * */
	cache:{},
	/**
	 * 程序缓存对象存放处
	 * @param ele key 只传入key 获取返回值
	 * @param arg value value 存在则更新原有key对应的值
	 * */
    data:function(ele,arg){
       if(typeof ele== "string"){
          if(arg){
             R.cache[ele]=arg;
          }else{
             return R.cache[ele];
          }
      }
    },
    /**
     * {
      		basepath:"指定项目路径",
			defined:[
					{别名:{js:js文件路径,css:css文件路径,rely:[依赖指向的别名]}}
			        {jquery:{js:"js/jquery.min.js"}},
			        {bootstrap:{js:"js/bootstrap.min.js",css:"css/bootstrap.min.css",rely:["jquery"]}},
			        {ztree:{js:"js/jquery.ztree.core.js",css:"css/zTreeStyle.css",rely:["jquery"]}},
			        {ztreecheck:{js:"js/jquery.ztree.excheck.js",rely:["ztree"]}},
			        {svg:{js:"svg.js",rely:"bootstrap"}}
				],
			resource:["ztreecheck","svg"] //也可以是 resource:"svg"
		}
     * */
	conf:{
		basepath:"",
		defined:[],
		resource:[]
	},
	/**
	  *	加载成功 返回true 其他情况不返回信息
	  * @param resource 请求的定义好的资源别名  并关联出依赖的js
	  * @param upfunc 依赖js加载完成后回调函数
	  **/
	load:function(resource,upfunc){
		if(resource){
			var villload,rely,upfunc = typeof upfunc=="function"?upfunc:function(){};
			if(typeof resource == "string"){ //加载别名js
				for(var definedindex in R.conf.defined){
					if(villload = R.conf.defined[definedindex][resource]){
						resource = villload;
						break;
					}
				}
			}
			
			if(rely = resource.rely){ //存在依赖 先解决依赖关系
				if(typeof rely=="string") rely = [rely];
				for(var relyindex=rely.length-1;relyindex>=0;relyindex--){
					if(relyindex!=0){//依赖js 不能之间存在互相引用
						for(var definedindex in R.conf.defined){
							if(R.load(R.conf.defined[definedindex][rely[relyindex]]))
							break;
						}
					}else{
						for(var definedindex in R.conf.defined){
							if(R.load(R.conf.defined[definedindex][rely[relyindex]],function(){
								//依赖关系完成后 在加载当前需要的js
								if(resource.js){
									R.req(resource.js,upfunc);
								}
								if(resource.css){
									R.req(resource.css);
								}
							}))
							break;
						}
					}
				}
				return true;
			}
			//没有依赖直接处理
			if(resource.js){
				R.req(resource.js,upfunc);
			}
			if(resource.css){
				R.req(resource.css);
			}
			return true;
		}
	},
	/**
	 * 执行配置文件 并运行指定需要悠闲加载的文件
	 *  var config = {
			defined:[
					{别名:{js:js文件路径,css:css文件路径,rely:[依赖指向的别名]}}
			        {jquery:{js:"js/jquery.min.js"}},
			        {bootstrap:{js:"js/bootstrap.min.js",css:"css/bootstrap.min.css",rely:["jquery"]}},
			        {ztree:{js:"js/jquery.ztree.core.js",css:"css/zTreeStyle.css",rely:["jquery"]}},
			        {ztreecheck:{js:"js/jquery.ztree.excheck.js",rely:["ztree"]}},
			        {svg:{js:"svg.js",rely:"bootstrap"}}
				],
			resource:["ztreecheck","svg"] //也可以是 resource:"svg"
		}
	 * 	R.config(config);
	 * */
	config:function(config){
		if(typeof config == "object"){
			for(var key in config){
				this.conf[key] = config[key];
			}
		}
		var delyqune = []; 
		var rely = null,resource=this.conf.resource;
		if(typeof resource=="string") resource = [resource];
		this.load(resource[0],function(){
			config.resource.shift(0);
			R.config(config);
		});
		if(typeof config == "function"){
			config();
		}
	},
	/**
	 * 引用一个css或js文件 或定义的别名js  
	 * js可以携带后缀
	 * @param url 'css/awesome.css' or 'js/jquery.min.js' or jquery(由config定义defined中的别名)
	 * @param boolean true 异步请求js资源文件 false 同步请求js资源文件   or 
	 * 		  fucntion 请求完成后回调函数
	 * @param boolean 同第二个参数为 boolean是相同作用
	 * */
	req:function(url,upfunc,sync){
		if(!url){
			return;
		}
		for(var k in R.conf.defined){ //请求定义好的js资源对象
			if(R.load(R.conf.defined[k][url],typeof upfunc=="function"?upfunc:function(){})){
				return ;
			}
		}
		//请求css资源文件 写入doc文件头部
		if(url.substr(url.lastIndexOf("."))==".css"){
			var model = null;
			if((model = R.data(url))){
				if(typeof upfunc == "function")
					upfunc(model);
			}else if(!R.data(url)){
				R.data(url,true);
				var style = document.createElement('link');
				style.setAttribute("href",R.conf.basepath+url);
				style.setAttribute("type","text/css");
				style.rel = 'stylesheet';
				var head = document.getElementsByTagName("head")[0];
				head.appendChild(style);
			}
		}else{ //请求 js 资源文件
			if(typeof upfunc=="boolean"){
				sync = upfunc;
				upfunc = false;
			}
			if(sync==undefined){
				sync = true;
			}
			if(url.substr(url.lastIndexOf('.'))=='.js'){
				url = url.substr(0,url.lastIndexOf('.'));
			}
			var model = null;
			if((model = R.data(url))){
				if(upfunc)
					upfunc(model);
			}else{
				R.data(url,true);
				R.ajax({
					url:this.conf.basepath+url+".js",
					dataType:"json",
					async:sync,
					success:function(data){
						model = eval.call(window,data);
						R.data(url,model);
						if(upfunc)
							upfunc(model);
					}
				});
			}
		}
	}
});
