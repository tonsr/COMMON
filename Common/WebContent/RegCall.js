/**
 * 循环调用 类似java中定时器
 */
var RegCall = function(upfun,timer,arg){
	this.regCallFlag = false;
	this.interval = undefined;
	this.close = false;
	var reg = this;
	var execute = 0;
	reg.stop = function(){
		reg.regCallFlag = false;
		clearInterval(reg.interval);
		reg.interval = undefined;
	}
	reg.pause = function(){
		this.regCallFlag = false;
		return reg;
	}
	reg.play = function(arg){
		this.regCallFlag = true;
		if(arg){
			if(execute>=arg){
				reg.stop();
			}
		}
		return reg;
	}
	reg.start = function(){
		reg.interval = setInterval(function(){
			if(!!reg.regCallFlag){
				upfun(arg,reg);
				execute++;
			}
		},timer);
		upfun(arg,reg);
		execute++;
	}
	reg.start();
	return reg;
}
