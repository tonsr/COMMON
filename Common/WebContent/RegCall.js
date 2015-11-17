/**
 * 定时器封装，
 * @param upfun 定时执行的函数代码块
 * @param timer 定时时间周期 毫秒数
 * @param arg 	定时函数所需的参数数据 格式为json
 * 
 * @author 唐明豪
 * @date   2015-09-06 
 * 
 * @functions 
 * 			1.构造函数返回当前对象。
 * 			2.stop()  停止定时器执行。
 * 			3 pause() 暂停定时器执行，在下次时钟周期时开始暂停。
 * 			4.play()  继续定时器任务，在下次到达时钟周期时继续执行。 
 * 			5 start() 启动定时器任务。立即执行定时任务。
 * */
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
