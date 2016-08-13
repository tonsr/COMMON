(function($,undefined){
	$.fn.upload = function(){
		if(typeof arguments[0]=="string"){
			var func = $.fn.upload.methods[arguments[0]];
			if(func) return func.apply(this,Array.prototype.slice.call(arguments,0));
			else 
				return $.fn.textbox.methods[arguments[0]].apply(this,Array.prototype.slice.call(arguments,0));
		}
		
		var opt = $.extend(true,{},$.fn.upload.defaults,arguments[0]||{});

		var jq =this;
		
		var nd = $("<div class='panel uploadpanel'></div>").hide().appendTo($("body"));
		opt.view = nd;
		
		var controller = $("<div class='controller'></div>").appendTo(nd);
		
		var itemspan = $("<div class='uploadlist'></div>").appendTo(nd);
		
		var div = $("<div class='uploadview'></div>").width(70).appendTo(itemspan);
		
		$("<span class='select'>选择文件</span>").appendTo(controller).click(function(){
			file.click();
		});
		$("<span class='select'>文件上传</span>").click(function(){
			var data = [];
			jq.upload("options").view.find(".uploadview").find(".item").each(function(){
				var d = $.data(this,"data");
				if(d)
					data.push(d);
				opt.onUpload.call(jq,data);
			});
		}).appendTo(controller);
		
		var file = $("<input type='file' style='display:none;'>").appendTo(controller);
		if(opt.isMutil){
			file.attr("multiple","multiple");
		}
		
		file.on("change",function(e){
			var files = e.target.files;
			$.grep(files,function(file){
				if(opt.grepFile(file)){
					if(/image\/.*?/.test(file.type)){
						fileView.image.call(opt,div,file,function(){
							if(!opt.isMutil){
					        	setSelectBtn(true);
					        }
						});
				   }else if(/video\/.*?/.test(file.type)){
						fileView.video.call(opt,div,file,function(){
							if(!opt.isMutil){
					        	setSelectBtn(true);
					        }
						});
				   }else{
				   		fileView.other.call(opt,div,file);	
				   }
					
				}
			})
		});
		
		$.extend(true,opt,$.fn.upload.defaults,arguments[0]);
		
		$.data(this[0],"upload",opt);
		
		this.textbox(opt);

		$("body").on("click tap",function(e){
			if($(e.target).closest(".uploadpanel").length<=0&&$(e.target).closest(".textbox")[0]!=jq.next()[0]){
				jq.upload("options").view.slideUp();
				e.stopPropagation();
			}
		}); 
		return this;
	}
	var fileView = {
		mp3:function(){

		},
		image:function(div,file,upfunc){
			var reader = new FileReader();
			reader.readAsDataURL(file);
		    reader.onload=function(e){
		    	var span = $("<span class='item'></span>").prependTo(div);
		    	
		    	$("<span class='filedes'>"+file.name+"</span>").appendTo(span);
		    	
		    	$("<i class='icon icon-trash'></i>").on("tap click",function(){
		    		$(this).closest(".item").remove();
		    	}).appendTo(span);
		    	
			    var img = $("<img src='" + this.result +"' alt=''/>").prependTo(span);

		        $.data(span[0],"data",{result:this.result,file:file});
		        
		        div.width(div.outerWidth()+span.outerWidth());
		        if(typeof upfunc == 'function') 
		        	upfunc.call(img);
		    } 
		},
		video:function(div,file,upfunc){
			var reader = new FileReader();
			reader.readAsDataURL(file);
		    reader.onload=function(e){
		    	var span = $("<span class='item'></span>").prependTo(div);
		    	
		    	$("<span class='filedes'>"+file.name+"</span>").appendTo(span);
		    	
		    	$("<i class='icon icon-trash'></i>").on("tap click",function(){
		    		$(this).closest(".item").remove();
		    	}).appendTo(span);
		    	 
			    var img = $('<audio controls="controls"></audio>').appendTo(span);
		        img.src = file.path;

		        $.data(span[0],"data",{result:this.result,file:file});
		        
		        div.width(div.outerWidth()+span.outerWidth());
		        if(typeof upfunc == 'function') 
		        	upfunc.call(img);
		    } 
		},
		txt:function(){

		},
		other:function(div,file,upfunc){
			var span = $("<span class='item'></span>").prependTo(div);
					    	
	    	$("<span class='filedes'>"+file.name+"</span>").appendTo(span);
	    	
	    	$("<i class='icon icon-trash'></i>").on("tap click",function(){
	    		$(this).closest(".item").remove();
	    	}).appendTo(span);

	    	$("<img src='" + (this.fileIcon[file.name.substr(file.name.lastIndexOf(".")+1)]||this.fileIcon.defaults) +"' alt=''/>").prependTo(span);
	
	        $.data(span[0],"data",{file:file});
	        
	        div.width(div.outerWidth()+span.outerWidth());
	        if(typeof upfunc == 'function') 
		        upfunc.call(img);
		}
	}
	$.fn.upload.defaults = {
		hidden:true,
		uploadUrl:"",
		isMutil:true,
		maxSize:5,
		maxFileSize:1024,
		exts:['png','gif','jpg','mp4'],
		grepFile:function(file){
			if(!file) return false;
			var ext = this.getFileExt(file.name);
			if($.inArray(ext,this.exts)!=-1) return true;
			return false;
		},
		getFileExt:function(file){
			if(file) return file.substr(file.indexOf(".")+1);
		},
		fileIcon:{
			xlsx:"excel.png",
			doc:"word.png",
			docx:"word.png",
			exe:"exe.png",
			txt:"txt.png",
			defaults:"unkown.png"
		},
		onClickButton:function(){
			this.upload("togglePanel");
		},
		onUpload:function(data){
			debugger;
			console.log(data);
		}
	}
	$.fn.upload.methods = {
		options:function(){
			return $.data(this[0],"upload");
		},
		togglePanel:function(){
			return this.each(function(){
				var opt = $.data(this,"upload");
				if(opt.view.is(":hidden")){
					var offset = $(this).next().offset();
					offset.top = offset.top +  $(this).next().outerHeight();
					
					opt.view.css("width",$(this).next().outerWidth()-2).css(offset);
					opt.view.slideDown();
				}else{
					opt.view.slideUp();
				}
			})
		}
	}
})(jQuery)
