	(function($,undefined){
		$.fn.listview = function(){
			if(typeof arguments[0]=="string")
				return $.fn.listview.methods[arguments[0]].apply(this,Array.prototype.slice.call(arguments,1));
			
			var opt = $.extend(true,{},$.fn.listview.defaults,arguments[0]);
			
			var div = $("<div class='listview'></div>");
			div.insertAfter(this);
			
			$.data(this[0],"listview",{options:opt,view:div,shower:this});
			
			if(opt.data&&opt.data.length>0){
				if(opt.view.simple){
					opt.data = grepAry(opt,opt.data);
				}
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
		var grepAry = function(opt,data,filter){
			var ary = data;
			$.each(ary,function(i,aritem){
				aritem.childs=$.grep(data,function(item){
					if(item[opt.view.pidKey] == aritem[opt.view.idKey]){
						item.isR = true;
						return true;
					}return false;
				});
				if(typeof filter=="function"){
					filter(aritem);
				}
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
			var ns = [],nstemp;
			if(node.childs&&node.childs.length>0)
				$.each(node.childs,function(i,item){
					nstemp = getNodeByClosest(param,val,item);
					if(typeof nstemp=="boolean") return nstemp;
					else if(nstemp instanceof Array){
						ns = ns.concat(nstemp);
					}
				});
			if(val instanceof RegExp){
				if(val.test(node[param])) ns.push(node);
			}else if(val instanceof Function){
				var res;
				if((res=val(node))==undefined) ns.push(node);
				else if(res==false) return ns;
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
		}
		//++
		var halfSelect = function(node,flag){
			getNodeByClosest("",function(item){
				if(item.childs){
					var half  = false,isall=true;
					$.each(item.childs,function(i,ic){
						if(ic.type=='nav') return true;
						if(ic.checked||ic.half){
							half = true;
							return false;
						}
					});
					$.each(item.childs,function(i,ic){
						if(ic.type=='nav') return true;
						if(!ic.checked){
							isall = false;
							return false;
						}
					});
					item.half = half;
					if(item.checked){
						item.half = !isall;
					}
				}
			},node);
			if(node.half)
				this.addClass(flag);
		}
		var formartNode = function(options,node){
			
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
					halfSelect.call(span,node,options.check[checkType].half);
					
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
								checkNode.call(this,options.check[checkType],checkType,!flag);
								options.event.onCheck.call($(this),$.data($(this).parent()[0],"nodedata"));
							}
						}

						//++
						formartNode.call($(this).parent()[0],options,$.data($(this).parent()[0],"nodedata"));
					});
				}else{
					span.off("click");
					span.addClass(options.check[checkType].disable);
				}
			}
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
					if(!pnode||pnode.length<=0)
						pnode = $(this).listview("getRoot");
					
					if(!(pnode instanceof Array)) pnode = [pnode];
					for(var index = 0;index<pnode.length;index++){
						if(pnode[index]){
							getNodeByClosest("",function(node){
								if(node.type=="nav"){
									console.log("非数据节点忽略操作！");
									return;
								}
								node.checked = flag;
							},pnode[index]);
						}
					}
					var node;
					opt.view.find("li").each(function(){
						if((node = $.data(this,"nodedata"))!=undefined)
							formartNode.call($(this),opt.options,node);
					});
				});
			},
			checkNodes:function(nodes,flag,pnode){
				return this.each(function(){
					if(typeof nodes=="boolean"){
						return $(this).listview("checkAllNodes",nodes,flag);
					}
					if(nodes.length==0) {
						return;
					}
					var reshnode = nodes.slice(0);
					//这里分步处理 是由于有些节点并没有在前端展示 也就不需要刷新
					$(this).listview("refeshNodes",function(node){
						if(nodes.length==0){
							console.log("停止刷新操作！");
							return false;
						} 
						//后台数据增加
						var opt = this;
						console.log("即将处理节点：",node,"候选节点",nodes);
						if(node.type=="nav"){
							console.log("非数据节点忽略操作！");
							return;
						} 
						$.each(nodes,function(i,item){
							console.log("后台数据增加:",item);
							var val =item[opt.view.idKey];
							if(val==undefined) val = item;
							if(val==node[opt.view.idKey]){
								console.log("找到节点：",item);
								node.checked = flag;
								nodes.splice(i,1);
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
								formartNode.call($(jq),options,node);
								nodes.splice(i,1);
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
				node = node[opt.idKey].toString()||node;

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
								if(options.event.onExpandBefore.call(shower,$.data(pp[0],"nodedata"))){
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
									options.event.onExpand.call(shower,$.data(pp[0],"nodedata"))
								}
							});

							options.createTool.call(li,data[i]);
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
						
						formartNode.call(li,options,data[i]);
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
				onExpandBefore:function(node){return true;},
				onExpand:function(node){},
				onCheckBefore:function(node){return true;},
				onCheck:function(node){}
			},
			dataFilter:function(data){
				if(typeof data=="string")
					data = eval("("+data+")").data;
				data[0].checkDisable = true;
				return data;
			},
			createTool:function(node){},//this当前 li元素
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
				var prev = $("<i class='icon-chevron-left btn-back'><span class='btn-text'>"+data[opt.view.nameKey]+"</span></i>");
				prev.off("click");
				prev.on("click",function(){
					$(this.closest("ul")).remove();
					parent.show();

					//++
					parent.find("li").each(function(){
						if($.data(this,"nodedata"))
							formartNode.call(this,opt,$.data(this,"nodedata"));
					})
				});
				prev.prependTo(li);
				li.appendTo(this);
			},
			formartNode:function(options,node){ }, //li 元素
			check:{
				enable:true,
				type:"radio",
				nocheckInherit:true,//继承父级节点的checked属性
				chkDisabledInherit:true,//继承父级disable属性
				checkbox:{checked:"icon-check",empty:"icon-check-empty",half:"icon-check-half",type:{ "Y": "ps", "N": "ps" },disable:"icon-disable"},
				radio:{checked:"icon-ok-sign",empty:"icon-circle-blank",half:"icon-circle",type:"all"||"level",disable:"icon-disable"}
			}
		}
	})(jQuery);
	
