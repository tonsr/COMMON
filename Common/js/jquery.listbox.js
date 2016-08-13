(function($){
	$.fn.listbox = function(){
		if(typeof arguments[0]=="string"){
			var func = $.fn.listbox.methods[arguments[0]];
			if(func){
				return func.apply(this,Array.prototype.slice.call(arguments,1))
			}else{
				return $.fn.textbox.methods[arguments[0]].apply(this,Array.prototype.slice.call(arguments,1));
			}
		}
		
		var opt = $.extend(true,{},$.fn.textbox.defaults,$.fn.listbox.defaults,arguments[0]||{});
		opt.textbox = this;
		opt.value = opt.value||this.val();
		
		
		var divs = $("<div class='panel listboxpanel'></div>").hide().appendTo($("body")).listview(opt);
		opt.listview = divs;
		
		this.textbox(opt);
		$.data(this[0],"listbox",{options:opt});
		
		
		var jq =this;
		$("body").on("click tap",function(e){
			if($(e.target).closest(".listviewchild").length<=0&&$(e.target).closest(".listboxpanel").length<=0&&$(e.target).closest(".textbox")[0]!=jq.next()[0]){
				jq.listbox("options").listview.slideUp();
				e.stopPropagation();
			}
		}); 
		return this;
	}
	
	$.fn.listbox.defaults = {
		data:[],
		event:{
			onCheck:function(opt,node){
				var nodes = opt.shower.listview("getNodes","checked",true);
				opt.textbox.listbox("setValue",nodes,false);
			},
			onLoad:function(opt,node){
				opt.shower.listview("checkNodes",opt.value);
				opt.event.onCheck(opt);
			}
		},
		maxHeight:300,
		hidden:false,
		view:{idKey:"id",nameKey:"name",pidKey:"pid"},
		iconCls:"icon-angle-down",
		onClickIcon:function(){
			this.listbox("togglePanel");
		}
	}
	
	$.fn.listbox.methods = {
		togglePanel:function(){
			return this.each(function(){
				var opt = $.data(this,"textbox").options;
				if(opt.listview.is(":hidden")){
					var width = opt.textInput.parent().outerWidth();
					var offset = opt.textInput.parent().offset();
					offset.top = offset.top + opt.textInput.parent().outerHeight();
					opt.listview.css({"width":width-4,"max-height":opt.maxHeight,"overflow-y":"auto"}).css(offset);
					opt.listview.slideDown();
					return;
				}
				opt.listview.slideUp();
			})
		},
		/**
		 * arguments[0] 节点数组 
		 * arguments[1] 是否触发树节点选择 设置false 可提高性能
		 **/
		setValue:function(ns,flag){
			return this.each(function(){
				var opt = $.data(this,"listbox").options;
				var text = [],val=[];
				if(flag==false){
					$.each(ns,function(i,item){
						text.push(item[opt.view.nameKey]);
						val.push(item[opt.view.idKey]);
					});
				}else{
					var opt = $.data(this,"listbox").options;
					var nodes = opt.listview.listview("checkNodes",ns,true);
					$.each(nodes,function(i,item){
						text.push(item[opt.view.nameKey]);
						val.push(item[opt.view.idKey]);
					});
				}
				$(this).textbox("setText",text.toString());
				$(this).textbox("setValue",val.toString());
			});
		}
	}
})(jQuery)
