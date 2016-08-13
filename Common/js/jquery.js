var $ = function(){
    var doc = [document];
    for(var k in $.fn){
        doc[k] = $.fn[k];
    }
    if(typeof arguments[0] == "function"){
        $.fn.ready.call(doc,arguments[0]);
    }else{
        doc.selector = arguments;
        return $.fn.find.call(doc,arguments[0]);
    }
}
//程序扩展方法 
/*
  1. 入参 为单个的时候   入参必须是 json {}   该操作为 $扩展方法或属性
  2. 入参 超过两个   且都是 json  该操作为 第一个对象扩展第二个对象所有的属性或方法
  3. 第一个入参为 boolean  是否深拷贝  返回第二个参数
  其他情况都是返回当前对象   并为做任何处理
  */
$.extend = function(deep,obj){
  if(typeof deep == "object"){
    if(obj){
      for(var i=1;i<arguments.length;i++){
        for(var key in arguments[i]){
          deep[key] = arguments[i][key];
        }
      }
      return deep;
    } else {
      for(var key in deep){
        $[key]=deep[key];
      } 
    } 
  }else if(typeof deep == "boolean"&&obj){
    if(deep){
      for(var i=2;i<arguments.length;i++){
        for(var key in arguments[i]){
          if(arguments[i][key] == "[object Object]"){
            if(!obj[key])
              obj[key] = {};
            $.extend(true,obj[key],arguments[i][key]);
          }else{
            obj[key] = arguments[i][key];
          }
        }
      }
    }else{
      for(var i=2;i<arguments.length;i++){
         for(var key in arguments[i]){
           obj[key] = arguments[i][key];
         }
       }
    }
    return obj;
  }else return this;
}

$.fn = { 
  //选择器扩展方法 
   extend:function(json){
     for(var key in json){
       $.fn[key]=json[key];
     }
   },
   ready:function(func){
      if(this[0].isReady){
        arguments[0]();
      }else{
        var funcs = this[0].readyfunc;
        if(funcs==undefined){
          var funcs = [];
        }
        funcs.push(arguments[0]);
        this[0].readyfunc = funcs;
        window.onload = function(){
          var func = document.readyfunc;
          if(func) 
            for(var i=0;i<func.length;i++){
              func[i]();
            }
          document.isReady = true;
        }
      } 
   }
}

$.extend({
  each:function(ary,upfunc){
    for(var i=0;i<ary.length;i++){
      upfunc(i,ary[i]);
    }
  },
  data:function(ele,arg,args){
     if(ele=="[object HTMLDivElement]"){
        return $(ele).data(arg,args);
     }else if(typeof ele== "string"){
        if(arg){
           $.cache[ele]=arg;
        }else{
           return $.cache[ele];
        }
     }
  },
  cache:{},
  upper:function(arg){
    return arg.toUpperCase();
  }
});

