(function(window) {
    var config={
        HIERARCHY:{
            STRICT:true
        },
        HASHKEY:"sappy"
    };
    function fixEvent(event){
        function returnTrue(){return true;}
        function returnFalse(){return false;}
        if(!event || ! event.stopPropagation){
            var old=event || window.event;
            event={};
            for(var prop in old){
                event[prop]=old[prop];
            }
            if(!event.target){
                event.target=event.srcElement || document;
            }
            event.relatedTarget=event.fromElement===event.target ?event.toElement:event.fromElement;
            event.preventDefault=function(){
                event.returnValue=false;
                event.isDefaultPrevented=returnTrue;
            };
            event.isDefaultPrevented=returnFalse;
            event.stopPropagation=function(){
                event.cancelBubble=true;
                event.isPropagationStopped=returnTrue;
            };
            event.isPropagationStopped=returnFalse;
            event.stopImmediatePropagation=function(){
                this.isImmediatePropagationStopped=returnTrue;
                this.stopPropagation();
            };
            event.isImmediatePropagationStopped=returnFalse;
            if(event.clientX!==null){
                var doc=document.documentElement,body=document.body;
                event.pageX=event.clientX +
                (doc && doc.scrollLeft ||body && body.scrollLeft||0)-
                (doc && doc.clientLeft || body && body.clientLeft||0);
                event.pageY=event.clientY +
                (doc && doc.scrollTop ||body && body.scrollTop||0)-
                (doc && doc.clientTop || body && body.clientTop||0);
                event.which=event.charCode || event.keyCode;
                if(event.button !==null){
                    event.button =(event.button && 1?0 :
                    (event.button && 4 ? 1:
                    (event.button && 2 ? 2:0)));
                }
            }
        }
         return event;
    }
    function tidyUp(elem,type){
        function isEmpty(object){
            for(var prop in object){
                return false;
            }
            return true;
        }
        var data =ev.getData(elem);
        if(data.handlers[type].length===0){
            delete data.handlers[type];
            if(document.removeEventListener){
                elem.removeEventListener(type,data.dispatcher,false);
            } else if(document.detachEvent){
                elem.removeEventListener("on" + type,data.dispatcher);
            }
        }
        if(isEmpty(data.handlers)){
            delete data.handlers;
            delete data.dispatcher;
        }
        if(isEmpty(data)){
            ev.removeData(elem);
        }
    }
    var ev=(function(){
        var cache={},
            guidCounter=1,
            nextGUID=1,
            ex="data" + (new Date()).getTime();
            this.getData=function(elem){
                var guid=elem[ex];
                if(!guid){
                    guid=elem[ex]=guidCounter++;
                    cache[guid]={};
                }
                return cache[guid];
            };
            this.removeData=function(elem){
              var guid=elem[ex];
              if(!guid) return;
              delete cache[guid];
              try{
                  delete elem[ex];
              }
              catch(e){
                  if(elem.removeAttribute){
                      elem.removeAttribute(ex);
                  }
              }
            };
            this.addEvent=function(elem,type,func){
                var data=this.getData(elem);
                if(!data.handlers)data.handlers={};
                if(!data.handlers[type])data.handlers[type]=[];
                if(!func.guid) func.guid=nextGUID++;
                data.handlers[type].push(func);
                if(!data.dispatcher){
                    data.disabled=false;
                    data.dispatcher=function(event){
                        if(data.disabled) return;
                        event=fixEvent(event);
                        var handlers=data.handlers[event.type];
                        if(handlers){
                            for(var i=0;i<handlers.length;i++){
                                handlers[i].call(elem,event);
                            }
                        }
                    }
                }
                if(data.handlers[type].length===1){
                    if(document.addEventListener){
                        elem.addEventListener(type,data.dispatcher,false);
                    } else if(document.attachEvent){
                        elem.attachEvent("on" + type,data.dispatcher);
                    }
                }
            };
            this.removeEvent=function(elem,type,fn){
                var data=this.getData(elem);
                if(!data.handlers)return;
                var removeType=function(t){
                    data.handlers[t]=[];
                    tidyUp(elem,t);
                };
                if(!type){
                    for(var t in data.handlers) removeType(t);
                    return;
                }var handlers=data.handlers[type];
                if(!handlers)return;
                if(!fn){
                    removeType(type);
                    return;
                }
                if(fn.guid){
                    for(var i=0;i<handlers.length;i++){
                        if(handlers[i].guid=== fn.guid){
                            handlers.splice(i--,1);
                        }
                    }
                } else {
                    var func=fn.toString();
                    for(var i=0;i<handlers.length;i++){
                        if(handlers[i].toString()=== func){
                            handlers.splice(i--,1);
                        }
                    }
                    
                }
                tidyUp(elem,type);
            };
            this.trigger=function(elem,event){
                var data=this.getData(elem),parent=elem.parentNode || elem.ownerDocument;
                if(typeof event ==="string"){
                    event={type:event,target:elem};
                }
                event=fixEvent(event);
                if(data.dispatcher){
                    data.dispatcher.call(elem,event);
                }
                if(parent &&!event.isPropagationStopped()){
                    this.trigger(parent,event);
                } else if(!parent && !event.isDefaultPrevented()){
                    var targetData=this.getData(event.target);
                    if(event.target[event.type]){
                        targetData.disabled=true;
                        event.target[event.type]();
                        targetData.disabled=false;
                    }
                }
            };
            return this;
    })();
    window.eval = null;
    var expando = function() {
        return (new Date()).getTime();
    },
    attr = function(elem, attr, val) {
        if (!elem || !attr) throw "Error";
        if(val){
            if(elem[attr]){
                elem[attr]=val;
            } else {
                elem.setAttribute(attr,val);
            }
        } else {
            if(elem[attr]){
                return elem[attr];
            } else {
                return elem.getAttribute(attr);
            }
        }
    },
    style = function(elem, key, val) {
        if (!key || !val) throw "Error";
        return val ? (elem[key] ? elem.style[key] = val : elem.style.setAttribute(key, val)) : elem.style[key] || elem.style.getAttribute(key);
    },
    extend = function(obj, obja) {
        for (var prop in obja) {
            obj[prop] = obja[prop];
        }
        return obj;
    },
    cfg=function(str,val){
        if(typeof str !=="string") {throw "";}
        if(val!==null && val!=="undefined"){
            config[str.toUpperCase()]=val;
        } else {
            return config[str.toUpperCase()];
        }
    },
    create=function(str,context){
        context=context||document;
        return context.createElement(str);
    },
    inArray=function(a,obj){
      var i = a.length;
      while (i--) {
        if (a[i] == obj) {
          return true;
        }
      }
  return false;
    },
    all = {
        isElement: function(func) {
            ///<signature>
            ///<summary> Determines if the SappyObject is of namespace "Element"</summary>
            ///<returns type="Boolean">Whether the SappyObject is of namespace Element</returns>
            ///</signature>
            ///<signature>
            ///<summary> Determines if the SappyObject is of namespace "Element" and executes a function if true</summary>
            ///<param type="Function" name="func" optional="false">The function to execute if true. It is passed a parameter containing the SappyObject</param>
            ///<returns type="Any">Returns the function's results</returns>
            ///</signature>
            if (this.NS === "Element") {
                if (func && typeof func === "function") {
                    return func(this);
                }
                else if(typeof func==="string"){
                    return eval.call(window, func,this);
                }
                return !! (this.NS === "Element");
            }
            else {
                return false;
            }
        },
        is: function(str, func) {
            ///<signature>
            ///<summary>Test the component type against a string</summary>
            ///<param type="String" name="component" optional="false">The component name to test against</param>
            ///<returns type="Boolean">Whether the SappyObject is a matching component</returns>
            ///</signature>
            ///<signature>
            ///<summary>Test the component type against a string and executes a function if true</summary>
            ///<param type="String" name="component" optional="false">The component name to test against</param>
            ///<param type="Function" name="func" optional="false">The function to execute if true. It is passed a parameter containing the SappyObject</param>
            ///<returns type="Any">Returns the function's results</returns>
            ///</signature>
            if (this.component === str) {
                if (func && typeof func === "function") {
                    func(this);
                }
                else if(typeof func==="string"){
                    eval.call(window, func,this);
                }
                return !!(this.component === str);
            }
            else {
                return false;
            }
        },
        addClass: function(klass) {
            ///<signature>
            ///<summary>Add a class to the SappyObject's element</summary>
            ///<param type="String" name="class" optional="false">The classname to add to the element</param>
            ///<returns type="SappyObject">Returns the SappyObject</returns>
            ///</signature>
            ///<signature>
            ///<summary>Add an array of classes to the SappyObject's element</summary>
            ///<param type="Array" name="classes" optional="false">The classnames to add to the element</param>
            ///<returns type="SappyObject">Returns the SappyObject</returns>
            ///</signature>
            var a = this.element;
            if (klass) {
                if (typeof klass === "string") {
                    klass = klass.split(' ');
                }
                for (var i = 0; i < klass.length; i++) {
                    a.className += " " + klass[i];
                }
                return this;
            }
        },
        removeClass: function(klass) {
            ///<signature>
            ///<summary>Remove a class from the SappyObject's element</summary>
            ///<param type="String" name="class" optional="false">The classname to remove from the element</param>
            ///<returns type="SappyObject">Returns the SappyObject</returns>
            ///</signature>
            ///<signature>
            ///<summary>Remove an array of classes from the SappyObject's element</summary>
            ///<param type="Array" name="classes" optional="false">The classnames to remove from the element</param>
            ///<returns type="SappyObject">Returns the SappyObject</returns>
            ///</signature>
            var a = this.element,
                oldCN = a.className.split(' '),
                o;
            if (klass) {
                if (typeof klass === "string") {
                    klass = klass.split(' ');
                }
                for (var i = 0; i < klass.length; i++) {
                    var clazz = klass[i];
                    while ((o = oldCN.indexOf(clazz)) > -1) {
                        oldCN = oldCN.slice(0, o).concat(oldCN.slice(++o));
                    }
                }
                a.className = oldCN.join(' ');
                return this;
            }
        },
        clone: function(clones) {
            ///<signature>
            ///<summary>Clone the SappyObject and return it</summary>
            ///<returns type="SappyObject">Returns the cloned SappyObject</returns>
            ///</signature>
            ///<signature>
            ///<summary>Clone the SappyObject a specified number of times and return them</summary>
            ///<param type="Number" name="clones" optional="false">The number of clones to create and return</param>
            ///<returns type="Array">An array of SappyObjects</returns>
            ///</signature>
            if (clones && !isNaN(parseInt(clones))) {
                var arr = [];
                for (var i = 0; i < clones; i++) {
                    var a=extend({},this);
                    arr.push(a);
                }
                return arr;
            }
            else {
                return extend({},this);
            }
        },
        toggleClass: function(klass) {
            ///<signature>
            ///<summary>Add or remove a class from the SappyObject's element depending if the classname is already present</summary>
            ///<param type="String" name="class" optional="false">The classname to toggle on the element</param>
            ///<returns type="SappyObject">Returns the SappyObject</returns>
            ///</signature>
            ///<signature>
            ///<summary>Add or remove an array of classes from the SappyObject's element depending if the classname is already present</summary>
            ///<param type="Array" name="classes" optional="false">The classnames to toggle on the element</param>
            ///<returns type="SappyObject">Returns the SappyObject</returns>
            ///</signature>
            var a=this.element;
            if (typeof klass === "string") {
                klass = klass.split(' ');
            }
            for(var i=0;i<klass.length;i++){
                if(a.className.indexOf(klass[i])){
                    this.removeClass(klass[i]);
                } else {
                    this.addClass(klass[i]);
                }
            }
            return this;
        },
        attr:function(key,value){
          ///<signature>
          ///<summary>Set attributes on a SappyObject's element</summary>
          ///<param type="Object" name="object" optional="false">The object containing, key/ value pairs to set as attributes</param>
          ///<returns type="SappyObject">The SappyObject</returns>
          ///</signature>
           ///<signature>
          ///<summary>Set attributes on a SappyObject's element</summary>
          ///<param type="Array" name="array" optional="false">An Array of objects containing, key/ value pairs to set as attributes</param>
          ///<returns type="SappyObject">The SappyObject</returns>
          ///</signature>
          ///<signature>
          ///<summary>Set attributes on a SappyObject's element</summary>
          ///<param type="String" name="key" optional="false">The attribute to set</param>
          ///<param type="Any" name="value" optional="true">The value to set the key to</param>
          ///<returns type="SappyObject">The SappyObject</returns>
          ///</signature>
          ///<signature>
          ///<summary>Get an attribute's value from a SappyObject's element</summary>
          ///<param type="String" name="key" optional="false">The attribute to get the value of</param>
          ///<returns type="String">The String value of the attribute</returns>
          ///</signature>
          var a=this.element;
          if(typeof key === "object"){
              for(var k in key){
                  attr(a,k,key[k]);
              }
          } else if( typeof key==="string"){
              if(value){
                  value=value.toString();
                  attr(a,key,value);
              } else {
                  return attr(a,key);
              }
          }
          return this;
        },
        css: function(key,value) {
            
        },
        id: function(str) {
            ///<signature>
            ///<summary>Get the id attribute of the SappyObject's element</summary>
            ///<returns type="String">The string id attribute of the element</returns>
            ///</signature>
            ///<signature>
            ///<summary>Set the id attribute of the SappyObject's element</summary>
            ///<param type="String" name="id" optional="false">The value to set the attribute to</param>
            ///<returns type="SappyObject"> The SappyObject</returns>
            ///</signature>
            if(str){
                return this.attr('id',str);
            } else {
                return this.attr('id');
            }
        },
        title: function(str) {
            ///<signature>
            ///<summary>Get the title attribute of the SappyObject's element</summary>
            ///<returns type="String">The string title attribute of the element</returns>
            ///</signature>
            ///<signature>
            ///<summary>Set the title attribute of the SappyObject's element</summary>
            ///<param type="String" name="id" optional="false">The value to set the attribute to</param>
            ///<returns type="SappyObject"> The SappyObject</returns>
            ///</signature>
            if(str){
                return this.attr('title',str);
            } else {
                return this.attr('title');
            }
        },
        data: function(key,value) {
            if(!key){ throw "Error";}
            if(value){
                return this.attr('data-' + key,value);
            } else {
                return this.attr('data-' + key);
            }
        },
        size: function(h,w) {
            var hr,wr;
            h && !isNaN(parseFloat(h))?this.height(h):hr=this.height();
            w && !isNaN(parseFloat(w))?this.width(w):wr=this.width();
            if(wr && hr){
                return {h:hr,w:wr};
            } else {
                return this;
            }
        },
        position: function(t,l) {
            var tr,lr;
            this.element.style.position="relative";
            t && !isNaN(parseFloat(t))?this.top(t):tr=this.top();
            l && !isNaN(parseFloat(l))?this.left(l):lr=this.left();
            if(tr && lr){
                return {t:tr,l:lr};
            } else {
                return this;
            }
        },
        height: function(h) {
            var a=this.element;
            if(h){
                a.style.height=parseFloat(h) + "px";
            } else {
                return a.offsetHeight;
            }
            return this;
        },
        width: function(w) {
            var a=this.element;
            if(w){
                a.style.width=parseFloat(w) + "px";
            } else {
                return a.offsetWidth;
            }
            return this;

        },
        top: function(t) {
            var a=this.element;
            if(t){
                a.style.top=parseFloat(t) + "px";
            } else {
                return a.offsetTop;
            }
            return this;
        },
        left: function(l) {
            var a=this.element;
            if(l){
                a.style.left=parseFloat(l) + "px";
            } else {
                return a.offsetLeft;
            }
            return this;
        },
        bind: function(handler,func) {
            ev.addEvent(this.element,handler,func);
        },
        unbind: function(handler,func) {
            ev.removeEvent(this.element,handler,func);
        },
        trigger: function(handler) {
            ev.trigger(this.element,handler);
        },
        hide: function() {
            this.trigger('hiding');
            this.data('old-display',this.element.style.display);
            this.element.style.display='none';
            this.data('hidden','hidden');
            this.trigger('hidden');
        },
        show: function() {
            this.trigger('unhiding');
            this.element.style.display=this.data('old-display') || '';
            this.data('hidden','visible');
            this.trigger('visible');
        },
        toggle: function() {
            if(this.data('hidden')==='hidden'){
                this.show();
            } else {
                this.hide();
            }
        }
    };

    function App() {
        if(this.constructor===arguments.callee && ! this._sapped){
            Object.defineProperty(this, "sapped", {
                get: function() {
                    return true;
                }
            });
        } else {
            return new App();
        }
        Object.defineProperty(this, "NS", {
            get: function() {
                return "Element";
            }
        });
        Object.defineProperty(this, "component", {
            get: function() {
                return "App";
            }
        });
        //  
        var disallowedComponents="ControlGroup Dialog Input Textarea Select CheckSelect Label".split(' '),children=[];
        extend(this, all);
        extend(this, {
            "run":function(){
                document.body.appendChild(this.element);
            },
            add:function(mod){
                if( mod && mod.isElement && mod.isElement()){
                    console.log(cfg("hierarchy.strict"));
                    if(inArray(disallowedComponents,mod.component)){
                        throw "SappyHierarchyException: " + mod.component + " is not allowed as a child of the " + this.component + " context";
                    } else {
                        var a=mod.element;
                        children.push(mod.SID);
                        this.element.appendChild(a);
                    }
                }
                return this;
            },
            pick:function(mod){
                if(inArray(children,mod.SID)){
                    this.element.removeChild(mod.element);
                    children.slice(mod.SID);
                }
                return this;
            },
            createPanel: Panel,
            createCaptionPanel: CaptionPanel,
            createStackPanel: StackPanel,
            createForm: Form,
            createLabel: Label,
            createButton: Button,
            createSelect: Select,
            createLink: Link,
            createGrid: Grid,
            createFluidGrid: FluidGrid,
            createInput: Input,
            createTextarea: Textarea,
            createControlGroup: ControlGroup,
            createBulletList: BulletList,
            createNumberList: NumberList,
            createList: List,
            createDropMenu: DropMenu,
            createAccordion: Accordion,
            createButtonGroup: ButtonGroup,
            createNavBar: NavBar,
            createDialog: Dialog,
            createCheckSelect: CheckSelect,
            createNavPage: NavPage,
            createAjaxRequest: AjaxEngine,
            createEvent:EventManager,
            createClientEvent: ClientHandler,
            createFooter: Footer
        });
        this.element=create('div');
        this.data("app-id",expando());
        return this;
    }

    function Panel() {
        if(this.constructor===arguments.callee && ! this._sapped){
            Object.defineProperty(this, "sapped", {
                get: function() {
                    return true;
                }
            });
        } else {
            return new Panel();
        }
        var ex=new expando();
        Object.defineProperty(this,"SID",{get:function(){return ex; }});
        Object.defineProperty(this, "NS", {
            get: function() {
                return "Element";
            }
        });
        Object.defineProperty(this, "component", {
            get: function() {
                return "Panel";
            }
        });
        this.element=create('div');
        var children=[],disallowedContent="".toLowerCase().split(' ');
        extend(this,all);
        return this;
    }

    function CaptionPanel() {
        if(this.constructor===arguments.callee && ! this._sapped){
            Object.defineProperty(this, "sapped", {
                get: function() {
                    return true;
                }
            });
        } else {
            return new CaptionPanel();
        }
        Object.defineProperty(this, "NS", {
            get: function() {
                return "Element";
            }
        });
        Object.defineProperty(this, "component", {
            get: function() {
                return "CaptionPanel";
            }
        });
        this.element=create('div');
        var children=[],disallowedContent="".toLowerCase().split(' ');
        extend(this,all);
        return this;
    }

    function StackPanel() {
        if(this.constructor===arguments.callee && ! this._sapped){
            Object.defineProperty(this, "sapped", {
                get: function() {
                    return true;
                }
            });
        } else {
            return new StackPanel();
        }
        Object.defineProperty(this, "NS", {
            get: function() {
                return "Element";
            }
        });
        Object.defineProperty(this, "component", {
            get: function() {
                return "StackPanel";
            }
        });
        this.element=create('div');
        var children=[],disallowedContent="".toLowerCase().split(' ');
        extend(this,all);
        return this;
    }

    function Form() {
        if(this.constructor===arguments.callee && ! this._sapped){
            Object.defineProperty(this, "sapped", {
                get: function() {
                    return true;
                }
            });
        } else {
            return new Form();
        }
        Object.defineProperty(this, "NS", {
            get: function() {
                return "Element";
            }
        });
        Object.defineProperty(this, "component", {
            get: function() {
                return "Form";
            }
        });
        this.element=create('form');
        var children=[],disallowedContent="".toLowerCase().split(' ');
        extend(this,all);
        extend(this,{
            add:function(mod){
                if( mod && mod.isElement && mod.isElement()){
                    var a=mod.element;
                    children.push(mod.SID);
                    this.element.appendChild(a);
                }
                return this;
            },
            pick:function(mod){
                if(inArray(children,mod.SID)){
                    this.element.removeChild(mod.element);
                    children.slice(mod.SID);
                }
                return this;
            }
        });
        return this;
    }

    function Label() {
        if(this.constructor===arguments.callee && ! this._sapped){
            Object.defineProperty(this, "sapped", {
                get: function() {
                    return true;
                }
            });
        } else {
            return new Label();
        }
        Object.defineProperty(this, "NS", {
            get: function() {
                return "Element";
            }
        });
        Object.defineProperty(this, "component", {
            get: function() {
                return "Label";
            }
        });
        this.element=create('label');
        extend(this,all);
        var forElems="Input Textarea Select CheckSelect".toLowerCase().split(' ')
        extend(this,{
            "for":function(module){
                if(inArray(forElems,module.component.toLowerCase())){
                    if(!module.id()){
                        var bind=expando();
                        module.id(bind);
                        this.element.htmlFor=bind;
                    } else {
                        this.element.htmlFor=module.id();
                    }
                }
                return this;
            },
            display:function(str){
               var a=this.element;
               if(str){
                  a.innerHTML=str;
               } else {
                   return a.innerHTML;
               }
               return this;
           }
        });
        return this;
    }

    function Button() {
        if(this.constructor===arguments.callee && ! this._sapped){
            Object.defineProperty(this, "sapped", {
                get: function() {
                    return true;
                }
            });
        } else {
            return new Button();
        }
        Object.defineProperty(this, "NS", {
            get: function() {
                return "Element";
            }
        });
        Object.defineProperty(this, "component", {
            get: function() {
                return "Button";
            }
        });
        extend(this,all);
        return this;
    }

    function Select() {
        if(this.constructor===arguments.callee && ! this._sapped){
            Object.defineProperty(this, "sapped", {
                get: function() {
                    return true;
                }
            });
        } else {
            return new Select();
        }
        Object.defineProperty(this, "NS", {
            get: function() {
                return "Element";
            }
        });
        Object.defineProperty(this, "component", {
            get: function() {
                return "Select";
            }
        });
        this.element=create('select');
        var children=[];
        extend(this,all);
        extend(this,{
           addOption:function(text,val) {
               var opt=create('option');
               if(!text){throw "";}
               if(!val){
                   opt.value=text;
                   opt.innerHTML=text;
               } else {
                   opt.value=val;
                   opt.innerHTML=text;
               }
               children.push(opt);
               this.appendChild(opt);
               return this;
           }
        });
        return this;
    }

    function Link() {
        if(this.constructor===arguments.callee && ! this._sapped){
            Object.defineProperty(this, "sapped", {
                get: function() {
                    return true;
                }
            });
        } else {
            return new Link();
        }
        Object.defineProperty(this, "NS", {
            get: function() {
                return "Element";
            }
        });
        Object.defineProperty(this, "component", {
            get: function() {
                return "Link";
            }
        });
        this.element=create('a');
        extend(this,all);
        extend(this,{
           display:function(str){
               var a=this.element;
               if(str){
                  a.innerHTML=str;
               } else {
                   return a.innerHTML;
               }
               return this;
           },
           href:function(str){
               var a=this.element;
               if(str){
                   a.href=str;
               } else {
                   return a.href;
               }
               return this;
           },
           target:function(str){
               var a=this.element;
               if(str){
                   a.target=str;
               } else {
                   return a.target;
               }
               return this;
           }
        });
        return this;
    }

    function Grid() {
        if(this.constructor===arguments.callee && ! this._sapped){
            Object.defineProperty(this, "sapped", {
                get: function() {
                    return true;
                }
            });
        } else {
            return new Grid();
        }
        Object.defineProperty(this, "NS", {
            get: function() {
                return "Element";
            }
        });
        Object.defineProperty(this, "component", {
            get: function() {
                return "Grid";
            }
        });
        extend(this,all);
        var children=[];
        extend(this,{
           createSpan:function(len) {
               
           }
        });
        return this;
    }

    function Input() {
        if(this.constructor===arguments.callee && ! this._sapped){
            Object.defineProperty(this, "sapped", {
                get: function() {
                    return true;
                }
            });
        } else {
            return new Input();
        }
        Object.defineProperty(this, "NS", {
            get: function() {
                return "Element";
            }
        });
        Object.defineProperty(this, "component", {
            get: function() {
                return "Input";
            }
        });
        this.element=create('input');
        extend(this,all);
        extend(this,{
            type:function(str) {
                var a=this.element;
                if(str){
                    a.type=str;
                } else {
                    return a.type;
                }
                return this;
            },
            val:function(str){
                var a=this.element;
                if(str){
                    a.value=str;
                } else {
                    return a.value;
                }
                return this;
            }
        });
        return this;
    }

    function Textarea() {
        if(this.constructor===arguments.callee && ! this._sapped){
            Object.defineProperty(this, "sapped", {
                get: function() {
                    return true;
                }
            });
        } else {
            return new Textarea();
        }
        var ex=new expando();
        Object.defineProperty(this,"SID",{get:function(){return ex; }});
        Object.defineProperty(this, "NS", {
            get: function() {
                return "Element";
            }
        });
        Object.defineProperty(this, "component", {
            get: function() {
                return "Textarea";
            }
        });
        extend(this,all);
        extend(this,{
           val:function(str){
               var a=this.element;
               if(str){
                   a.innerHTML=str;
               } else {
                   return a.innerHTML;
               }
               return this;
           } 
        });
        this.element=create('textarea');
        return this;
    }

    function FluidGrid() {
        if(this.constructor===arguments.callee && ! this._sapped){
            Object.defineProperty(this, "sapped", {
                get: function() {
                    return true;
                }
            });
        } else {
            return new FluidGrid();
        }
        Object.defineProperty(this, "NS", {
            get: function() {
                return "Element";
            }
        });
        Object.defineProperty(this, "component", {
            get: function() {
                return "FluidGrid";
            }
        });
        var children=[];
        extend(this,all);
        return this;
    }

    function ControlGroup() {
        if(this.constructor===arguments.callee && ! this._sapped){
            Object.defineProperty(this, "sapped", {
                get: function() {
                    return true;
                }
            });
        } else {
            return new ControlGroup();
        }
        Object.defineProperty(this, "NS", {
            get: function() {
                return "Element";
            }
        });
        Object.defineProperty(this, "component", {
            get: function() {
                return "ControlGroup";
            }
        });
        var children=[];
        extend(this,all);
        return this;
    }

    function BulletList() {
        if(this.constructor===arguments.callee && ! this._sapped){
            Object.defineProperty(this, "sapped", {
                get: function() {
                    return true;
                }
            });
        } else {
            return new BulletList();
        }
        Object.defineProperty(this, "NS", {
            get: function() {
                return "Element";
            }
        });
        Object.defineProperty(this, "component", {
            get: function() {
                return "BulletList";
            }
        });
        var children=[];
        extend(this,all);
        return this;
    }

    function NumberList() {
        if(this.constructor===arguments.callee && ! this._sapped){
            Object.defineProperty(this, "sapped", {
                get: function() {
                    return true;
                }
            });
        } else {
            return new NumberList();
        }
        Object.defineProperty(this, "NS", {
            get: function() {
                return "Element";
            }
        });
        Object.defineProperty(this, "component", {
            get: function() {
                return "NumberList";
            }
        });
        var children=[];
        extend(this,all);
        return this;
    }

    function List() {
        if(this.constructor===arguments.callee && ! this._sapped){
            Object.defineProperty(this, "sapped", {
                get: function() {
                    return true;
                }
            });
        } else {
            return new List();
        }
        Object.defineProperty(this, "NS", {
            get: function() {
                return "Element";
            }
        });
        Object.defineProperty(this, "component", {
            get: function() {
                return "List";
            }
        });
        var children=[];
        extend(this,all);
        return this;
    }

    function DropMenu() {
        if(this.constructor===arguments.callee && ! this._sapped){
            Object.defineProperty(this, "sapped", {
                get: function() {
                    return true;
                }
            });
        } else {
            return new DropMenu();
        }
        Object.defineProperty(this, "NS", {
            get: function() {
                return "Element";
            }
        });
        Object.defineProperty(this, "component", {
            get: function() {
                return "DropMenu";
            }
        });
        return this;
    }

    function Accordion() {
        if(this.constructor===arguments.callee && ! this._sapped){
            Object.defineProperty(this, "sapped", {
                get: function() {
                    return true;
                }
            });
        } else {
            return new Accordion();
        }
        Object.defineProperty(this, "NS", {
            get: function() {
                return "Element";
            }
        });
        Object.defineProperty(this, "component", {
            get: function() {
                return "Accordion";
            }
        });
        return this;
    }
    function EventManager(){
        if(this.constructor===arguments.callee && ! this._sapped){
            Object.defineProperty(this, "sapped", {
                get: function() {
                    return true;
                }
            });
        } else {
            return new EventManager();
        }
        Object.defineProperty(this, "NS", {
            get: function() {
                return "Engine";
            }
        });
        Object.defineProperty(this, "component", {
            get: function() {
                return "EventManager";
            }
        });
        return this;
    }
    function ButtonGroup() {
        if(this.constructor===arguments.callee && ! this._sapped){
            Object.defineProperty(this, "sapped", {
                get: function() {
                    return true;
                }
            });
        } else {
            return new ButtonGroup();
        }
        Object.defineProperty(this, "NS", {
            get: function() {
                return "Element";
            }
        });
        Object.defineProperty(this, "component", {
            get: function() {
                return "ButtonGroup";
            }
        });
        return this;
    }

    function NavBar() {
        if(this.constructor===arguments.callee && ! this._sapped){
            Object.defineProperty(this, "sapped", {
                get: function() {
                    return true;
                }
            });
        } else {
            return new NavBar();
        }
        Object.defineProperty(this, "NS", {
            get: function() {
                return "Element";
            }
        });
        Object.defineProperty(this, "component", {
            get: function() {
                return "NavBar";
            }
        });
        return this;
    }

    function Dialog() {
        if(this.constructor===arguments.callee && ! this._sapped){
            Object.defineProperty(this, "sapped", {
                get: function() {
                    return true;
                }
            });
        } else {
            return new Dialog();
        }
        Object.defineProperty(this, "NS", {
            get: function() {
                return "Window";
            }
        });
        Object.defineProperty(this, "component", {
            get: function() {
                return "Dialog";
            }
        });
        return this;
    }

    function CheckSelect() {
        if(this.constructor===arguments.callee && ! this._sapped){
            Object.defineProperty(this, "sapped", {
                get: function() {
                    return true;
                }
            });
        } else {
            return new CheckSelect();
        }
        Object.defineProperty(this, "NS", {
            get: function() {
                return "Element";
            }
        });
        Object.defineProperty(this, "component", {
            get: function() {
                return "CheckSelect";
            }
        });
        return this;
    }

    function NavPage() {
        if(this.constructor===arguments.callee && ! this._sapped){
            Object.defineProperty(this, "sapped", {
                get: function() {
                    return true;
                }
            });
        } else {
            return new NavPage();
        }
        Object.defineProperty(this, "NS", {
            get: function() {
                return "Window";
            }
        });
        Object.defineProperty(this, "component", {
            get: function() {
                return "NavPage";
            }
        });
        return this;
    }

    function AjaxEngine() {
        if(this.constructor===arguments.callee && ! this._sapped){
            Object.defineProperty(this, "sapped", {
                get: function() {
                    return true;
                }
            });
        } else {
            return new AjaxEngine();
        }
        Object.defineProperty(this, "NS", {
            get: function() {
                return "Engine";
            }
        });
        Object.defineProperty(this, "component", {
            get: function() {
                return "AjaxEngine";
            }
        });
        return this;
    }

    function ClientHandler() {
        if(this.constructor===arguments.callee && ! this._sapped){
            Object.defineProperty(this, "sapped", {
                get: function() {
                    return true;
                }
            });
        } else {
            return new ClientHandler();
        }
        Object.defineProperty(this, "NS", {
            get: function() {
                return "Engine";
            }
        });
        Object.defineProperty(this, "component", {
            get: function() {
                return "ClientHandler";
            }
        });
        return this;
    }

    function EffectsEngine() {
        if(this.constructor===arguments.callee && ! this._sapped){
            Object.defineProperty(this, "sapped", {
                get: function() {
                    return true;
                }
            });
        } else {
            return new EffectsEngine();
        }
        Object.defineProperty(this, "NS", {
            get: function() {
                return "Engine";
            }
        });
        Object.defineProperty(this, "component", {
            get: function() {
                return "EffectsEngine";
            }
        });
        return this;
    }

    function AnimationEngine() {
        if(this.constructor===arguments.callee && ! this._sapped){
            Object.defineProperty(this, "sapped", {
                get: function() {
                    return true;
                }
            });
        } else {
            return new AnimationEngine();
        }
        Object.defineProperty(this, "NS", {
            get: function() {
                return "Engine";
            }
        });
        Object.defineProperty(this, "component", {
            get: function() {
                return "AnimationEngine";
            }
        });
        return this;
    }

    function Polyfill() {
        if(this.constructor===arguments.callee && ! this._sapped){
            Object.defineProperty(this, "sapped", {
                get: function() {
                    return true;
                }
            });
        } else {
            return new Polyfill();
        }
        Object.defineProperty(this, "NS", {
            get: function() {
                return "Engine";
            }
        });
        Object.defineProperty(this, "component", {
            get: function() {
                return "Polyfill";
            }
        });
        return this;
    }

    function Footer() {
        if(this.constructor===arguments.callee && ! this._sapped){
            Object.defineProperty(this, "sapped", {
                get: function() {
                    return true;
                }
            });
        } else {
            return new Footer();
        }
        Object.defineProperty(this, "NS", {
            get: function() {
                return "Element";
            }
        });
        Object.defineProperty(this, "component", {
            get: function() {
                return "Footer";
            }
        });
        return this;
    }
    var $ = {
        App: App
    }
    window.AppEngine = $;
})(window);