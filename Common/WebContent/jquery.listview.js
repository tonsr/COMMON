	(function($,undefined){
		$.fn.listview = function(){
			if(typeof arguments[0]=="string")
				return $.fn.listview.methods[arguments[0]].apply(this,Array.prototype.slice.call(arguments,1));
			
			var opt = $.extend(true,{},$.fn.listview.defaults,arguments[0]);
			
			var div = $("<div class='listview'></div>");
			div.insertAfter(this);
			
			$.data(this[0],"listview",{options:opt,view:div,shower:this});
			
			if(opt.data&&opt.data.length>0){
				if(opt.view.simple)
					opt.data = grepAry(opt,opt.data);
				this.listview("loadData",opt.data);
			}else{
				var jq = this;
				opt.ajaxer(opt,{},function(data){
					data = opt.dataFilter(data);
					if(opt.view.simple)
						data = grepAry(opt,data);
					jq.listview("loadData",data);
					opt.onLoad.call(jq,data);
				});
			}
		}
		//将普通json转换成具有层级结构的json数据
		var grepAry = function(opt,data){
			var ary = [];
			$.inIds = function(id,data){
				for(var i =0;i<data.length;i++){
					if(data[i][opt.view.idKey] == id) return true;
				}
				return false;
			}
			ary = $.grep(data,function(item){
				if(!item[opt.view.pidKey]) return true;
				return $.inIds(item[opt.view.pidKey],data);
			});
			$.each(ary,function(i,aritem){
				aritem.childs=$.grep(data,function(item){
					if(item[opt.view.pidKey] == aritem[opt.view.idKey]){
						item.isR = true;
						return true;
					}return false;
				});
				if(aritem.childs&&aritem.childs.length>0){
					aritem.isParent = true;
				}else aritem.isParent = false;
			});
			ary = $.grep(data,function(item){
				if(!item.isR) return true;
				return false;
			});
			return ary;
		}
		
		var getNodeByClosest = function(param,val,node){
			var ns = [];
			if(node.childs&&node.childs.length>0)
				$.each(node.childs,function(i,item){
					ns = ns.concat(getNodeByClosest(param,val,item));
				});
			if(val instanceof RegExp){
				if(val.test(node[param])) ns.push(node);
			}else if(val instanceof Function){
				if(val(node)) ns.push(node);
			}else if(node[param]== val) ns.push(node);
			
			return ns;
		}
		var eachNode = function(filter,node){
			if(node.childs&&node.childs.length>0)
				for(var i=0;i<node.childs.length;i++){
					if(eachNode(filter,node.childs[i])==false){
						return false;
						break;
					}
				}
			return filter(node);
		}
		var getNodePathByFileter = function(filter,pnode){
			var nodes = [],flag=false,nodetemps;
			if(pnode.childs){
				for(var index =0;index<pnode.childs.length;index++){
					if((nodetemps = getNodePathByFileter(filter,pnode.childs[index]))&&nodetemps.length>0){
						nodes.unshift(pnode);
						nodes = nodes.concat(nodetemps);
						flag = true;
						break;
					}
				}
			}
			if(filter(pnode)){
				nodes.push(pnode);
			}
			if(nodes&&nodes.length>0)
				return nodes;
		}
		var checkNode = function(check,type,flag,listview){
			var list = $($.data($(this).closest("ul")[0],"listview"));
			if(type=="radio"){
				if(check.type=="level"){
					$(this).parent().siblings().each(function(){
						$(this).find(".icon").removeClass(check.checked).addClass(check.empty);
						if($.data(this,"nodedata"))
							$.data(this,"nodedata").checked = false;
					});
				}else if(check.type=="all"){
					list.listview("checkNodes",false);
				}
			}else if(type=="checkbox"){
				type = flag?"Y":"N";
				if(check.type[type].indexOf("p")!=-1){
					//级联销毁父级选中
					var nodes = list.listview("getNodePath",$.data($(this).parent()[0],"nodedata"));
					list.listview("extendNodes",nodes,{checked:flag});
					
					if(!flag){
						for(var ni=nodes.length-1;ni>=0;ni--){
							for(var ci=0;ci<nodes[ni].childs.length;ci++){
								if(nodes[ni].childs[ci].checked==true){
									nodes[ni]={};
									break;
								}
							}
						}
					}
					list.listview("checkNodes",nodes,flag);
				}
				if(check.type[type].indexOf("s")!=-1){
					list.listview("checkNodes",flag,$.data($(this).parent()[0],"nodedata"));
				}
			}
			if(flag){
				$(this).removeClass(check.empty).addClass(check.checked);
			}else{
				$(this).removeClass(check.checked).addClass(check.empty);
			}
			$.data($(this).parent()[0],"nodedata").checked = flag;
		}
		
		$.fn.listview.methods = {
			options:function(){
				return $.data(this[0],"listview");
			},
			//刷新节点
			refeshNodes:function(pnode,putAction,dealAction){
				return this.each(function(){
					if(pnode instanceof Function){
						dealAction = putAction;putAction = pnode;
						pnode = $(this).listview("getRoot");
					}
					if(!(pnode instanceof Array)){
						pnode = [pnode];
					}
					var options = $(this).listview("options").options,jq = $(this).listview("options").view;
					
					//后端js修改数据
					for(var index = 0;index<pnode.length;index++){
						if(pnode[index]){
							getNodeByClosest("",function(node){
								putAction.call(options,node);
							},pnode[index]);
						}
					}
					
					//前段刷新
					jq.find("li").each(function(){
						if($.data(this,"nodedata")){
							dealAction.call(this,options,$.data(this,"nodedata"));
						}
					});
				});
			},
			checkNodes:function(nodes,flag,pnode){
				return this.each(function(){
					if(typeof nodes=="boolean"){
						pnode = flag; flag = nodes;
						nodes = $(this).listview("getNodes","",function(){return true;},pnode);
					}
					//这里分步处理 是由于有些节点并没有在前端展示 也就不需要刷新
					$(this).listview("refeshNodes",function(node){
						//后台数据增加
						var opt = this;
						$.each(nodes,function(i,item){
							if(item[opt.view.idKey]==node[opt.view.idKey]){
								node.checked = flag;
								return true;
							}
						});
					},function(options,node){
						//节点刷新
						var jq = this;
						$.each(nodes,function(i,item){
							if($.data(jq,"nodedata")[options.view.idKey]==(item[options.view.idKey]||item)){
								options.formartNode.call($(jq),options,node);
								return true;
							}
						});
					});
				});
			},
			/**
			 * 获取节点  
			 * @param param 节点属性key
			 * @param val   节点值处理  可以为正则表达式 或过滤函数 或key真实对应的数据
			 * @param pnode 查询需要的父级节点
			 * @return 返回查找到的节点
			 * */
			getNodes:function(param,val,pnode){
				var nodes = [];
				if(!pnode){
					pnode = this.listview("getRoot");
				}
				if(!(pnode instanceof Array)){
					pnode = [pnode];
				}
				
				$.each(pnode,function(index,item){
					nodes = nodes.concat(getNodeByClosest(param,val,item));
				});
				//剔除 返回按钮
				nodes = $.grep(nodes,function(node){
					return node.type!="nav";
				});
				return nodes;
			},
			getRoot:function(filter){
				var pnode = [];
				$(this.listview("options").view.children()[0]).children().each(function(){
					if(filter&&typeof filter=="function"){
						filter.call(this);
					}else{
						pnode.push($.data(this,"nodedata"));
					}
				});
				return pnode;
			},
			//获取节点的兄弟节点
			getNodeSiblings:function(node){
				var nodes = this.listview("getNodePath",node);
				return nodes[nodes.length-2].childs;
			},
			//获取节点路径  从上往下的排列成数组展示
			getNodePath:function(node){
				//获取节点路径
				var nodes=[],pnode = this.listview("getRoot"),opt = this.listview("options").options.view;
				node = node[opt.idKey]||node;

				for(var pi=0;pi<pnode.length;pi++){
					nodes = getNodePathByFileter(function(n){
						return n[opt.idKey]==node;
					},pnode[pi]);
					if(nodes&&nodes.length>0) break;
				}
				return nodes;
			},
			//为node扩展一些属性
			extendNodes:function(node,json){
				return this.each(function(){
					var jq = $(this);
					$.each(node,function(i,item){
						jq.listview("updateNode",$.extend(true,item,json));
					});
				});
			},
			//更新node节点  为具有相同ID的node节点增加当前节点所有的新属性数据
			updateNode:function(node){
				return this.each(function(){
					var opt = $(this).listview("options").options.view;
					$(this).listview("getRoot",function(){
						eachNode(function(n){
							if(n[opt.idKey]==node[opt.idKey]){
								n = $.extend(true,{},n,node);
								return false;
							}
						},$.data(this,"nodedata"));
					})
				});
			},
			//加载具有树形结构的数据
			loadData:function(data){
				return this.each(function(){
					var ul = $("<ul></ul>"),li,input,inputtype,options = $(this).listview("options"),shower = options.shower;
					ul.appendTo(options.view);
					options = options.options;
					$.data(ul[0],"listview",this);
					
					for(var i=0;i<data.length;i++){
						if(data[i].type == "nav"){
							options.createNav.call(ul,options,data[i],data.parent);
							continue;
						}
						li = $("<li></li>");
						li.appendTo(ul);
						li.text(data[i][options.view.nameKey]);
						$.data(li[0],"nodedata",data[i]);
						//绑定父级节点
						if(data[i].isParent){
							var p = $("<i class='icon-right icon-plus-sign-alt'></i>");
							var count = data[i].childs.length;
							if(data[i].childs[0].type=="nav"){
								count = data[i].childs.length-1;
							}
							count = $("<i class='icon-right icon-number'>"+count+"</i>");
							
							li.append(p);
							li.append(count);
							p.off("click tap");
							p.on("click tap",function(){
								var pp = $(this).parent(),dd,parent = $(this).closest("ul");
								parent.hide();
								if(dd = $.data(pp[0],"nodedata").childs){
									dd.parent = parent;
									options.loadChild.call(shower,options,dd);
								} else if(options.async){
									options.ajaxer.call(options,$.data(pp[0],"nodedata"),function(data){
										data = options.dataFilter(data);
										data.parent = parent;
										$.data(pp[0],"nodedata").childs = data;
										options.loadChild.call(shower,options,data);
									});
								}
							});
						}
						li.off("click tap");
						li.on("click tap",function(){
							$(this).parent().children().each(function(){
								$(this).removeClass("current_node");
								if($.data(this,"nodedata"))
									$.data(this,"nodedata").selected = false;
							});
							$(this).addClass("current_node");
							$.data(this,"nodedata").selected = true;
							options.event.onClick.call(this,$.data(this,"nodedata"));
						});
						options.formartNode.call(li,options,data[i]);
					}
				});
			}
		}
		$.fn.listview.defaults = {
			view:{simple:true,idKey:"id",nameKey:"name",pidKey:"pid"},
			async:true,
			onLoad:function(){},
			event:{
				onClick:function(){},
				onCheckBefore:function(node){return true;},
				onCheck:function(node){}
			},
			dataFilter:function(data){
				if(typeof data=="string")
					data = eval("("+data+")").data;
				data[0].checkDisable = true;
				return data;
			},
			url:"",
			param:{id:"pid"},
			ajaxer:function(opt,node,upfunc){
				node = node||{};
				$.ajax({
					url:opt.url,
					data:(function(opt,node){var json = "{";for(var key in opt.param){json+=key+":"+node[opt.param[key]]+","} if(json.lastIndexOf(",")==json.length-1) json = json.substr(0,json.length-1);return new Function("return "+json+"};");})(opt,node)(),
					success:function(data){
						upfunc(data);
					}
				});
			},
			loadChild:function(opt,data){
				if(data){
					if(data[0].type!="nav")
						data.unshift({type:"nav",name:"返回"});
					this.listview("loadData",data);
				}
			},
			createNav:function(opt,data,parent){
				var li = $("<li></li>");
				var prev = $("<i class='icon-chevron-left'>"+data[opt.view.nameKey]+"</i>");
				prev.off("click");
				prev.on("click",function(){
					$(this.closest("ul")).remove();
					parent.show();
				});
				prev.prependTo(li);
				li.appendTo(this);
			},
			formartNode:function(options,node){
				var checkType;
				if(node.checkType=="checkbox"||node.checkType=="radio"){
					checkType = node.checkType;
				}else{
					checkType = options.check.type;
				}
				
				//清除原有样式
				var span = $(this).find(".icon")
							.removeClass(options.check[checkType].checked)
							.removeClass(options.check[checkType].half)
							.removeClass(options.check[checkType].disable)
							.addClass(options.check[checkType].empty);
				
				if(options.check.enable){
					var jq=this;
					if(span.length<=0){
						span = $("<i class='icon "+options.check[checkType].empty+"'></i>");
						span.prependTo(jq);
					}
					
					if(node.checkDisable!=true){
						if(node.checked){//如果节点是选中状态  更新样式
							span.removeClass(options.check[checkType].empty).addClass(options.check[checkType].checked);
						}
						span.off("click");
						span.on("click",function(){
							if(checkType=="radio"){
								if(options.event.onCheckBefore.call($(this),true,$.data($(this).parent()[0],"nodedata"))){
									checkNode.call(this,options.check[checkType],checkType,true);
									options.event.onCheck.call($(this),$.data($(this).parent()[0],"nodedata"));
								}
							}else if(checkType=="checkbox"){
								//任意节点勾选
								var node = $.data($(this).parent()[0],"nodedata"),flag=$(this).hasClass(options.check[checkType].checked);
								if(options.event.onCheckBefore.call($(this),flag,node)){
									if(flag){
										checkNode.call(this,options.check[checkType],checkType,false);
									}else{
										checkNode.call(this,options.check[checkType],checkType,true);
									}
									options.event.onCheck.call($(this),$.data($(this).parent()[0],"nodedata"));
								}
							}
						});
					}else{
						span.off("click");
						span.addClass(options.check[checkType].disable);
					}
				}
			},
			check:{
				enable:true,
				type:"radio",
				nocheckInherit:true,//继承父级节点的checked属性
				chkDisabledInherit:true,//继承父级disable属性
				checkbox:{checked:"icon-check",empty:"icon-check-empty",half:"icon-circle-blank",type:{ "Y": "ps", "N": "ps" },disable:"icon-disable"},
				radio:{checked:"icon-ok-sign",empty:"icon-circle-blank",half:"icon-circle",type:"all"||"level",disable:"icon-disable"}
			}
		}
	})(jQuery);
	
	$(function(){
		$("#input").listview({
			//data:[{id:0,name:"1111"},{id:2,name:"2222",checked:true},{id:3,name:"3333",pid:2},{id:4,name:"4444",pid:2,checked:true},{id:5,name:"5555",pid:2,checked:true},{id:6,name:"6666",pid:3},{id:7,name:"7777",pid:3},{id:8,name:"8888",pid:4,checked:true},{id:9,name:"9999",pid:8},{id:10,name:"1010",pid:8},{id:12,name:"1011",pid:11}],
			url:"../user/getTree",
			view:{idKey:"id",nameKey:"name",pidKey:"pid"},
			onLoad:function(){
				//this.listview("checkNodes","00000000210000000319",true);
				this.listview("refeshNodes",function(node,item){
					//node.chkDisable=true;
					if(node.type=="dept"){
						node.checkDisable = true;
					}
				},function(options,node,item){
					//options.formartNode.call($(this),options,node);
					if($.data(this,"nodedata").type=="dept"){
						options.formartNode.call($(this),options,node);
					}
				})
				//this.listview("checkNodes",true,this.listview("getNodes","id","0000000018"));
				/*var node = this.listview("getNodes","id","00000026")[0];
				node.hello = "xxxxxxxxxxxxxxx";
				node.checked=true;
				this.listview("updateNode",node);
				console.log(this.listview("getNodes","id","00000026"));*/
			},
			check:{
				type:"radio"
			}
		});
		
		setTimeout(function(){
			console.log("NODES:",$("#input").listview("getNodes","checked",true));
		},3000);
	})