$.fn.extend({
   //绑定数据
   data:function(arg,arg1){
      if(arg1){
        for(var i=0;i<this.length;i++){
          this[i][arg] = arg1;
        }
        return this;
      }else{
        if(this[0])
          return this[0][arg];
        return this;
      }
   },
   append:function(arg){
     var doc = document.createElement("div");
     doc.innerHTML = arg;
     var nodes = doc.childNodes;
     this.each(nodes,function(item){
       this.appendChild(item);
     });
     return this;
   },
   each:function(node,func){
    var type = typeof node;
    if(type=="object"){
      type = node.toString();
      for(var i=0;i<node.length;i++){
        if(func.call(this[0],node[i])==false){
          break;
        }
      }
    }else if(type=="function"){
      for(var i=0;i<this.length;i++){
        if(node.call(this[i])==false){
          break;
        }
      }
    }
    return this;
   },
   delData:function(arg){
    if(arg){
      for(var i=0;i<this.length;i++){
        delete this[i][arg];
      }
    }
    return this;
   },
  find:function(){
    var sect = [];
    var e = this[0];
    var byCls = function(ele,cls){
      return ele.getElementsByClassName(cls);
    }
    var byId = function(ele,id){
      return ele.getElementById(id);
    }
    var byTag = function(ele,tag){
      return ele.getElementsByTagName(tag);
    }
    var attr = function(ele,attr){
      return ele.getAttribute(attr);
    }
    for(var k in $.fn){
        sect[k] = $.fn[k];
    }
    sect.selector = arguments;

    for(var i=0;i<arguments.length;i++){
      if(typeof arguments[i] == "object"&&/[object HTML.*?Element]/.test(arguments[i])){
        sect.push(arguments[i]);
      }else if (typeof arguments[i] == "string") {
        var strs = arguments[i].split(" "); //$("div input")
        if(strs.length>1){
          for(var si = 0 ;si<strs.length;si++){
            var r = this.find(strs[si]);
            if(r.length>0){
               Array.prototype.push.apply(sect,r); 
            }
          }
        }else{
          strs = strs[0].split(">");     //$("div>input[id='xxx']")
          if(strs.length>1){
            var res = this;
            $.each(strs,function(i,item){
                res = res.find(item);
            });
            return res;
          }
          strs = strs[0];
          var res = [];
          if (/^#(\w+)$/.test(strs)) {    //$("#id")
            res = strs.match(/^#(\w+)$/);
            res = byId(e,res[1]);
            //this[0].getElementById(res[1]);
            if(res) sect.push(res);

          }else if(/^\.(\w+):(\d+)$/.test(strs)){ //$(".div:1")
            res = strs.match(/^\.(\w+):(\d+)$/);
            var index = parseInt(res[2]);
            res = byCls(e,res[1]);
            if(res){
              if(res.length<=index){
                index = res.length-1;
              }else if(index<0){
                index = 0;
              }
              sect.push(res[index]);
            }

          }else if(/^\.(\w+)\[(.*?)=[\',\"](.*?)[\',\"]\]$/.test(strs)){ //$(".class[attr='val']")
            res = strs.match(/^\.(\w+)\[(.*?)=[\',\"](.*?)[\',\"]\]$/);
            var att = res[2],val = res[3];
            res = byCls(e,res[1]);//this[0].getElementsByClassName(res[1]);
            $.each(res,function(i,item){
              if(attr(item,att) == val){
                sect.push(item);
              }
            });
          }else if(/^\.(\w+)\[(.*?)\]$/.test(strs)){ //$(".class[attr]")
            res = strs.match(/^\.(\w+)\[(.*?)\]$/);
            var att = res[2].split(',');
            res = byCls(e,res[1]);//this[0].getElementsByClassName(res[1]);
            
            $.each(res,function(index,item){
              var r = true; //属性存在标示
              $.each(att,function(i,att){
                if(!attr(item,att)) r = false;
              });
              if(r) sect.push(item);
            })
          }else if(/^(\w+):(\d+)$/.test(strs)){   //$("div:1")
            res = strs.match(/^(\w+):(\d+)$/);

            var index = parseInt(res[2]);
            var res = byTag(e,res[1]);//this[0].getElementsByTagName(res[1]);
            if(res){
              if(res.length<=index){
                index = res.length-1;
              }else if(index<0){
                index = 0;
              }
              sect.push(res[index]);
            }

          }else if(/^(\w+)\[(.*?)=[\',\"](.*?)[\',\"]\]$/.test(strs)){  //$("input[attr='val']")

            res = strs.match(/^(\w+)\[(.*?)=[\',\"](.*?)[\',\"]\]$/);
            var att = res[2],val = res[3];
            var res = byTag(e,res[1]);//this[0].getElementsByTagName(res[1]);

            $.each(res,function(i,item){
              if(attr(item,att)==val){
                sect.push(item);
              }
            });

          }else if(/^(\w+)\[(.*?)\]$/.test(strs)){ //$("class[attr]")
            res = strs.match(/^(\w+)\[(.*?)\]$/);
            var att = res[2].split(',');
            res = byTag(e,res[1]);
            
            $.each(res,function(index,item){
              var r = true; //属性存在标示
              $.each(att,function(i,att){
                if(!attr(item,att)) r = false;
              });
              if(r) sect.push(item);
            })
          }else if(/^\.(\w+)$/.test(strs)){  //$('.class')

            res = strs.match(/^\.(\w+)$/);
            res = byCls(e,res[1]);//this[0].getElementsByClassName(res[1]);
            if(res) Array.prototype.push.apply(sect,res);

          }else{
            res = byTag(e,strs);//this[0].getElementsByTagName(strs);
            if(res) Array.prototype.push.apply(sect,res);
          }
        }
      }
    }

    return sect;
  },
  closest:function(arg){
    var sect = [];
    for(var k in $.fn){
        sect[k] = $.fn[k];
    }
    sect.selector = arguments;
    sect[0]=this[0].parentElement;

    if($.upper(this[0].parentElement.tagName)==$.upper(arg)){
      return sect;
    }else{
      return $.fn.closest.call(sect,arg);
    }
  },
  valid:function(type){
    return type.test(this[0].value);//.match(type);
  },
  val:function(arg){
    if(arg){
      $.each(this,function(i,item){
        item.value=arg;
      });
      return this;
    }else{
      return this[0].value;
    }
  },
  html:function(arg){
      if(arg){
         $.each(this,function(i,item){
          item.innerHTML = arg;
         });
         return this;
      }else{
        if(this[0])
         return this[0].outerHTML;
       else return this;
      }
   },
   attr:function(arg,val){
      if(val){
        for(var i=0 ;i<this.length;i++){
          this[i].setAttribute(arg,val);
        }
        return this;
      }else{
        if(this[0])
          return this[0].getAttribute(arg);
        else
          return this;
      }
   },
   delAttr:function(arg){
      if(arg){
        for(var i = 0;i<this.length;i++){
          this[i].removeAttribute(arg);
        }
      }
      return this;
   },
   text:function(arg){
     if(arg){
       for(var i=0;i<this.length;i++){
        this[i].innerHTML = arg;
       }
       return this;
     }else{
      if(this[0])
        return this[0].textContent;
      else return this;
     }
   },
   on:function(event,upfunc){
    if(upfunc){
      if(typeof event == "string" && typeof upfunc=="function"){
        for(var i=0;i<this.length;i++){
          this[i]["on"+event] = upfunc;
        }
      }
    }else{
      if(typeof event == "string" ){
        for(var i=0;i<this.length;i++){
          this[i]["on"+event]();
        }
      }
    }
    return this;
   },
   off:function(event){
    if(event){
      for(var i=0;i<this.length;i++){
        this[i]["on"+event]=undefined;
        this[i].removeAttribute("on"+event);
      }
    }
    return this;
   },
   click:function(args){
     return $(this.selector).on("click",args);
   }
});
