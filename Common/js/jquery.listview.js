	(function($,undefined){
		$.fn.listview = function(){
			if(typeof arguments[0]=="string")
				return $.fn.listview.methods[arguments[0]].apply(this,Array.prototype.slice.call(arguments,1));
			
			var opt = Object.create($.fn.listview.defaults.protytype);
			$.extend(true,opt,$.fn.listview.defaults,arguments[0]);
			
			var div = $("<div class='listview'></div>").appendTo(this);
			if(opt.hidden)
				div.hide();
			
			opt.shower=this;
			
			$.data(this[0],"listview",{options:opt,view:div});
			
			var jq = this;
			if(opt.data&&opt.data.length>0){
				if(opt.view.simple)
					opt.data = opt.grepAry(opt,opt.data);
				jq.listview("loadData",opt.data);
				setTimeout(function(){
					opt.event.onLoad.call(jq,opt,opt.data);
				},0);
			}else{
				opt.ajaxer(opt,{},function(data){
					data = opt.dataFilter.call(jq,data);
					if(opt.view.simple)
						data = opt.grepAry(opt,data);
					jq.listview("loadData",data);
					opt.event.onLoad.call(jq,opt,data);
				});
			}
			return this;
		}


		//遍历节点   当返回节点是数组类型 且长度大于0 这停止并且向数组添加一条后退出
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
							options.eachNode(function(node){
								if(putAction.call(options,node)==false) return false;
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
			checkAllNodes:function(flag,pnode){
				return this.each(function(){
					var opt = $(this).listview("options");
					
					if(typeof pnode=="number"||typeof pnode=="string")
						pnode = $(this).listview("getNodes",opt.options.view.idKey,pnode);
					else if(!(pnode instanceof Array)) pnode = [pnode];
					else if(pnode==undefined||pnode.length<=0)
						pnode = $(this).listview("getRoot");
					
					for(var index = 0;index<pnode.length;index++){
						if(pnode[index]){
							opt.options.eachNode(function(node){
								if(node.type=="nav"){
									return;
								}
								if(node.checkDisable!=true)
									node.checked = flag;
								else node.checked = false;
							},pnode[index]);
						}
					}
					var node;
					opt.view.find("li").each(function(){
						if((node = $.data(this,"nodedata"))!=undefined)
							opt.options.formartNode.call($(this),opt.options,node);
					});
				});
			},
			checkNodes:function(nodes,flag,pnode){
				var checknode = [];
				this.each(function(){
					if(typeof nodes=="boolean"){
						return $(this).listview("checkAllNodes",nodes,flag,pnode);
					}
					if(nodes.length==0) {
						return;
					}
					if(typeof nodes == 'string'){
						nodes = nodes.split(",");
					}
					
					if(flag==undefined) flag = true;
					
					var reshnode = nodes.slice(0);
					//这里分步处理 是由于有些节点并没有在前端展示 也就不需要刷新
					$(this).listview("refeshNodes",function(node){
						if(nodes.length==0){
							return false;
						} 
						//后台数据增加
						var opt = this;
						if(node.type=="nav"){
							return;
						} 
						if(node.checkDisable){
							node.checked = false;
							return ;
						}
						
						$.each(nodes,function(i,item){
							var val =item[opt.view.idKey];
							if(val==undefined) val = item;
							if(val==node[opt.view.idKey]){
								node.checked = flag;
								nodes.splice(i,1);
								checknode.push(node);
								return false;
							}
						});
					},function(options,node){
						//节点刷新
						var jq = this;
						$.each(reshnode,function(i,item){
							var val = item[options.view.idKey];
							if(val==undefined) val=item;
							if($.data(jq,"nodedata")[options.view.idKey]==val){
								options.formartNode.call($(jq),options,node);
								nodes.splice(i,1);
								return true;
							}
						});
					});
					return checknode;
				});
				if(checknode.length>0)
					return checknode;
				else return this;
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
				var opt = this.listview("options").options;
				
				$.each(pnode,function(index,item){
					nodes = nodes.concat(opt.eachNode(param,val,item));
				});
				//剔除 返回按钮
				nodes = $.grep(nodes,function(node){
					return node.type!="nav";
				});
				return nodes;
			},
			getRoot:function(){
				var pnode = [];
				$(this.listview("options").view.children()[0]).children().each(function(){
					pnode.push($.data(this,"nodedata"));
				});
				return pnode;
			},
			//获取节点的兄弟节点
			getNodeParent:function(node){
				var nodes = this.listview("getNodePath",node);
				if(nodes.length==1)
					return [];
				return nodes[nodes.length-2];
			},
			//获取节点路径  从上往下的排列成数组展示
			getNodePath:function(node){
				//获取节点路径
				var nodes=[],pnode = this.listview("getRoot"),opt = this.listview("options").options;
				node = node[opt.view.idKey].toString()||node;

				for(var pi=0;pi<pnode.length;pi++){
					nodes = opt.getNodePathByFileter(function(n){
						return n[opt.view.idKey]==node;
					},pnode[pi]);
					if(nodes&&nodes.length>0) break;
				}
				return nodes;
			},
			//加载具有树形结构的数据
			loadData:function(data){
				return this.each(function(){
					var ul = $("<ul class='listviewchild'></ul>"),li,input,inputtype,opt = $(this).listview("options"),options = opt.options;
					ul.appendTo(opt.view);
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
							options.createChildBtn.call(li,opt,data[i]);
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
						options.reFormartNode.call(li,options,data[i]);
					}
				});
			},
			addChilds:function(nodes,pnode){
				return this.each(function(){
					var opt = $.data(this,"listview");
					if(typeof pnode=="string")
						pnode = eval("{"+opt.options.view.idKey+":'"+pnode+"'}");
					
					pnode = $(this).listview("getNodes",opt.options.view.idKey,pnode[opt.options.view.idKey])[0];
					if(opt.options.check.nocheckInherit||opt.options.check.chkDisabledInherit){
						$.each(nodes,function(i,item){
							if(!item.checked&&opt.options.check.nocheckInherit){
								item.checked = pnode.checked;
							}
							if(!item.checkDisable&&opt.options.check.chkDisabledInherit){
								item.checkDisable = pnode.checkDisable;
							}
						});
					}
					$(this).listview("refreshNodes",pnode,function(node,item){
							node.isParent=true;
							node.childs = nodes;
					},function(options,node){
							options.createChildBtn.call($(this),opt,node);
							options.formartNode.call($(this),options,node);
							return false;
					});
				});
			}
		}
		$.fn.listview.defaults = {
			view:{simple:true,idKey:"id",nameKey:"name",pidKey:"pid"},
			async:true,
			event:{
				onLoad:function(){},
				onClick:function(){},
				onExpandBefore:function(node){return true;},
				onExpand:function(node){},
				onCheckBefore:function(node){return true;},
				onCheck:function(node){}
			},
			dataFilter:function(data){
				if(typeof data=="string")
					data = eval("("+data+")").data;
				return data;
			},
			createTool:function(node){},//this当前 li元素
			url:"",
			ajaxer:function(opt,node,upfunc){
				node = node||{};
				$.ajax({
					url:opt.url,
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
				var prev = $("<i class='icon-chevron-left btn-back'><span class='btn-text'>"+data[opt.view.nameKey]+"</span></i>");
				prev.off("click");
				prev.on("click",function(){
					$(this.closest("ul")).remove();
					parent.show();
					parent.find("li").each(function(){
						if($.data(this,"nodedata"))
							opt.formartNode.call(this,opt,$.data(this,"nodedata"));
					})
				});
				prev.prependTo(li);
				li.appendTo(this);
			},
			reFormartNode:function(options,node){ }, //li 元素
			check:{
				enable:true,
				type:"radio",
				nocheckInherit:true,//继承父级节点的checked属性
				chkDisabledInherit:true,//继承父级disable属性
				checkbox:{checked:"icon-check",empty:"icon-check-empty",half:"icon-check-half",type:{ "Y": "ps", "N": "ps" },disable:"icon-disable"},
				radio:{checked:"icon-ok-sign",empty:"icon-circle-blank",half:"icon-check-half",type:"all"||"level",disable:"icon-disable"}
			}
		}
		
		//将普通json转换成具有层级结构的json数据
		/**
		 * 可接收参数  2 argumnents[0] val
		 * */
		$.fn.listview.defaults.protytype = {
			eachNode:function(param,val,node,key){
				var opt = this;
				if(typeof arguments[1] == "object") {
					key=node;node = val;val = param;param = "";
				}
				if(!key) key = "childs";
				var ns = [],nstemp;
				if(node[key]&&node[key].length>0)
					$.each(node[key],function(i,item){
						nstemp = opt.eachNode(param,val,item);
						if(typeof nstemp=="boolean") return nstemp;
						else if(nstemp instanceof Array){
							ns = ns.concat(nstemp);
						}
					});
				if(val instanceof RegExp){
					if(val.test(node[param])) ns.push(node);
				}else if(val instanceof Function){//使用函数过滤 如果返回false 会终止称程序继续遍历节点
					var res;
					if((res=val(node))==undefined) ns.push(node);
					else if(typeof res=="boolean") return res;
				}else if(node[param]== val) ns.push(node);
				
				return ns;
			},
			grepAry:function(opt,data){
				var ary = data;
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
			},
			getNodePathByFileter : function(filter,node,key){
				var opt = this;
				var nodes = [],nodetemps;
				if(!key) key = "childs";
				if(node[key]){
					for(var index =0;index<node[key].length;index++){
						if((nodetemps = opt.getNodePathByFileter(filter,node[key][index]))&&nodetemps.length>0){
							nodes.unshift(node);
							nodes = nodes.concat(nodetemps);
							break;
						}
					}
				}
				if(filter(node)){
					nodes.push(node);
				}
				if(nodes&&nodes.length>0)
					return nodes;
			},
			checkNode : function(check,type,flag,listview){
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
						$.data($(this).parent()[0],"nodedata").checked=flag;
						var nodes = list.listview("getNodePath",$.data($(this).parent()[0],"nodedata"));
						//list.listview("extendNodes",nodes,{checked:flag});
						
						if(!flag){
							for(var ni=nodes.length-1;ni>=0;ni--){
								if(nodes[ni].childs){
									for(var ci=0;ci<nodes[ni].childs.length;ci++){
										if(nodes[ni].childs[ci].checked==true){
											nodes.splice(ni,1);
											break;
										}
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
			},
			formartNode : function(options,node){
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
					
					if(node.checked){//如果节点是选中状态  更新样式
						span.removeClass(options.check[checkType].empty).addClass(options.check[checkType].checked);
					}
					
					options.halfSelect.call(span,options,node,options.check[checkType].half);
					
					if(node.checkDisable!=true){
						
						span.off("click");
						span.on("click",function(){
							var node = $.data($(this).parent()[0],"nodedata"),flag=$(this).hasClass(options.check[checkType].checked);
							if(options.event.onCheckBefore.call($(this),flag,node)){
								options.checkNode.call(this,options.check[checkType],checkType,!flag);
								options.event.onCheck.call($(this),options,$.data($(this).parent()[0],"nodedata"));
							}

							options.formartNode.call($(this).parent()[0],options,$.data($(this).parent()[0],"nodedata"));
						});
					}else{
						span.off("click");
						span.addClass(options.check[checkType].disable);
					}
				}
			},
			halfSelect : function(opt,node,flag){
				opt.eachNode(function(item){
					if(item.childs){
						var half  = false,isall=true,isbreak=false;
						$.each(item.childs,function(i,ic){
							if(ic.type=='nav') return true;
							if(ic.half){ //子节点半选  父节点必须半选
								item.half  = true;
								isbreak = true;
								return false;
							}
							if(ic.checked){ //子节点选中 父节点需判定 是否全选
								half = true;
								return false;
							}
						});
						if(isbreak) return;
						$.each(item.childs,function(i,ic){
							if(ic.type=='nav') return true;
							if(!ic.checked){
								isall = false;
								return false;
							}
						});
						item.half = half;
						if(item.checked){//父节点选中 看看子节点是否全选了
							item.half = !isall;
						}
					}
				},node);
				if(node.half)
					this.addClass(flag);
			},
			createChildBtn : function(opt,node){
				var shower = opt.options.shower;
				var options = opt.options;
				var p = $("<i class='icon-right icon-plus-sign-alt'></i>");
				var count = node.childs.length;
				if(node.childs[0].type=="nav"){
					count = node.childs.length-1;
				}
				count = $("<i class='icon-right icon-number'>"+count+"</i>");
				
				this.append(p);
				this.append(count);
				p.off("click tap");
				p.on("click tap",function(){
					var pp = $(this).parent(),dd,parent = $(this).closest("ul");
					if(options.event.onExpandBefore.call(shower,$.data(pp[0],"nodedata"))){
						parent.hide();
						if(dd = $.data(pp[0],"nodedata").childs){
							dd.parent = parent;
							options.loadChild.call(shower,opt,dd);
						} else if(options.async){
							options.ajaxer.call(options,$.data(pp[0],"nodedata"),function(data){
								data = options.dataFilter(data);
								data.parent = parent;
								$.data(pp[0],"nodedata").childs = data;
								options.loadChild.call(shower,opt,data);
							});
						}
						options.event.onExpand.call(shower,$.data(pp[0],"nodedata"))
					}
				});

				options.createTool.call(this,node);
			}
		}
	})(jQuery);
	
	(function($,undefined){
		'use strict';
		$.extend(true,$.fn.listview.methods,{
			disableNodes:function(filter){
				return this.each(function(){
					$(this).listview("refeshNodes",function(node){
						if(filter(node)){
							node.checked = false;
							node.checkDisable = true;
						}
					},function(options,node){
						return true;
					});
				})
			},
			show:function(){
				return this.each(function(){
					var opt = $.data(this,"listview").view.show();
				});
			},
			hide:function(){
				return this.each(function(){
					var opt = $.data(this,"listview").view.hide();
				});
			}
		});
	})(jQuery)
	
