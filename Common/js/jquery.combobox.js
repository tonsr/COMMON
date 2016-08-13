(function($,undefined){
	$.fn.combobox = function(){
		if(typeof arguments[0]=="string"){
			var func = $.fn.combobox.methods[arguments[0]];
			if(func){
				return func.apply(this,Array.prototype.slice.call(arguments,1))
			}else{
				return $.fn.textbox.methods[arguments[0]].apply(this,Array.prototype.slice.call(arguments,1));
			}
		}

		var opt = $.extend(true,{},$.fn.textbox.defaults,$.fn.combobox.defaults,arguments[0]||{});
		
		var div = $("<div class='panel combopanel'></div>");
		opt.panel = div;
		div.hide();
		
		div.appendTo($("body"));
		
		this.textbox(opt);
		$.data(this[0],"combobox",{options:opt});
		
		if(opt.data){
			this.combobox("loadData",opt.data);
		}
		var val = opt.value||this.val();
		if(val&&val!=""){
			this.combobox("setValue",val);
		}
		
		var jq =this;
		$("body").on("click tap",function(e){
			if($(e.target).closest(".combopanel").length<=0&&$(e.target).closest(".textbox")[0]!=jq.next()[0]){
				jq.combobox("options").panel.slideUp();
				e.stopPropagation();
			}
		}); 
		return this;
	}
	
	$.fn.combobox.methods = {
		togglePanel:function(){
			return this.each(function(){
				var opt = $.data(this,"textbox").options;
				if(opt.panel.is(":hidden")){
					var width = opt.textInput.parent().outerWidth();
					var offset = opt.textInput.parent().offset();
					offset.top = offset.top+opt.textInput.parent().outerHeight();
					opt.panel.css({"width":width-2}).css(offset);
					opt.panel.slideDown();
				}else{
					opt.panel.slideUp();
				}
			});
		},
		setValue:function(arg){
			return this.each(function(){
				var jq = this;
				var opt = $.data(this,"combobox").options;
				if(arg&&(typeof arg == "string")){
					var fun = new Function("return {"+opt.valueFiled+":'"+arg+"'}");
					arg = fun();
				}
				if(arg){
					opt.panel.find(".comboitem").each(function(){
						var data = $.data(this,"itemdata");
						if(data[opt.valueFiled]==arg[opt.valueFiled]){
							data.selected = true;
							$(this).addClass("selected");
						}
					});
				}
				var text = [];
				var val = [];
				opt.panel.find(".selected").each(function(){
					text.push($.data(this,"itemdata")[opt.textFiled]);
					val.push($.data(this,"itemdata")[opt.valueFiled]);
				});
				if(text&&text.length==1){
					$(jq).textbox("setText",text[0]);
					$(jq).textbox("setValue",val[0]);
				}else{
					$(jq).textbox("setText",text.toString());
					$(jq).textbox("setValue",val.toString());
				}
			});
		},
		loadData:function(data){
			return this.each(function(){
				var opt = $.data(this,"combobox").options;
				opt.data = data;
				opt.panel.empty();
				var jq = this;
				$.grep(data,function(item){
					var itemdiv = $("<div class='comboitem'>"+item[opt.textFiled]+"</div>");
					$.data(itemdiv[0],"itemdata",item);
					if(item.selected){
						itemdiv.addClass("selected");
						$(jq).combobox("setValue");
					}
					itemdiv.on("click tap",function(){
						if(!opt.isMutil){
							$(this).parent().find(".selected").each(function(){
								$.data(this,"itemdata").selected=false;
								$(this).removeClass("selected");
							});
							$(jq).combobox("togglePanel");
						}
						if($(this).hasClass("selected")){
							$(this).removeClass("selected");
							$.data(this,"itemdata").selected=false;
						}else{
							$(this).addClass("selected");
							$.data(this,"itemdata").selected=true;
						}
						$(jq).combobox("setValue");
						opt.onSelect.call(jq,$.data(itemdiv[0],"itemdata"));
					});
					itemdiv.appendTo(opt.panel);
				})
			});
		}
	}
	$.fn.combobox.defaults = {
		iconCls:"icon-angle-down",
		onClickIcon:function(){
			this.combobox("togglePanel");
		},
		onSelect:function(){
			
		},
		isMutil:false
	}
	
})(jQuery)
