(function($,undefined){
	$.fn.textbox = function(){
		if(typeof arguments[0]=="string")
			return $.fn.textbox.methods[arguments[0]].apply(this,Array.prototype.slice.call(arguments,1));
		
		var opt = $.extend(true,{},$.fn.textbox.defaults,arguments[0]);
		var span = $("<span class='textbox'></span>").insertAfter(this);

		var textInput = $("<input class='textFiled' type='text'>").appendTo(span);
		var valueInput = $("<input class='valueFiled' type='hidden' name='"+this.attr("name")+"'>").appendTo(span);
		var width = this.outerWidth();
		this.hide();
		opt.textInput = textInput;
		opt.valueInput = valueInput;

		span.css({"width":width});
		
		var jq = this;
		$.grep(opt.icons,function(i,item){
			var icons = $("<span class='icons'><i class='"+item.icon+"'></i></span>").insertAfter(textInput);
			$.data(icons[0],"icondata",item);
			icons.on("click tap",function(e){
				if(typeof item.handel == "function")
					item.handel.call(this,e,$.data(this,"icondata"));
				if(typeof opt.onClickIcon == "function"){
					opt.onClickIcon.call(jq,$.data(this,"icondata"));
				}
			});
		});
		if(opt.iconCls&&opt.iconCls!=""){
			var icons = $("<span class='icons'><i class='"+opt.iconCls+"'></i></span>");
			icons.on("click tap",function(){
				if(typeof opt.onClickIcon == "function"){
					opt.onClickIcon.call(jq);
				}
			});
			if(opt.iconAlign=="right"){
				icons.insertAfter(textInput);
			}else{
				icons.insertBefore(textInput);
			}
		}
		if(opt.buttonText&&opt.buttonText!=""){
			var icons = $("<span class='icons'>"+opt.buttonText+"</span>");
			icons.on("click",function(){
				if(typeof opt.onClickButton == "function"){
					opt.onClickButton.call(jq);
				}
			});
			if(opt.buttonAlign=="right"){
				icons.insertAfter(textInput);
			}else{
				icons.insertBefore(textInput);
			}
		}
		textInput.on("keyup input",function(){
			valueInput.val($(this).val());
		})
		$.data(this[0],"textbox",{options:opt});
		var wid = 0;
		span.find(".icons").each(function(){
			wid += $(this).outerWidth()+2;
		});
		textInput.width(width-wid);
	}
	$.fn.textbox.defaults = {
		icons:[],
		onClickIcon:function(icon){
			
		},
		buttonText:'',    
	    iconCls:'',
	    iconAlign:'right',
	    buttonAlign:"right",
	    onClickButton:function(){}
	}
	$.fn.textbox.methods = {
		options:function(){
			return $.data(this[0],"textbox").options;
		},
		setText:function(arg){
			return this.each(function(){
				var opt = $.data(this,"textbox").options;
				opt.textInput.val(arg);
			});
		},
		readonly:function(arg){
			return this.each(function(){
				var opt = $.data(this,"textbox").options;
				var jq = $(this);
				if(arg==false){
					opt.textInput.siblings(".icons").off("click tap");
					opt.textInput.siblings(".icons").on("click tap",function(){
						var item = $.data(this,"icondata");
						if(item&&(typeof item.handel == "function"))
							item.handel.call(this,e,$.data(this,"icondata"));
						if(typeof opt.onClickIcon == "function"){
							opt.onClickIcon.call(jq,$.data(this,"icondata"));
						}
					});
					opt.textInput.removeAttr("readonly");
				} else {
					opt.textInput.siblings(".icons").off("click tap");
					opt.textInput.attr("readonly","readonly");
				}
			});
		},
		setValue:function(arg){
			return this.each(function(){
				var opt = $.data(this,"textbox").options;
				opt.valueInput.val(arg);
			});
		}
	}
})(jQuery)
