var log = function(json) {
	var log = this;
	log.debugModel = true;
	log.iscreate = false;
    this.json = { level: "debug", pkg: "default" };
    if (json) { for (var k in json) { this.json[k] = json[k]; } }
    this.levels = { "debug": 0, "info": 1, "warn": 2, "error": 3, "fault": 4 };
    var create = function(){
    	iscreate = true;
    	if(document.getElementById("div_log")==undefined){
    		$("body").append("<div id='div_log' draggable='true'><textarea class='logcleararea' id='clear_input'></textarea></div><button onclick='$(\"#div_log\").toggle();' class='logdivtoggle'>loger</button>");
    		$("#clear_input").on("keydown",function(e){
    			if(e.keyCode==13){
    				var cmd = $(this).val();
    				eval("($('#div_log')."+cmd+")");
    				$(this).val("");
    			}
    		});
    	}
    }
    var createLog = function(e,log,msg){
    	var date = new Date();
    	var m = date.getMinutes();
    	var s = date.getSeconds();
    	console.log(log.json.pkg + e+"\t" +m+":"+s+ "\t" + msg);
    	if(log.debugModel&&!log.iscreate){
    		create();
    	}
    	if(document.getElementById("div_log")==undefined){
    		log.iscreate==false;
    	}
    	if(log.debugModel&&!log.iscreate){
    		$("#div_log").append("<div class='"+e+"'><span class='pkg'>"+log.json.pkg +m+":"+s+"</span><span class='level'>"+e+"</span><span class='msg'>" + msg+"</span></div>");
    		$("#div_log").animate({scrollTop: $("#div_log").get(0).scrollHeight}, 300); 
    	}
    }
    this.debug = function(msg) { if (this.levels.debug >= this.levels[this.json.level]) {try{ createLog("debug",log,msg);}catch(e){console.log(e);} } return log; }
    this.info = function(msg) { if (this.levels.info >= this.levels[this.json.level]) {try{ createLog("info",log,msg);}catch(e){console.log(e);} } return log; }
    this.warn = function(msg) { if (this.levels.warn >= this.levels[this.json.level]) {try{ createLog("warn",log,msg);}catch(e){console.log(e);} } return log; }
    this.error = function(msg) { if (this.levels.error >= this.levels[this.json.level]) {try{ createLog("error",log,msg);}catch(e){console.log(e);} } return log; }
    this.fault = function(msg) { if (this.levels.fault >= this.levels[this.json.level]) {try{ createLog("fault",log,msg);}catch(e){console.log(e);} } return log; }
    return this;
}
