var Color = function(options){
		Object.assign(this,Color.defaults,options);
		return this;
	}
	
Color.prototype = {
		getColor:function(){
			return this.transColor(this.linner[this.index]);
		},
		transColor:function(color){
			if(color instanceof Array){
				return color;
			}else if(typeof color =="string"){
				if(color.length==4)
					color = color.substring(1);
				if(color.length==7)
					color = color.substring(1);
				if(color.length==3){
					var c=[];
					for(var i in color){
						c[i]=parseInt(color.charAt(i),16)*16+15;
					}
					return c;
				}
				if(color.length==6){
					var c=[];
					for(var i=0;i<=color.length/2;i++){
						c[i]=parseInt(color.charAt(i*2)+color.charAt(i*2+1),16);
					}
					return c;
				}
					
			}
		},
		getNextColor:function(){
			return this.transColor(this.linner[this.index+this.prevstep]);
		},
		toString:function(){
			var r = this.r.toString(16),
				g = this.g.toString(16),
				b = this.b.toString(16);
			r = r.length==1?"0"+r:r;
			g = g.length==1?"0"+g:g;
			b = b.length==1?"0"+b:b;
			return "#"+r+g+b;
		},
		next:function(){
			if(this.currentStep>=this.step){
				this.index+=this.prevstep;
				if(this.index+1>=this.linner.length||this.index<=0){
					if(this.loop==false||this.count>=this.loop){
						this.index-=this.prevstep;
						return false;
					}
					this.prevstep=-this.prevstep;
				}
				this.count+=this.currentStep;
				this.currentStep=0;
			}
			var color1=this.colorAry||this.getColor(),color2=this.getNextColor();

			if(this.currentStep==0){
				var steplen = this.step-this.currentStep;
				this.colorstep=[
					            Math.ceil((color2[0]-color1[0])/steplen)||0,
					            Math.ceil((color2[1]-color1[1])/steplen)||0,
					            Math.ceil((color2[2]-color1[2])/steplen)||0
				               ];
			}
			
			var r = color1[0]+this.colorstep[0],
				g = color1[1]+this.colorstep[1],
				b = color1[2]+this.colorstep[2];
			
			this.r=(r>255||r<0)?color2[0]:r;
			this.g=(g>255||g<0)?color2[1]:g;
			this.b=(b>255||b<0)?color2[0]:b;
			
			console.log("%c"+this.toString(),"background:"+this.toString());
			this.colorAry=[this.r,this.g,this.b];
			this.currentStep++;
			return true;
		}
	};

	Color.defaults = {
		linner:["#F44336","#9C27B0","#2196F3","#00BCD4","#009688","#8bc34a","#ffeb3b"],
		step:10,        //步进step此
		index:0,        //当前记录点
		currentStep:0,  //当前走了几步了
		prevstep:1,     //步进方向
		count:0,        //计步器
		loop:false      //循环跑  多少次？？？
	};
	
	/**
	 *  使用案例
	 * */
	var c = new Color({
		step:5,
		loop:120
	});
	
	var c1 = new Color({
		linner:["#00BCD4","#8bc34a","#009688","#2196F3"],
		step:60
	});
	
	while(c.next()){
		c.loop=false;
		var span = document.createElement("span");
		span.appendChild(document.createTextNode(c.currentStep));
		span.style.background=c.toString();
		div.appendChild(span);
	}
	/*for(var i=0;i<200;i++){
		if(c.next()==-1){break;};
		var span = document.createElement("span");
		span.appendChild(document.createTextNode(i));
		span.style.background=c.toString();
		div.appendChild(span);
	}*/
	/* setInterval(function(){
		c1.next();
    	document.body.style.background = c1.toString();
    }, 100); */
