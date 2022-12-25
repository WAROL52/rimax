var Rimax = (function (exports) {
    'use strict';

    const guardFn = v => v;
    const stateSymbol = Symbol("$$State");
    const isState = ((ref) => (typeof ref == "object") && stateSymbol === ref[".rxType"]).bind();
    class RXState {
        get isArray() { return Array.isArray(this.value) }
        toString() { return String(this.value) }
        valueOf() { return this.value }
        get [".rxType"]() { return stateSymbol }
        static isState = isState
    }
    function createState(value, guard) {
        let currentValueOfState;
        let oldValueOfState;
        let isDestroyed = false;
        let subscriber=0;
        const ID = Math.random();
        const GUARDS = [];
        const DESTROY_EVENTS = new Set();
        const UPDATE_EVENTS = new Set();
        const ACTIONS={};
        const dispatchUpdate = (option) => { UPDATE_EVENTS.forEach(fn =>fn(currentValueOfState, oldValueOfState, option)); };
        
        return Object.freeze(new (class rxState extends RXState {
            get guards() { return [...GUARDS] }
            get isDestroyed() { return isDestroyed }
            get id() { return ID }
            get len() { return {onChange:UPDATE_EVENTS.size,onCleanup:DESTROY_EVENTS.size,subscriber} }
            addGuard(guard) {
                if (!(guard instanceof Function)) return () => undefined
                const callback = (...a) => guard(...a);
                const lastIndex = GUARDS.push(callback) - 1;
                let isRemoved = false;
                return () => {
                    if (isRemoved) return true
                    if (GUARDS[lastIndex] === callback) {
                        GUARDS.splice(lastIndex, 1);
                        isRemoved = true;
                        return true
                    }
                    const i = GUARDS.find(fn => fn === callback);
                    if (i > -1) {
                        GUARDS.splice(i, 1);
                        return true
                    }
                    return false
                }
            }

            clear(withDom = false) {
                DESTROY_EVENTS.forEach(fn => fn(withDom));
                DESTROY_EVENTS.clear();
                UPDATE_EVENTS.clear();
            }
            destroy(withDom = true) {
                if (isDestroyed) return;
                this.clear(withDom);
                isDestroyed = true;
            }

            onChange = ((callbackOrState, directApply = false) => {
                if (callbackOrState instanceof RXState) {
                    const callback = directApply instanceof Function ? directApply : v => v;
                    const state=callbackOrState;
                    subscriber++;
                    let isRemoved;
                    return this.onChange((...args) =>{
                        state.set(() => callback(...args), ...args.slice(1));
                        return ()=>{
                            if(isRemoved) return
                            isRemoved=true;
                            subscriber--;
                        }
                    }, true)
                }
                if (!(callbackOrState instanceof Function)) throw new Error("callback doit être une fonction")
                const on = {
                    dispatch: callbackOrState, destroy: directApply ? callbackOrState(this.value, undefined, { methode: "set", value: this.value }) : undefined
                };
                const onDispatch = (...arg) => on.destroy = on.dispatch(...arg);
                let isCalled = false;
                const destroy = (...arg) => {
                    if (isCalled) return
                    isCalled = true;
                    if (on.destroy instanceof Function) on.destroy(...arg);
                    DESTROY_EVENTS.delete(destroy);
                    UPDATE_EVENTS.delete(onDispatch);
                };
                UPDATE_EVENTS.add(onDispatch);
                DESTROY_EVENTS.add(destroy);
                return destroy
            }).bind()
            onCleanup = ((callback) => {
                if (!(callback instanceof Function)) throw new Error("callback doit être une fonction")
                const fn=(...args)=>callback(...args);
                DESTROY_EVENTS.add(fn);
                return () => DESTROY_EVENTS.delete(callback)
            }).bind()


            get oldValue() { return oldValueOfState }

            constructor(value, guard = v => v) {
                super();
                Object.defineProperty(this, "value", {
                    get: (() => currentValueOfState).bind(),
                    set: ((value) => this.set(value)).bind(),
                    enumerable: true,
                });
                if(guard&& typeof guard =="object"){
                    Object.assign(ACTIONS,guard.actions??{});
                    guard=guard.guard??(v => v);
                }
                if (!(guard instanceof Function)) throw new Error("guard doit être une fonction")
                currentValueOfState = value;
                GUARDS.push(guard);
                const toValidate = (value, oldValue = oldValueOfState, option = {}) => {
                    const oldValues = [];
                    return GUARDS.reduceRight((val, guardFn) => {
                        oldValues.push(val);
                        return guardFn(val, oldValue, option, [...oldValues])
                    }, value)
                };
                if (!(value instanceof Promise)) {
                    currentValueOfState = toValidate(value, undefined, {});
                }
                const createStateComputed = (callback = () => currentValueOfState, dependencies = [], guard = v => v) => {
                    if (!(callback instanceof Function)) throw new Error("callback doit être une function")
                    if (isDestroyed) throw new Error("cette Etat ne peut plus etre utiliser car elle est deja detruit")
                    const optDependencies=(dependencies&&!Array.isArray(dependencies)&&typeof dependencies=="object")?dependencies:{};
                    dependencies=Array.isArray(dependencies)?dependencies:optDependencies.dependencies??[];
                    if (!Array.isArray(dependencies)) throw new Error("dependencies doit être une Array")
                    const update = (option = {}) => callback(currentValueOfState, oldValueOfState, option);
                    const optionState={guard,...optDependencies};
                    const [state, setState] = useState(update(), optionState);
                    if(optionState.guard!==guard)state.addGuard(guard);
                    const states = [this, ...dependencies];
                    const listrmv = states.map(st => {
                        if (st instanceof RXState) {
                            return st.onChange((_1, _2, option) => {
                                setState(update(option), option);
                                return () => !state.isDestroyed && state.destroy(true)
                            })
                        }
                    });
                    state.onCleanup(() => listrmv.map(fn => fn instanceof Function && fn()));
                    return state
                };
                this.get = ((callback = () => this.value, dependencies = []) => createStateComputed(callback, dependencies)).bind();
                Object.entries(stateType).map(([type, fnGuard]) => this.get[type] = (callback = () => this.value, dependencies = []) => createStateComputed(callback, dependencies, fnGuard));
                this.set = ((value, option = { methode: "set", value: value }) => {
                    if (isDestroyed) throw new Error("cette Etat ne peut plus etre utiliser car elle est deja detruit")
                    if (typeof option != "object") throw new Error("option doit être un object")
                    if (value instanceof Promise) {
                        return value.then(v => this.set(v))
                    }
                    if (value instanceof RXState) value = value.value;
                    if (value instanceof Function) value = value(currentValueOfState, oldValueOfState);
                    const _oldValue = currentValueOfState;
                    if (_oldValue !== value) {
                        value = toValidate(value, _oldValue, option);
                        oldValueOfState = _oldValue;
                        currentValueOfState = value;
                        dispatchUpdate(option);
                    }
                    return currentValueOfState
                }).bind();
                insertArrayMethode(this, { createStateComputed });
                Object.entries(ACTIONS).map(([k,v])=>this.set[k]=payload=>this.set(v instanceof Function ?v(currentValueOfState,payload):v));
                if (value instanceof Promise) {
                    value.then(v => this.set(v));
                }
            }

        })(value, guard))
    }
    const stateType = {
        array(v) {
            if (!Array.isArray(v)) throw new Error("cette state doit être de type Array")
            return v
        },
        number(v) {
            if (typeof v != "number") throw new Error("cette state doit être de type Number")
            return v
        },
        string(v) {
            if (typeof v != "string") throw new Error("cette state doit être de type string")
            return v
        },
        function(v) {
            if (typeof v != "function") throw new Error("cette state doit être de type function")
            return v
        },
        boolean(v) {
            if (typeof v != "boolean") throw new Error("cette state doit être de type boolean")
            return v
        },
        symbol(v) {
            if (typeof v != "symbol") throw new Error("cette state doit être de type symbol")
            return v
        },
        object(v) {
            if (typeof v != "object") throw new Error("cette state doit être de type object")
            return v
        },
    };
    function insertArrayMethode(stateInstace, { createStateComputed }) {
        const state = stateInstace;
        const isArray = () => {
            if (!state.isArray) throw new Error("pour pouvoir utiliser cette methode le type de state doit être une Array")
        };
        const isFunction = (callback) => {
            if (!(callback instanceof Function)) throw new Error("callback doit doit être une function")
        };
        const getIndex = (index) => {
            if (index instanceof RXState) {
                index = index.value;
            }
            if (index instanceof Function) {
                index = state.value.findIndex(index);
            }
            if (isNaN(index)) throw new Error("index doit être une nombre ou une fonction qui retourne un nombre")
            return index
        };
        state.get.map = (callback) => {
            isFunction(callback);
            const createState = (v, i) => [useState(v)[0], useState(i)[0]];
            const rendMap = (v) => callback(...v, state);
            const listState = state.value.map(createState);
            let listElement = listState.map(rendMap);
            const [items, setItems] = useState(listElement);
            const update = () => listState.map(([v, i], index) => {
                if (!i.isDestroyed) i.set(index);
                if (!v.isDestroyed) v.set(state.value[index]);
            });
            state.onChange((val) => {
                if (listState.length > val.length) {
                    const indexStart = val.length;
                    const end = listState.length;
                    listState.splice(indexStart, end).map(s => s.map(i => i.destroy(true)));
                    setItems.splice(indexStart, end);
                } else if (listState.length < val.length) {
                    const indexStart = listState.length;
                    listState.push(...val.slice(indexStart).map(createState));
                    listState.map(([, index], i) => index.set(i));
                    setItems.push(...listState.slice(indexStart).map(rendMap));
                }
                update();
                // console.log(items.value);
            });
            return items
        };
        state.get.callback = (callback) => {
            if (!(callback instanceof Function)) throw new Error("callback doit être une function")
            return state.get(() => callback)
        };
        const action = (args, action) => {
            isArray();
            if (state.value[action] instanceof Function) {
                const returnValue = state.value[action](...args);
                return state.set([...state.value], { methode: "set", action, args, returnValue })
            }
        };
        // TODO: state.set.remove
        // TODO: state.set.removeItem
        // TODO: state.set.editItem
        state.set.splice = (...args) => action([...args], "splice");
        state.set.remove = (start, deleteCount = 1) => {
            const returnValue = state.value.splice(start, deleteCount);
            return state.set([...state.value], { methode: "set", action: "remove", args: [start, deleteCount], returnValue })
        };
        state.set.edit = (index, value) => {
            isArray();
            index = getIndex(index);
            if (index > -1) {
                if (value instanceof Function) {
                    value = value(state.value[index], index, state.value);
                }
                const returnValue = state.value.splice(index, 1, value);
                return state.set([...state.value], { methode: "set", action: "edit", args: [index, value], returnValue })
            }
        };
        state.set.push = (...items) => action([...items], "push");
        state.set.pop = () => action([], "pop");
        state.set.shift = () => action([], "shift");
        state.set.unshift = (...items) => action([...items], "shift");
        state.set.reverse = () => action([], "reverse");
        state.set.fill = (...items) => action([...items], "fill");
        state.set.filter = (predicate, ...args) => {
            isArray();
            isFunction(predicate);
            const returnValue = state.value.filter(predicate, ...args);
            return state.set(returnValue, { methode: "set", action: "filter", args: [predicate, ...args], returnValue })
        };
        state.set.slice = (...args) => {
            isArray();
            const returnValue = state.value.slice(...args);
            return state.set(returnValue, { methode: "set", action: "slice", args, returnValue })
        };
        state.set.sort = (compareFn = (a, b) => b - a) => {
            isArray();
            isFunction(compareFn);
            const oldValue = state.value.slice();
            const returnValue = state.value.sort(compareFn);
            if (returnValue.every((item, index) => item === oldValue[index])) return state.value
            return state.set(returnValue, { methode: "set", action: "sort", args:arguments, returnValue })
        };
        state.set.map = (callbackfn, thisArg = state.value) => {
            isArray();
            isFunction(callbackfn);
            const returnValue = state.value.map(callbackfn, ...args);
            return state.set(returnValue, { methode: "set", action: "map", args, returnValue })
        };
    }

    function useState(value, guard = guardFn) {
        if (value instanceof RXState) {
            value = value;
            if (guard instanceof Function && guard !== guardFn) value.addGuard(guard);
        } else if (Array.isArray(value) && value[0] instanceof RXState && value[1] === value[0].set) {
            value = value[0];
            if (guard instanceof Function && guard !== guardFn) value.addGuard(guard);
        } else {
            value = createState(value, guard);
        }
        return [value, value.set]
    }


    Object.entries(stateType).map(([type, guard]) => useState[type] = (value) => useState(value, guard));
    useState.isState = isState;

    const refSymbol=Symbol("$$ref");
    function useRef(value) {
        const [ref, changeRef] = useState(value);
        const OBJECT=Object;
        return OBJECT.freeze(new (class {
            constructor(){
                OBJECT.defineProperty(this,"current",{
                    get:(()=>ref.value).bind(),
                    set:((val)=>changeRef(val)).bind(),
                    enumerable:true,
                    configurable:false
                });
                OBJECT.defineProperty(this,"onChange",{
                    value:((fn)=>ref.onChange(fn)).bind(),
                    enumerable:true,
                });
            }
            onCleanup(fn){return ref.onCleanup(fn)}
            destroy(fn){return ref.destroy(true)}
            set(fn){return changeRef(fn)}
            get [".rxType"](){return refSymbol}
        }))
    }
    useRef.isRef=((ref)=>(typeof ref=="object")&&refSymbol===ref[".rxType"]).bind();

    // salu

    function useEffect(callback, states = []) {
        if (!Array.isArray(states)) throw new Error("states doit être une Array")
        const listRmv = [];
        let remove;
        const array = [...states];
        const getValue = s => s instanceof RXState ? s.value : s;
        const update=i=> Promise.resolve().then(() => remove = callback([...array.map(getValue)],i));
        array.forEach((st, i) => {
            if (st instanceof RXState) {
                listRmv.push(st.onChange(() => {update(i);}));
            }
        });
        requestIdleCallback(() => remove = callback([...array.map(getValue)],-1));
        return () => {
            listRmv.splice(0,listRmv.length).map(fn => fn?.());
            if (remove instanceof Function) remove(-1, [...array].map(getValue));
        }
    }

    function useLayoutEffect(callback, states = []) {
        if (!Array.isArray(states)) throw new Error("states doit être une Array")
        const listRmv = [];
        let remove;
        const array = [...states];
        const getValue = s => s instanceof RXState ? s.value : s;
        const update=i=> remove = callback([...array.map(getValue)],i);
        array.forEach((st, i) => {
            if (st instanceof RXState) {
                listRmv.push(st.onChange(() => {update(i);}));
            }
        });
        update(-1);
        return () => {
            listRmv.splice(0,listRmv.length).map(fn => fn?.());
            if (remove instanceof Function) remove(-1, [...array].map(getValue));
        }
    }

    function useProps(props = {}) {
        if(typeof props !="object") throw new Error("props doit être une object")
        return {
            ...Object.entries(props).reduce((prop, [key, value]) => ({ ...prop, [key]: (key === "children" || key.startsWith("$"))? value :useState.isState(value) ?value : useState(value)[0] }), {})
        }
    }

    const handlerEvent = {
        beforeDispatch: (...args) => [...args],
        afterDispatch: (data, returnValue) => [data, returnValue],
        onSubscribe: callback => callback,
        clearAfterEachDispatch:false
    };
    function useEvent(handler = handlerEvent) {
        if (typeof handler !== "object") throw new Error("handler doit être un object")
        const { beforeDispatch=handlerEvent.beforeDispatch, afterDispatch=handlerEvent.afterDispatch, onSubscribe=handlerEvent.onSubscribe,clearAfterEachDispatch=handlerEvent.clearAfterEachDispatch} = handler;
        const EVENTS = new Set();
        const subscribe = (callback) => {
            if (!(callback instanceof Function)) throw new Error("callback doit être un function")
            callback = onSubscribe(callback);
            if (callback instanceof Function) EVENTS.add(callback);
            return () => EVENTS.delete(callback)
        };
        return [subscribe, (data,...rest) => {
            const args = beforeDispatch(data,...rest);
            const returnValue = EVENTS.forEach(fn => fn?.(...(Array.isArray(args)?args:[args])));
            if(clearAfterEachDispatch)EVENTS.clear();
            return afterDispatch(data, returnValue)
        }]
    }

    function useMemo(callback, states = []) {
        if (!Array.isArray(states)) throw new Error("states doit être une Array")
        const listRmv = [];
        const [state,setState]=useState();
        const array = [...states];
        const getValue = s => s instanceof RXState ? s.value : s;
        const update=i=> setState(callback([...array.map(getValue)],i));
        array.forEach((st, i) => {
            if (st instanceof RXState) {
                listRmv.push(st.onChange(() => {update(i);}));
            }
        });
        update(-1);
        state.onCleanup(()=>listRmv.splice(0,listRmv.length).map(fn => fn?.()));
        return state
    }

    const DATABASE = new WeakMap();
    function $(dom) {
      if (!(dom instanceof Node))
        throw new Error("dom doit etre un instance de Node");
      if (DATABASE.get(dom)) return DATABASE.get(dom);
      let isDestroyed = false;
      let destroyList = [];
      const [onReady, dispatchReady] = useEvent({ clearAfterEachDispatch: true });
      const [onConnected, dispatchConnected] = useEvent({clearAfterEachDispatch: true});
      let isReady = false;
      onReady(() => (isReady = true));
      [...dom.childNodes];
      const textRef = new Text();
      const root = new Text();
      const fiber = null;
      const getTextRoot = () =>
        Promise.resolve().then(() => {
          if (dom.parentNode) {
            dom.after(textRef);
            dom.after(root);
          } else if (root.parentNode) {
            root.after(textRef);
          }
          return textRef;
        });
      const isValid = () => {
        if (isDestroyed)
          throw new Error(
            "cette dom est deja considerer comme detruit, donc vous ne peux plus faire cette action..."
          );
        return true;
      };
      function onCleanup(callback) {
        isValid();
        if (callback instanceof RXState && callback.value instanceof Function) {
          const state = callback;
          callback = (...args) => {
            if (!(state.value instanceof Function))
              throw new Error("state.value doit etre une function");
            state.value(...args);
          };
        } else if (Array.isArray(callback)) {
          callback.map((fn) => handler.onDestroy(fn));
          return;
        }
        if (callback instanceof Function) {
          destroyList.push(callback);
        }
      }
      const attr = (attrName, value) => {
        if (!(dom instanceof Element)) return null;
        if (attrName && value !== undefined) {
          dom.setAttribute(attrName, value || "");
          return dom.getAttribute(attrName);
        } else if (attrName) {
          return dom.getAttribute(attrName);
        }
        return dom.attributes;
      };
      const style = (propertyName, value) => {
        if(dom instanceof Element){
          if(value===undefined){
            return dom.style[propertyName]
          }
          dom.style[propertyName]=value;
        }
        return dom.style[propertyName]
      };
      const addClass = (className) => dom instanceof Element&&dom.classList.add(className);
      const hasClass = (className) => dom instanceof Element&&dom.classList.contains(className);
      const removeClass = (className) => dom instanceof Element&&dom.classList.remove(className);
      const toggleClass = (className) => dom instanceof Element&&dom.classList.toggle(className);
      const on = (type, value) => {
        const handler=e=>value instanceof Function&&value(e);
        dom.addEventListener(type,handler);
        return ()=>dom.removeEventListener(type,handler)
      };
      const getFiber = () => fiber;

      const destroy = (withDom = false) => { 
        if (dom instanceof Node && !(dom instanceof DocumentFragment)) {
          dom.remove();
        }
        if (isDestroyed) return;
        destroyList.map((fn) => fn instanceof Function && fn(withDom));
        isDestroyed = true;
        destroyList = [];
        if (dom instanceof Text && withDom) {
          dom.data = "";
        }
        // handler.$children.map((el) => el instanceof Node && $(el).destroy());
      };
      const HANDLER = {
        getFiber: () => fiber,
        attr,style,addClass,hasClass,removeClass,toggleClass,on,getFiber,
        onConnected,dispatchConnected,onReady,dispatchReady,getTextRoot,
        destroy,onCleanup,
        isReady: () => isReady,
        isDestroyed: () => isDestroyed,
        isConnected: () => isConnected,
        isCleaned: () => isClean,
        get textRef() {
          return textRef;
        },
        id: 123,
      };
      Object.freeze(HANDLER);
      HANDLER.onConnected(() => {
        if (dom.parentNode) {
          dom.after(root);
        }
      });
      const id=setInterval(()=>{
        if(dom.parentElement){
          clearInterval(id);
          dispatchConnected(dom.parentElement);
        }
      },10);
      DATABASE.set(dom, HANDLER);
      return HANDLER;
    }

    const codeLogError= {
        "fr":{
            0:data=>"",
        },
        "en":{

        }
    };
    const CODES=[];
    function rxError({code,lang={fr:(data)=>"rxError",en:(data)=>"rxError"}}) {
        if(CODES.includes(code)) throw new Error("ce code is already used")
        if(typeof lang !="object")throw new Error("lang must be an object")
        CODES.push(code);
        Object.entries(lang).map(([name,value])=>{
            codeLogError[name][code]=(data)=>{
                if(!(value instanceof Function)) throw new Error("each value of lang must be a function")
                return value(data)
            };
        });
    }

    rxError({
        code:0,
        lang:{
            fr:(data)=>{
                return `rxError:${data}`
            },
            en:(data)=>{
                return `rxError:${data}`
            }
        }
    });

    function createRegExp(...regs){
        return regs.reduce((regFinal,reg)=>new RegExp(regFinal.source+reg.source))
    }
    function getRegSource(reg){
        return typeof reg=="string"?reg:reg.source
    }
    function combineRegExp(...regs){
        return regs.reduce((regFinal,reg)=>new RegExp(regFinal.source+getRegSource(reg)))
    }
    function combineAndNoSaveRegExp(...regs){
        return new RegExp(`(?:${combineRegExp(...regs).source})`)
    }
    function createRegExpSaved(...regs){
        return new RegExp(`(${createRegExp(...regs).source})`)
    }
    function createRegExpSplit(...regs){
        return createRegExpSaved(regs.reduce((regFinal,reg)=>new RegExp(regFinal.source+"|"+reg.source)))
    }

    class TemplateRef extends Array {
        static get regExp() { return /\(_\|-\[RXRefs\{index:\d+,type:[\w\$]+\}\]-\|_\)/ }
        static get regExpSaved() { return /\(_\|-\[RXRefs\{index:(?<index>\d+),type:(?<type>[\w\$]+)\}\]-\|_\)/ }
        static get regExpSavedG() { return /\(_\|-\[RXRefs\{index:(?<index>\d+),type:(?<type>[\w\$]+)\}\]-\|_\)/g }
        static {
            this.split = function (chaine = "", includeResults = true) {
                if (typeof chaine != "string") throw new Error("chaine doit etre une chaine de caractere")
                const reg = includeResults ? createRegExpSplit(this.regExp) : this.regExp;
                const result = chaine.split(reg).reduce((l, item) => {
                    if (!item) return l
                    const r = this.parse(item);
                    if (r && includeResults instanceof Function) item = includeResults(r);
                    l.push(item);
                    return l
                }, []);
                return result
            };
            this.replaceAll = function (chaine, value = "") {
                if (typeof chaine != "string") throw new Error("chaine doit etre une chaine de caractere")
                return chaine.replaceAll(this.regExpSavedG, (input, index, type) => value instanceof Function ? value({ input, index, type }) : value)
            };
            this.parse = function (chaine = "", refs = null) {
                if (typeof chaine != "string") throw new Error("chaine doit etre une chaine de caractere")
                const result = /\(_\|-\[RXRefs\{index:(?<index>\d+),type:(?<type>[\w\$]+)\}\]-\|_\)/.exec(chaine);
                const value = refs ? this.split(chaine, ({ index }) => refs[index]) : null;
                const valueString = value ? value.join('') : "";
                return result ? {
                    index: result.groups.index,
                    type: result.groups.type,
                    input: result.input,
                    value, valueString, refs
                } : null
            };
        }
        constructor(...refs) {
            super();
            this.push(...refs);
            this.components={};
        }
    }

    const customeElementRegistry = {};
    const directiveOption = {
        el: null,
        attrName: "",
        attrValue: "",
        directiveName: "",
        arg: "",
        modifiers: {},
        index: 0
    };
    class FiberOfNode {
        #components = ({ ...customeElementRegistry })
        get components() { return this.#components }
        set components(components) {
            Object.assign(this.#components, components);
        }
        refs = new TemplateRef()
        directives = {
            $onInit({ attrValue, el} = directiveOption){
                attrValue=attrValue instanceof RXState?attrValue.value:attrValue;
                if(attrValue instanceof Function){
                    $(el).onCleanup=attrValue(el);
                    return
                }
                console.warn("$onInit.attrValue doit être de type Function");
            },
            $shadowRoot({ attrValue, el, arg } = directiveOption) {
                const elementsCanAttachShadowRoot = ["article", "aside", "blockquote", "body", "div", "footer", "h1", "h2", "h3", "h4", "h5", "h6", "header", "main", "nav", "p", "section", "span"];
                if (elementsCanAttachShadowRoot.includes(el.localName) || el.localName.includes("-")) {
                    let callback;
                    if (attrValue instanceof RXState) attrValue = attrValue.value;
                    if (attrValue instanceof Function) callback = attrValue;
                    const oldChildren = [...el.childNodes];
                    const root = el.attachShadow({ mode: arg === "closed" ? "closed" : "open" });
                    const returnValue = callback instanceof Function ? callback({ el, root, children: oldChildren }) : oldChildren;
                    const children = Array.isArray(returnValue) ? returnValue : [returnValue];
                    el.innerHTML = "";
                    root.append(...children);
                } else {
                    console.warn(`l'element ${el.localName} ne suporte pas le attachShadow. Seule les element personnalisé (balise avec un tiré) et quelque element native le supporte,
                voici une liste d'element qui le support:`, elementsCanAttachShadowRoot);
                }
            },
            $attrState({ attrValue, el, setAttribute } = directiveOption) {
                let cleanup;
                if (attrValue instanceof RXState) {
                    const update = (name, value) => {
                        if (cleanup instanceof Function) cleanup();
                        cleanup = setAttribute(el, name, value ?? "");
                    };
                    return attrValue.onChange((value, oldValue) => {
                        if (value && typeof value == "object") {
                            if (oldValue && typeof oldValue == "object") {
                                const isAsOld = value.attrName === oldValue.attrName && value.attrValue === oldValue.attrValue;
                                if (!isAsOld) {
                                    update(value.attrName, value.attrValue ?? "");
                                }
                            } else {
                                update(value.attrName, value.attrValue ?? "");
                            }
                        } else {
                            update(value, "");
                        }
                        return cleanup
                    }, true)
                }
                return setAttribute(el, attrValue, true)
            },
            $if({ attrValue, el, index, data ,arg} = directiveOption) {
                index = Math.random();
                if (typeof data.listCondition != "object") data.listCondition = {};
                const getValue = (value) => value instanceof Function ? value(el) : !!value;
                const hasValidNow=()=>Object.values(data.listCondition).every(isTrue => isTrue);
                // const makeVisible = (isVisible = hasValidNow()) => el.getTextRoot()
                const makeVisible = (isVisible = hasValidNow()) =>$(el).getTextRoot()
                    .then(textRef => {
                        if(!textRef.parentNode){
                            // return el.onConnected(()=>el.getTextRoot().then(()=>hasValidNow() ? textRef.after(el) : el.remove()))
                            return $(el).onConnected(()=>$(el).getTextRoot().then(()=>hasValidNow() ? textRef.after(el) : el.remove()))
                        }
                        return textRef.parentNode && isVisible ? textRef.after(el) : el.remove()
                    });
                if (attrValue instanceof RXState) {
                    return attrValue.onChange((value) => {
                        const v=getValue(value);
                        data.listCondition[index] =arg=="false"?!v:v;
                        makeVisible();
                        return () => {
                            delete data.listCondition[index];
                            attrValue.destroy(true);
                        }
                    }, true)
                } else {
                    data.listCondition[index] = getValue(attrValue);
                    makeVisible();
                }
                return () => data.listCondition[index] = true
            },
            $ref({ el, attrValue } = directiveOption) {
                if (attrValue instanceof RXState) {
                    attrValue=attrValue.value;
                }
                if (attrValue instanceof Function) {
                    return attrValue(el)
                }else if (useRef.isRef(attrValue)){
                    attrValue.current=el;
                }
            },
            $show({ el: dom, attrValue } = directiveOption) {
                if (attrValue instanceof RXState) {
                    return attrValue.onChange((isShow) => {
                        dom.hidden = !isShow;
                        return () => attrValue.destroy(true)
                    }, true)
                } else {
                    dom.hidden = !attrValue;
                }
            },
            $bind({ el, arg, modifiers, attrValue } = directiveOption) {
                const fnRmvs = [];
                if (attrValue instanceof RXState) {
                    fnRmvs.push(attrValue.onChange((v) => {
                        if (arg in el) {
                            el[arg] = v;
                        } else {
                            el.setAttribute(arg, v);
                        }
                        return () => attrValue.destroy(true)
                    }, true));
                }
                const handlerEvent = () => {
                    const value = arg in el ? el[arg] : el.getAttribute(arg);
                    if (attrValue instanceof RXState) attrValue.set(value);
                };
                fnRmvs.push(...Object.keys(modifiers).map(eventName => {
                    el.addEventListener(eventName, handlerEvent);
                    return () => el.removeEventListener(eventName, handlerEvent)
                }));
                if (Object.keys(modifiers).length == 0) {
                    const eventName = ["input"].includes(el.localName) ? "input" : "change";
                    el.addEventListener(eventName, handlerEvent);
                    fnRmvs.push(() => el.removeEventListener(eventName, handlerEvent));
                }
                return () => fnRmvs.map(fn => fn())
            },
            $directives({ el, arg, modifiers, attrValue } = directiveOption) {
                if (attrValue instanceof RXState) attrValue = attrValue.value;
                if (typeof attrValue == "object") {
                    Object.assign(this, attrValue);
                }
            }
        }
        initProps(refs = this.refs) {
            if (!(refs instanceof TemplateRef)) throw new Error("refs must be an instance of RXRefs")
            const getrefs = ({ index }) => this.refs[index];
            const generateKey = (data, key) => {
                const gk = () => {
                    let i = Math.round(Math.random() * 100_000_000);
                    while ((key + `<${i}>`) in data) { i++; }
                    key += `<${i}>`;
                    return key
                };
                if (key in data) {
                    if (key.includes("<") && key.includes(">") && key.at(-1) == ">") {
                        const indexA = key.indexOf("<");
                        key = key.slice(0, indexA);
                    }
                    return gk()
                }
                return key
            };
            this.props = Object.entries(this.props).reduce((props, [attrName, value]) => {
                const attrNameComputed = TemplateRef.parse(attrName, this.refs);
                const valueArray = typeof value == "string" ? TemplateRef.split(value ?? "", getrefs) : [value];


                if (/^\s*$/.test(valueArray[0]) && !(valueArray[0] instanceof RXState)) valueArray.shift();
                if (/^\s*$/.test(valueArray.at(-1)) && !(valueArray[0] instanceof RXState)) valueArray.pop();

                let hasValueFinal = false;
                let valueFinal;
                const getValue = () => {
                    if (hasValueFinal) return valueFinal
                    hasValueFinal = true;
                    if (valueArray.length == 0) {
                        valueFinal = "";
                        return ""
                    }
                    if (valueArray.length == 1) {
                        valueFinal = valueArray[0];
                        return valueArray[0]
                    }
                    const stateValue = useMemo(() => valueArray.join("") , valueArray);
                    valueFinal = stateValue;
                    return stateValue
                };
                if (attrNameComputed) {
                    let hasCallback = false;
                    const hasState = !!attrNameComputed.value.find(v => {
                        if (v instanceof Function) {
                            hasCallback = true;
                        }
                        return v instanceof RXState
                    });
                    const isDirective = attrNameComputed.value[0] == "$" && attrNameComputed.value[1] instanceof Function;
                    const createMemo = () => useMemo(() => ({
                        attrName: attrNameComputed.value.map(v => v instanceof Function ? v.name : v instanceof RXState ? v.toString() : typeof v == "object" ? v?.constructor?.name : v).join(""),
                        attrValue: getValue()
                    }), [...attrNameComputed.value]);

                    if (isDirective) {
                        const callback = attrNameComputed.value[1];
                        const id = Math.round(Math.random() * 1_000_000);
                        const callbackName = (callback.name[0] == "$" ? callback.name : "$" + callback.name) + "{" + id + "}";
                        this.directives[callbackName] = callback;
                        let key = "$attrState";
                        key = generateKey(props, key);
                        attrNameComputed.value[0] = "";
                        attrNameComputed.value[1] = callbackName;
                        const attr = createMemo();
                        props[key] = attr;
                        return props
                    } else if (hasState) {
                        let key = "$attrState";
                        key = generateKey(props, key);
                        const attr = createMemo();
                        props[key] = attr;
                        return props
                    } else if (hasCallback) {
                        const lnc = [...attrNameComputed.value]; // list Name Computed
                        if (lnc[0] instanceof Function && lnc.length == 1) {
                            let key = "$onInit";
                            key = generateKey(props, key);
                            props[key] = lnc[0];
                            return props
                        } else {
                            let key = [...attrNameComputed.value].map(v => v instanceof Function ? v.name : v).join("");
                            key = generateKey(props, key);
                            props[key] = getValue();
                            return props
                        }
                    } else if (attrNameComputed.value[0] instanceof Object && attrNameComputed.value.length === 1) {
                        if (value != "") return props
                        if (attrNameComputed.value[0].constructor !== Object) return props
                        Object.entries(attrNameComputed.value[0]).map(([k, v]) => {
                            k = generateKey(props, k);
                            props[k] = v;
                        });
                        return props
                    } else {
                        attrName = attrNameComputed.valueString;
                    }
                }
                let ismustState=false;
                if(attrName[0]==":"){
                    ismustState=true;
                    attrName=attrName.slice(1);
                }
                if (attrName == "children") {
                    props.children = value;
                    return props
                }
                attrName = generateKey(props, attrName);
                props[attrName] = ismustState?useMemo(()=>getValue()):getValue();
                return props
            }, {});
        }
        constructor() {}
        type
        props
        #dom
        #parent
        get parent(){return this.#parent}
        set parent(parentFiber){
            if(!(parentFiber instanceof FiberOfNode)) throw new Error('parentFiber doit être une instance FiberOfNode')
            this.#parent=parentFiber;
        }
        get dom(){
            return this.#dom
        }
        set dom(domValue){
            if(this.#dom) throw new Error("dom a déja une valeur Node ")
            if(!(domValue instanceof Node)) throw new Error("domValue doit être une instance de Node")
            this.#dom=domValue;
        }
    }

    class FiberOfElement extends FiberOfNode {
        constructor(type, props = {}, refs=new TemplateRef()) {
            if (!(refs instanceof TemplateRef)) throw new Error("refs must be an instance of RXRefs")
            super();
            this.type = type;
            this.refs = refs;
            this.props = Object.freeze({
                ...props,
                children: props.children?? []
            });
            this.props.children.map((child,index)=>{
                if(child instanceof DocumentFragment){
                    this.props.children[index]=[...child.$children];
                }
            });
            this.initProps(this.refs);
            this.components=this.refs.components;
            if(this.components[type]){
                this.type=this.components[type];
            }
            Object.freeze(this);
        }
    }

    class FiberOfFragment extends FiberOfNode {
        constructor(children, refs=new TemplateRef()) {
            if (!(refs instanceof TemplateRef)) throw new Error("refs must be an instance of RXRefs")
            super();
            this.refs = refs;
            this.type = "FRAGMENT";
            this.props = Object.freeze({
                children:children ?? []
            });
            this.initProps(this.refs);
            Object.freeze(this);
        }
    }

    class FiberOfText extends FiberOfNode {
        constructor(text, refs=new TemplateRef()) {
            if (!(refs instanceof TemplateRef)) throw new Error("refs must be an instance of RXRefs")
            super();
            this.refs = refs;
            this.type = "TEXT";
            this.props = Object.freeze({
                nodeValue: text,
                children: []
            });
            Object.freeze(this);
            if(this.props.nodeValue instanceof Node ) {
                if(this.props.nodeValue instanceof DocumentFragment){
                    console.log([...this.props.nodeValue.$children]);
                }
                return this.props.nodeValue
            }
            if (this.props.nodeValue instanceof FiberOfNode) return this.props.nodeValue
        }
    }

    const needCallback$1 = (callback, args, $this) => callback.apply($this, args);
    needCallback$1.after = (callback, args, $this) => Promise.resolve().then(() => callback.apply($this, args));
    needCallback$1.idle = (callback, args, $this) => requestIdleCallback(() => callback.apply($this, args));

    function createElement(fiber) {
        const sendListOfDom = (list) => list.flat(Infinity).map(child => createDom(child));
        if (fiber instanceof Node) return fiber
        if (fiber instanceof FiberOfNode && fiber.dom instanceof Node) return fiber.dom
        if (fiber instanceof FiberOfFragment) {
            return sendListOfDom(fiber.props.children)
        }
        if (fiber instanceof FiberOfText) {
            if (Array.isArray(fiber.props.nodeValue)) {
                return sendListOfDom(fiber.props.nodeValue)
            }
            return fiber.props.nodeValue instanceof Node ? fiber.props.nodeValue : new Text(fiber.props.nodeValue)
        }
        if (fiber instanceof FiberOfElement) {
            if (fiber.components[fiber.type] instanceof Function) {
                const component = fiber.components[fiber.type];
                fiber.type = component;
            }
            if (fiber.type instanceof Function) {
                let props = fiber.props;
                if (typeof fiber.type.defaultProps == "object") props = { ...fiber.type.defaultProps, ...props };
                const el = fiber.type(props);
                return createDom(el)
            }
            return document.createElement(fiber.type)
        }
        if (Array.isArray(fiber)) {
            return sendListOfDom(fiber)
        }
        if (fiber instanceof Function) {
            let props = { children: [] };
            if (typeof fiber.defaultProps == "object") props = { ...fiber.defaultProps, children: [] };
            return createDom(fiber(props))
        }
        if (fiber instanceof RXState) {
            return createDom(new FiberOfText(fiber, new TemplateRef()))
        }
        try {
            return new Text(JSON.stringify(fiber))
        } catch (error) {
            return new Text(fiber)
        }
    }
    function initProps(dom, fiber) {
        if (!(dom instanceof Node)) throw new Error('dom doit etre un element node')
        if (!(dom instanceof HTMLElement)) return null
        if (fiber && fiber.type instanceof Function) return null;
        if (!(fiber instanceof FiberOfElement)) return null
        const globalData = {};
        const counterName = {};
        
        const setOneAttribute = (props, [attrName, attrValue], dom, listOnCleanup = []) => {
            const setAttribute = (value, domEl = dom, attrN = attrName) => {
                if (/^\s*$/.test(attrN)) return
                if (domEl instanceof HTMLSelectElement && ["multiple",].includes(attrN)) {
                    domEl.multiple = true;
                } else
                    if (["disabled", "hidden"].includes(attrN)) {
                        // console.log(value);
                        // domEl.setAttribute(attrN,"")
                        return domEl[attrN] = value === "" ? true : value
                    } else if ((attrN in domEl) || (["object", "function"].includes(typeof value))) {
                        if (typeof value == "object" && typeof domEl[attrN] == "object") return Object.assign(domEl[attrN], value)
                        return domEl[attrN] = value
                    }
                domEl.setAttribute(attrN, value);
            };
            const setAttr = (el, attrName, attrValue) => {
                const listrmv = [];
                setOneAttribute(props, [attrName, attrValue], el, listrmv);
                return () => needCallback$1(() => listrmv.map(fn => fn instanceof Function && fn()/** */))
            };
            const rendAttribute = (update, onRemove) => {
                const redOneStyle = (value) => {
                    if (value instanceof RXState) {
                        // dom.onCleanup = value.onChange((val, oldVal) => {
                        $(dom).onCleanup(value.onChange((val, oldVal) => {
                            update(val, oldVal);
                            return () => value.destroy()
                        }, true));
                    } else {
                        update(value);
                    }
                };
                if (Array.isArray(attrValue)) {
                    attrValue.map(val => redOneStyle(val));
                } else {
                    redOneStyle(attrValue);
                }
                $(dom).onCleanup(() => onRemove instanceof Function && onRemove());
            };
            const toClean = () => null;
            let cleanup = toClean;
            let resultReg;
            const rcState = attrValue;
            const res = /^([^<>]+)<\d+>$/.exec(attrName);
            if (res) { attrName = res[1]; }
            if (attrName == "children" || !(fiber instanceof FiberOfElement)) return props
            if (typeof attrName != "string") return props

            if (attrName && (attrName.startsWith('on') || attrName.startsWith('@'))) {

                let type = attrName.slice(attrName.startsWith('on') ? 2 : 1).toLowerCase();
                if (type.indexOf("<") > -1) {
                    type = type.slice(0, type.indexOf("<"));
                }
                const applyCallback = (fn, args = []) => {
                    if (fn instanceof RXState) {
                        fn = fn.isDestroyed ? () => null : fn.value;
                    }
                    return fn(...args)
                };
                const callback = (...args) => {
                    if (Array.isArray(attrValue)) {
                        return attrValue.map(fn => applyCallback(fn, args))
                    }
                    applyCallback(attrValue, args);
                };
                let removeEv = () => dom.removeEventListener(type, callback);
                $(dom).onCleanup(removeEv);
                // dom.onDestroy(removeEv)
                dom.addEventListener(type, callback);
                cleanup = () => removeEv;
                return props
            } else if (attrName[0] == ".") {
                const oldValue = dom[attrName.slice(1)];
                dom[attrName.slice(1)] = attrValue;
                cleanup = () => dom[attrName.slice(1)] = oldValue;
                return props
            } else if (resultReg = /^(?<name>(?:\$|\:)[^\s</>\:\[\]]+)(?:\:(?<arg>[^\s</>:\[\]]*)(\[(?<modifiers>[^\s</>\[\]]*)\])?)?(?:\<(?<index>\d+)\>)?$/.exec(attrName)) {
                const { name, arg, modifiers } = resultReg.groups;
                counterName[name] = name in counterName ? counterName[name] + 1 : 0;
                if (fiber.directives[name] instanceof Function) {
                    let index = counterName[name];
                    const directivesMustSync = ["$ref"];
                    const callback = directivesMustSync.includes(name) ? needCallback$1 : needCallback$1.after;
                    callback(() => {
                        if (!globalData[name]) globalData[name] = {};
                        const rmv = fiber.directives[name]({
                            setAttribute: setAttr,
                            globalData,
                            data: globalData[name],
                            el: dom, attrName, attrValue,
                            index: index ? Number(index) : 0,
                            directiveName: name, arg,
                            modifiers: modifiers?.split(',').reduce((data, modif) => { data[modif] = true; return data }, {}) || {}
                        });
                        if (rmv instanceof Function) {
                            // dom.onDestroy(rmv)
                            $(dom).onCleanup(rmv);
                            cleanup = rmv;
                            listOnCleanup.push(cleanup);
                        }
                    });
                }
                return props
            } else if (["input", "select", "textarea"].includes(dom.localName) && ["value", "checked"].includes(attrName) && (rcState instanceof RXState)) {
                if (["select"].includes(dom.localName) && dom instanceof HTMLSelectElement) {
                    dom.value = rcState.value;
                    // dom.onReady(()=>{
                    $(dom).onReady(() => {
                        dom.selectedIndex = -1;
                        let i = -1;
                        for (let opt of dom) {
                            i++;
                            if (opt.value === rcState.value) {
                                dom.selectedIndex = i;
                            }
                        }
                    });
                    // dom.selectedIndex=2
                }
                const rmv = (e) => needCallback$1.after(() => {

                    if (["checkbox"].includes(e.target.type)) {
                        return rcState.set(e.target.checked)
                    }
                    return rcState.set(e.target[attrName])
                });
                dom.addEventListener('input', rmv);
                cleanup = () => {
                    dom.removeEventListener("input", rmv);
                    dom.value = "";
                };
                // dom.onDestroy(cleanup)
                $(dom).onCleanup(cleanup);
            } else if (attrName == "style" || /^style<\d+>/.test(attrName)) {
                const styleDefault = dom.style.cssText;
                const rendStyle = (value) => needCallback$1.after(() => {
                    if (value instanceof Object) {
                        Object.assign(dom.style, value);
                    } else {
                        dom.style.cssText += value;
                    }
                });
                rendAttribute(rendStyle, () => rendStyle(styleDefault));
                return props
            } else if (attrName == "class" || /^class\<\d+\>/.test(attrName)) {
                const styleDefault = dom.getAttribute("class");

                const rendClass = (value, oldValue) => needCallback$1.after(() => {
                    const addValue = (_value) => String(_value).split(" ").map(val => val && dom.classList.add(val));
                    const removeValue = (_value) => String(_value).split(" ").map(val => val && dom.classList.remove(val));
                    Array.isArray(oldValue) ? oldValue.map(val => removeValue(val)) : removeValue(oldValue);
                    Array.isArray(value) ? value.map(val => addValue(val)) : addValue(value);
                });
                rendAttribute(rendClass, () => rendClass(styleDefault));
                return props
            } else if (attrName && attrName.startsWith('?')) {
                attrName = /^([^<>]+)\<\d+\>/.test(attrName) ? attrName.slice(0, attrName.indexOf("<")) : attrName;
                if (!attrValue) return props
                let rmvAttr;//=setAttr(dom,attrName.slice(1),"")
                const insertAttr = (value) => {
                    const inertAttr = (v) => setAttr(dom, attrName.slice(1), v);
                    if (typeof attrValue == "object") {
                        const { when, value: val } = value;
                        if (when instanceof RXState) {
                            let rmAt;
                            return when.onChange((isTrue) => {
                                if (isTrue) {
                                    if (!rmAt) rmAt = inertAttr(val instanceof RXState ? val.get() : val);
                                } else {
                                    if (rmAt) rmAt();
                                    rmAt = null;
                                }
                                return () => rmAt && rmAt();
                            }, true)
                        } else {

                            if (when) return inertAttr(val)
                        }
                    } else {
                        return inertAttr(value)
                    }
                };
                if (attrValue instanceof RXState) ; else {
                    rmvAttr = insertAttr(attrValue);
                }

                const rmv = () => rmvAttr();
                if (rmv instanceof Function) {
                    dom.onDestroy(rmv);
                    cleanup = rmv;
                    listOnCleanup.push(cleanup);
                }
                return props
            }
            if (attrValue instanceof RXState) {
                const state = attrValue;
                const clean = state.onChange(v => {
                    setAttribute(v);
                    return () => {
                        state.destroy(true);
                        dom.removeAttribute(attrName);
                    }
                });
                // dom.onDestroy(clean)
                $(dom).onCleanup(clean);
                attrValue = attrValue.value;
                listOnCleanup.push(clean);
            }

            setAttribute(attrValue);
            if (cleanup === toClean) {
                cleanup = () => {
                    dom.removeAttribute(attrName);
                };
            }
            listOnCleanup.push(cleanup);
            return props
        };
        Object.entries(fiber.props).reduce((props, [attrName, attrValue]) => setOneAttribute(props, [attrName, attrValue], dom), {});
    }
    const updateArray = {
        set(valueOfState, oldValueOfState, { methode, value, textRef, listElement }) {
            if (!Array.isArray(listElement)) throw new Error("listElement doit être une Array")
            if (!Array.isArray(valueOfState)) throw new Error("valueOfState doit être une Array")
            textRef.$firstElement = listElement[0];
            if (valueOfState.every(v => v instanceof Node)) {
                const listDom = [];
                listElement.splice(0, listElement.length, ...valueOfState.map((item, indexItem) => {
                    const dom = createDom(item);
                    if (indexItem == 0) {
                        if (textRef.$firstElement !== dom) {
                            textRef.$firstElement = dom;
                            textRef.after(dom);
                        }
                    } else if (listElement[indexItem] !== dom) {
                        listDom.at(-1).after(dom);
                    } else ;
                    listDom.push(dom);
                    return dom
                })).map(e => !listElement.find(_e => _e === e) && $(e).destroy(true));
            } else {
                listElement.splice(0, listElement.length, ...valueOfState.map(v => {
                    const dom = createDom(v);
                    textRef.before(dom);
                    return dom
                })).map(e => $(e).destroy());
            }
        }
    };
    function updateDataBinding(state, textDom, dom, listElement) {
        const remove = state.onChange((valueOfState, oldValueOfState, { methode, value, ...option }) => {
            oldValueOfState instanceof Node && valueOfState !== oldValueOfState && oldValueOfState.destroy(true);

            if (valueOfState instanceof Node) {
                listElement.splice(0, listElement.length).map(el => el instanceof Node && el.destroy());
                textDom.data = "";
                needCallback$1.idle(() => textDom.after(valueOfState));
                listElement.push(valueOfState);
            } else {
                textDom.data = valueOfState;
                if (Array.isArray(valueOfState)) {
                    textDom.data = "";
                    const args = [valueOfState, oldValueOfState, { ...option, methode, value, listElement, textRef: textDom }];
                    needCallback$1.after(() => {
                        if (updateArray[methode] instanceof Function) {
                            updateArray[methode](...args);
                        } else {
                            updateArray.set(...args);
                        }
                    });
                } else if (valueOfState instanceof FiberOfNode) {
                    textDom.data = "";
                    // console.log(isUpdate);
                    listElement.splice(0, listElement.length).map(el => el instanceof Node && el.destroy());
                    const el = createDom(valueOfState);
                    listElement.push(el);
                    el.onDestroy(() => listElement.length && remove());
                    let isRended = false;
                    const putAfter = (elRef, elTarget, isforced = false) => {
                        if (isRended && !isforced) return true
                        if (elRef.parentNode) {
                            elRef.after(elTarget);
                            isRended = true;
                            return true
                        }
                        return false
                    };

                    const rendLater = () => {
                        putAfter(textDom, el);
                        if (!isRended) return requestIdleCallback(rendLater)
                    };
                    requestIdleCallback(rendLater);
                    textDom.onConnected((p) => {
                        if (p instanceof Node && textDom.parentNode !== p) {
                            p.append(textDom);
                            return putAfter(textDom, el, true)
                        }
                        putAfter(textDom, el);
                    });
                } else if (typeof valueOfState == "object") {
                    try {
                        textDom.data = JSON.stringify(valueOfState, null, 20);
                    } catch (error) { }
                }
            }
            return (withDom = true) => {
                textDom.data = "";
                listElement.map(dom => dom.destroy(withDom));
                if (oldValueOfState instanceof Node) {
                    oldValueOfState.destroy();
                }
                if (withDom) {
                    textDom.remove();
                    state.destroy(true);
                }
            }
        }, true);
        // dom.onDestroy(remove)
        $(dom).onCleanup(remove);
    }
    function bindData(textDom, textFiber) {
        if (!(textFiber.props.nodeValue instanceof RXState)) return textDom
        let state = textFiber.props.nodeValue;
        const dom = Array.isArray(state.value) ? new DocumentFragment() : textDom;
        textFiber.dom = dom;
        // insertEventDom(dom)
        if (Array.isArray(state.value)) dom.append(textDom);

        if (!(textDom instanceof Text)) throw new Error("textDom doit être une instance de Text")
        // if (!(textDom.onDestroy instanceof Function)) throw new Error("textDom.onDestroy doit être une fonction")

        let listElement = [];
        // updateDataBinding(state, textDom, dom, listElement)
        needCallback$1.after(() => updateDataBinding(state, textDom, dom, listElement));

        return dom
    }

    const listOfTagPriority = ["style", "link"];
    const isRendPriority = (element, container) => {
        if (listOfTagPriority.includes(String(element?.type).toLowerCase())) return true
        if (listOfTagPriority.includes(container.localName)) return true
    };
    function createTextRef(container) {
        if (!(container instanceof Node)) throw new Error("container doit être de type Node")
        const txtRef = new Text("");
        if (container.shadowRoot) {
            container.shadowRoot.append(txtRef);
        } else {
            container.append(txtRef);
        }
        return txtRef
    }
    function render(element, container = document.body) {
        if (typeof container == "string") container = document.querySelector(container);
        if (!(container instanceof Node)) throw new Error("container doit être de type Node")
        let returnDom;
        const txtRef = createTextRef(container);
        function appendChild(dom) {
            if (Array.isArray(dom)) {
                returnDom = dom.map(child => render(child, container));
                return returnDom
            }
            // insertEventDom(dom)
            // insertEventDom(container)
            $(container).onCleanup($(dom).onCleanup);
            // container.onDestroy(dom.destroy)
            const append = () => {
                txtRef.after(dom);
                // if (container instanceof DocumentFragment) container.$children = dom;
                // $(container).$children = dom
                $(dom).dispatchConnected(container);
                // dom.dispatchConnected(container)
            };
            append();
            txtRef.remove();
            returnDom = dom;
        }
        async function init() {
            if (returnDom) return returnDom
            if (!(container instanceof Node)) throw new Error("container doit etre un instance de Node")
            const dom = await needCallback$1.after(() => createDom(element));
            appendChild(dom);
            return returnDom
        }
        if (isRendPriority(element, container)) {
            const dom = createDom(element);
            appendChild(dom);
        }
        return init()
    }

    function createDom(fiber) {
        if (fiber instanceof FiberOfNode && fiber.dom instanceof Node) {
            throw new Error("fibre a déja une instance dom, fais une copie du fibre si vous voulez une autre instance")
        }
        if (Array.isArray(fiber)) {
            // fiber=new FiberOfFragment(fiber)
            return fiber.flat(Infinity).map(child => createDom(child))
        } else if (fiber instanceof Function) {
            fiber = new FiberOfElement(fiber, { children: [] });
        } else if (!(fiber instanceof EventTarget) && !(fiber instanceof FiberOfNode)) {
            fiber = new FiberOfText(fiber);
        }
        const dom = createElement(fiber);
        if (fiber instanceof FiberOfNode && dom instanceof Node && !(dom.fiber instanceof FiberOfNode)) {
            Object.defineProperty(dom, "fiber", {
                get: () => fiber
            });
        }

        const createChild = (childDom) => {
            // insertEventDom(childDom)
            // const handlerDom=$(childDom)
            if (fiber instanceof Node) return childDom
            if (fiber instanceof FiberOfText && RXState.isState(fiber.props.nodeValue)) return bindData(childDom, fiber)
            if (fiber && fiber.type instanceof Function) return childDom
            const rending = [];
            if (fiber instanceof FiberOfNode) {
                fiber.dom = childDom;
                if (!fiber.props.children) return childDom
                rending.push(...fiber.props.children.flat(Infinity).map(child => {
                    if (typeof fiber.components != "object") {
                        console.warn("fiber.component doit être une object");
                        fiber.components = {};
                    }
                    if (child instanceof FiberOfNode) {
                        child.parent = fiber;
                        Object.assign(child.directives, fiber.directives);
                        child.components = fiber.components;
                    }
                    return render(child, childDom)
                }));
            }
            Promise.all(rending)
                .then((children) => {
                    initProps(childDom, fiber);
                    needCallback$1.after(() => $(childDom).dispatchReady(childDom, children));
                });
            return childDom
        };
        if (Array.isArray(dom)) {
            if (fiber.parent instanceof FiberOfNode) {
                return dom
            }
            const doc = new DocumentFragment;
            // insertEventDom(doc)
            // $(doc).$children = dom
            // doc.$children = dom
            doc.append(...dom);
            return doc
        }
        return createChild(dom)
    }

    function component(callback, option = { defaultProps: {}}) {
        if(typeof option!="object") throw new Error("option doit être une de type object")
        const defaultProps=option.defaultProps??{};
        if(typeof defaultProps!="object") throw new Error("option.defaultProps doit être une de type object")
        const fn=(props) => callback(useProps({...defaultProps,...props}));
        fn.defaultProps=defaultProps;
        return fn
    }

    const REGISTER = new WeakMap();
    const options={
      defaultProps:{},
      shadowRoot:null
    };
    function define(tagName, renderCallback, option = options) {
        const { defaultProps = options.defaultProps, shadowRoot = options.shadowRoot } =
          option;
        const CLASSElement = class extends HTMLElement {
          static get observedAttributes() {
            return Object.keys(defaultProps);
          }
          attributeChangedCallback(name, oldV, newV) {
            const props = REGISTER.get(this).props;
            if (
              useState.isState(props[name]) &&
              props[name].toString() != newV &&
              typeof props[name].value != "object"
            ) {
              props[name].set(newV);
              console.log(name, newV);
            }
          }
          constructor(_props) {
            super();
            _props = typeof _props == "object" && _props ? _props : {};
            const handler={
              connectedCallback: useEvent(),
              disconnectedCallback: useEvent(),
              adoptedCallback: useEvent(),
              onCleanup: [() => {}],
              mounted: useEvent({
                onSubscribe: (fn) => {
                  return (...arg) => {
                    const rv = fn(arg);
                    if (rv instanceof Function) {
                      this.onCleanup(rv);
                    }
                  };
                },
              }),
              props: _props,
              children: []
            };
            REGISTER.set(this, handler);
            $(this);
            if(Array.isArray(_props.children)){
              handler.children.push(..._props.children);
            }
            const root = option.shadowRoot
              ? this.attachShadow({
                  mode: "closed" === option.shadowRoot?.mode ? "closed" : "open",
                  delegatesFocus: !!option.shadowRoot?.delegatesFocus,
                  slotAssignment:
                    "manual" === option.shadowRoot?.slotAssignment
                      ? "manual"
                      : "named",
                })
              : this;
              $(root);
            const $component = Object.freeze({
              root,
              el: this,
              ...Object.entries(handler).reduce((ob, [k, v]) => {
                if (Array.isArray(v)) {
                  ob[k] = v[0];
                }
                return ob;
              }, {}),
            });
            setTimeout(() => {
              Promise.resolve().then(() => {
                for (let i of this.attributes) {
                    const name=i.name;
                  if(useState.isState(_props[name])){
                      _props[name].set(i.value);
                  }else {
                      _props[name]=i.value;
                  }
                }
                handler.props = useProps({ ...defaultProps, ..._props });
                handler.children.push(...this.childNodes);
                const el = renderCallback(
                  { ...handler.props, children:[...handler.children] },
                  $component
                );
                //   this.innerHTML = "";
                root.append(createDom(el));
                handler.mounted[1](this);
                if (this.isConnected) {
                  handler.connectedCallback[1]();
                }
              });
            });
          }
          connectedCallback() {
            REGISTER.get(this).connectedCallback[1]();
          }
          disconnectedCallback() {
            REGISTER.get(this).disconnectedCallback[1]();
          }
          adoptedCallback() {
            REGISTER.get(this).adoptedCallback[1]();
          }
        };
      
        customElements.define(tagName, CLASSElement, {});
        return (props) => new CLASSElement({ children: [], ...props });
      }

    const listTagEmpty = ["area", "base", "br", "col", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"];
    const listTagKnown = ["a", "abbr", "address", "area", "article", "aside", "audio", "b", "base", "bdi", "bdo", "blockquote", "body", "br", "button", "canvas", "caption", "cite", "code", "col", "colgroup", "data", "datalist", "dd", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "em", "embed", "fieldset", "figcaption", "figure", "font", "footer", "form", "frame", "frameset", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "iframe", "img", "input", "ins", "kbd", "label", "legend", "li", "link", "main", "map", "mark", "marquee", "menu", "meta", "meter", "nav", "noscript", "object", "ol", "optgroup", "option", "output", "p", "param", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "script", "section", "select", "slot", "small", "source", "span", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "title", "tr", "track", "u", "ul", "var", "video", "wbr"];
    const regExpHtmlTagSave = /(<(?:\/\s*)?(?:[^\!<>\s"'=\/\\]+)\s*(?:(?:\s*(?<="|'|\s)[^<>\s"'=\/\\]+\s*=\s*"[^"]*"|\s*(?<="|'|\s)[^<>\s"'=\/\\]+\s*=\s*'[^']*'|\s*(?<="|'|\s)[^<>\s"'=\/\\]+\s*=\s*[^<>\s"'=\/\\]+|\s*(?<="|'|\s)[^<>\s"'=\/\\]+?)*)\s*(?:\/)?\s*>)/;
    const regExpHtmlTagFullCapture = /<(?<isClosingTag>\/\s*)?(?<type>[^\!<>\s"'=\/\\]+)\s*(?<attr>(?:\s*(?<="|'|\s)[^<>\s"'=\/\\]+\s*=\s*"[^"]*"|\s*(?<="|'|\s)[^<>\s"'=\/\\]+\s*=\s*'[^']*'|\s*(?<="|'|\s)[^<>\s"'=\/\\]+\s*=\s*[^<>\s"'=\/\\]+|\s*(?<="|'|\s)[^<>\s"'=\/\\]+?)*)\s*(?<isAutoClose>\/)?\s*>/;
    const regStringValidHtml = /[^<>\s"'`=\/\\]+/;
    const regStringValidHtmlSaved = /^(?<attrName>[^<>\s"'`=\/\\]+)$/;
    const regAttributeName = /(?<="|'|`|\s*)[^<>\s"'`=\/\\]+\s*/;

    // export const regAttrWithQuotes=/(?:\s*(?<="|'|`|\s)[^<>\s"'`=\/\\]+\s*=\s*"[^"]*")/
    const regAttrWithQuotesSaved = /^(?<attrName>[^<>\s"'`=\/\\]+)\s*=\s*"(?<attrValue>[^"]*)"$/;
    const regExpAttrWithQuotes = combineAndNoSaveRegExp(regAttributeName, /\s*=\s*/, /"[^"]*"/);

    // export const regAttrWithApostrophe=/(?:\s*(?<="|'|`|\s)[^<>\s"'`=\/\\]+\s*=\s*'[^']*')/
    const regAttrWithApostropheSaved = /^(?<attrName>[^<>\s"'`=\/\\]+)\s*=\s*'(?<attrValue>[^']*)'$/;
    const regExpAttrWithApostrophe = combineAndNoSaveRegExp(regAttributeName, /\s*=\s*/, /'[^']*'/);
    const regAttrWithBackticSaved = /^(?<attrName>[^<>\s"'`=\/\\]+)\s*=\s*`(?<attrValue>[^`]*)`$/;
    const regExpAttrWithBacktic = combineAndNoSaveRegExp(regAttributeName, /\s*=\s*/, /`[^`]*`/);

    // export const regAttrWithNoDelimiter=/(?:\s*(?<="|'|`|\s)[^<>\s"'`=\/\\]+\s*=\s*[^<>\s"'`=\/\\]+\s*)/
    const regAttrWithNoDelimiterSaved = /^(?<attrName>[^<>\s"'`=\/\\]+)\s*=\s*(?<attrValue>[^<>\s"'`=\/\\]+)$/;
    const regExpAttrWithNoDelimiter = combineAndNoSaveRegExp(regAttributeName, /\s*=\s*/, regStringValidHtml);


    const regExpAttr = createRegExpSplit(
        regExpAttrWithQuotes,
        regExpAttrWithApostrophe,
        regExpAttrWithBacktic,
        regExpAttrWithNoDelimiter,
        /\s+/
    );

    function fasteSplitHtmlString(htmlString) { //1
        return htmlString.split(regExpHtmlTagSave)
    }


    function isOpenTag(htmlTag) { // 1
        const result = regExpHtmlTagFullCapture.exec(htmlTag);
        if (!result) return null
        return result.groups.isClosingTag ? false : true
    }

    function parseAttrString(attrString) { //1
        const value = (attr, name, value) => {
            const directive = (val = value, names = name) => {
                if (attr[names]) {
                    let i = Math.round(Math.random() * 100_000_000);
                    while ((names + `<${i}>`) in attr) { i++; }
                    attr[names + `<${i}>`] = val;
                    return attr[names]
                }
                return val
            };
            if (name.startsWith("?")||name.startsWith("on")||["style","class"].includes(name)) {
                return directive()
            } else if (/^(?<name>\$[^\s</>:\[\]]+)(?:\:(?<arg>[^\s</>:\[\]]*)(\[(?<modifiers>[^\s</>\[\]]*)\])?)?(?:\<(?<index>\d+)\>)?$/.exec(name)) {
                return directive()
            }
            return isNaN(value) ? value : Number(value)
        };
        return attrString.split(regExpAttr).reduce((attr, chaine) => {
            if (/^\s*$/.test(chaine)) return attr
            let result;
            if (result = regAttrWithQuotesSaved.exec(chaine)) {
                attr[result.groups.attrName] = value(attr, result.groups.attrName, result.groups.attrValue);
            } else if (result = regAttrWithApostropheSaved.exec(chaine)) {
                attr[result.groups.attrName] = value(attr, result.groups.attrName, result.groups.attrValue);
            } else if (result = regAttrWithBackticSaved.exec(chaine)) {
                attr[result.groups.attrName] = value(attr, result.groups.attrName, result.groups.attrValue);
            } else if (result = regAttrWithNoDelimiterSaved.exec(chaine)) {
                attr[result.groups.attrName] = value(attr, result.groups.attrName, result.groups.attrValue);
            } else if (result = regStringValidHtmlSaved.exec(chaine)) {
                attr[result.groups.attrName] = "";
            }
            return attr
        }, {})
    }
    function parseHtmlTag(htmlTag) { //1
        const result = regExpHtmlTagFullCapture.exec(htmlTag);
        if (!result) return null
        const { type, attr, isAutoClose, isClosingTag } = result.groups;
        return {
            get isTagEmpty() {
                return listTagEmpty.includes(this.type)
            },
            get isTagKnown() {
                return listTagKnown.includes(this.type)
            },
            type,
            attr,
            isAutoClose,
            isClosingTag,
            htmlTag,
            props: parseAttrString(result.groups.attr),
            initType(rxRefs) {
                if (!(rxRefs instanceof TemplateRef)) throw new Error("rxRefs must be instance of RXRefs")
                const parseResult = TemplateRef.parse(this.type, rxRefs);
                if (parseResult && parseResult.value.length == 2 && parseResult.value[0].at(-1) == ":" && parseResult.value[1] instanceof Function) {
                    this.type = parseResult.value[0].slice(0, -1);
                    rxRefs.components[this.type] = parseResult.value[1];
                    // this.type = rxRefs.components[this.type]
                    return this.type
                }
                let type = TemplateRef.split(this.type, (({ index }) => rxRefs[index]));
                type = type.length === 1 ? type[0] : type.join("");
                if (typeof type != "string" && typeof type != "function") {
                    type = `${typeof type}.is-not-component-valid`;
                }
                // const componentList = Object.keys(rxRefs.components ?? {})
                // if (!isKnownElement(type) && componentList.includes(type)) {
                //     type = rxRefs.components[type]
                // }
                return this.type = type
            }
        }
    }
    function isTagEmpty(type) {
        return listTagEmpty.includes(type?.toLowerCase?.())
    }

    function rxReform(fiberList, htmlStringSplited, dataBinding) {
        while (htmlStringSplited.length) {
            const text = htmlStringSplited.shift();
            if (/^\s*$/.test(text)) continue
            if (isOpenTag(text)) {
                const fiber = parseHtmlTag(text);
                fiber.children = [];
                fiber.initType(dataBinding);
                if (!isTagEmpty(fiber.type) && !fiber.isAutoClose) {
                    getChildren(fiber, htmlStringSplited, dataBinding);
                }
                const el = new FiberOfElement(fiber.type, { ...fiber.props, children: fiber.children }, dataBinding);
                fiberList.push(el);
            } else {
                const listT = text.split(createRegExpSplit(TemplateRef.regExp, /{{[^{}]*}}/));//(/((?:\(_\|-\[RXRefs\{index:\d+,type:\w+\}\]-\|_\))|(?:{{[^{}]*}}))/)
                if (/^\s*$/.test(listT[0])) listT.shift();
                if (/^\s*$/.test(listT.at(-1))) listT.pop();
                fiberList.push(...listT.map(t => {
                    const isRef = (typeof t == "string") ? TemplateRef.parse(t, dataBinding) : t;
                    t = isRef ? isRef.value[0] : t;
                    if (typeof t != "string") return t
                    const isComment = (c) => /\s*\<\!--.*--\>\s*/.test(c);
                    if (isComment(t)) {
                        return t.split(/(\s*\<\!--.*--\>\s*)/).map(t =>isComment(t) ? document.createComment(/^\s*\<\!--(.*)--\>\s*$/.exec(t)[1]): t).filter(t => t)
                    }
                    return new FiberOfText(t, dataBinding)
                }));
            }
        }
        return fiberList
    }
    function getChildren(fiber, htmlStringSplited, dataBinding) {
        if (fiber.type instanceof Function && !fiber.type.name) return
        let count = 1;
        const index = htmlStringSplited.findIndex(e => {
            const tag = parseHtmlTag(e);
            const rcRef = TemplateRef.parse(tag ? tag.type : e, dataBinding);
            if (tag && ((rcRef && rcRef.value[0] === fiber.type) || (tag.type === fiber.type))) {
                count = tag.isClosingTag ? count - 1 : count + 1;
                if (tag.isClosingTag && count <= 0) return true
            }
            return false
        });
        if (index === -1) {
            fiber.children = htmlStringSplited.splice(0, htmlStringSplited.length).filter(e => !/^\s*$/.test(e));
        } else {
            fiber.children = htmlStringSplited.splice(0, index + 1).filter(e => !/^\s*$/.test(e));
            fiber.children.pop();
        }
        if (fiber.type == "script") {
            let innerText = fiber.children.join("");
            const res = TemplateRef.parse(innerText, dataBinding);
            if (res) {
                innerText = res.valueString;
            }
            fiber.children = [new Text(innerText)];
        } else {
            fiber.children = rxReform([], fiber.children, dataBinding);
        }
    }
    function parse(strings, ...rxRefs) {
        return [[...rxRefs.reduce((list, _str, index) => {
            list.push(strings[index], `(_|-[RXRefs{index:${index},type:${typeof rxRefs[index]}}]-|_)`);
            return list
        }, []), strings[rxRefs.length]].join(""), rxRefs]
    }

    function parseHtmlString(htmlString, rxRefs) {
        if (!(rxRefs instanceof TemplateRef)) throw new Error("rxRefs must be instance of RXRefs")
        const htmlArray = fasteSplitHtmlString(htmlString);
        const html = rxReform([], htmlArray, rxRefs);
        if (html.length == 1) {
            const el = html[0];
            return el instanceof FiberOfNode ? el : new FiberOfText(el, rxRefs)
        }
        const frag = new FiberOfFragment(html, rxRefs);
        return frag
    }

    function template(strings, ...refs) {
        let config;
        if (typeof refs[0] == "object" && refs[0]["<isStore>"] === true) {
            config = refs[0];
            refs[0] = "";
        }
        const [htmlstring] = parse(strings, ...refs);
        const rxRefs = new TemplateRef(...refs);
        const rcNode = parseHtmlString(htmlstring, rxRefs);
        if (config) {
            if (config.components && typeof config.components == "object") rcNode.components = config.components;
            if (config.directives && typeof config.directives == "object") rcNode.directives = config.directives;
        }
        return rcNode
    }

    function html(...args) {
        return createDom(template(...args))
    }
    const needCallback = (callback, args, $this) => callback.apply($this, args);
    needCallback.after = (callback, args, $this) => Promise.resolve().then(() => callback.apply($this, args));
    needCallback.idle = (callback, args, $this) => requestIdleCallback(() => callback.apply($this, args));
    //###################
    const Fragment = "FRAGMENT";
    const TextElement = "TEXT";
    function createFiber(type, props, ...children) {
        const refs = new LinksOfDataInTemplateString();
        props = props ?? { children: [] };
        children = children.map(child => child instanceof RcHtmlNode ? child : new RcHtmlText(child, refs));
        if (type == Fragment) {
            return new RcHtmlFragment(children, refs)
        }
        if (type == TextElement) {
            return new RcHtmlText(children, refs)
        }
        return new RcHtmlElement(type, { ...props, children }, refs)
    }
    createFiber.Fragment = Fragment;
    createFiber.Text = TextElement;
    //###################


    function map(state, callback) {
        const list=state instanceof RXState?[...(state.value)]:state;
        var [state,setState]=useState(state,(v)=>{
            list.splice(0,list.length,...v);
            return list
        });
        // isFunction(callback)
        const createState = (v, i) => [useState(v)[0], useState(i)[0]];
        const rendMap = (v) => callback(...v, state,(value)=>{
            const [item,index]=v;
            return setState.edit(index,value)
        });
        const listState = state.value.map(createState);
        let listElement = needCallback.after(()=>listState.map(rendMap));
        const [items, setItems] = useState(listElement);
        items.onChange(list=>needCallback.after(()=>{
            if(list instanceof Promise) return;
            if(!list.every(item=>item instanceof Node)){
                throw new Error("html.map doit retourner des list d'element Node")
            }
        }),true);
        const update = () => listState.map(([v, i], index) => needCallback.after(()=>{
            if (!i.isDestroyed) i.set(index);
            if (!v.isDestroyed) v.set(state.value[index]);
        }));
        state.onChange((val) => {
            if (listState.length > val.length) {
                const indexStart = val.length;
                const end = listState.length;
                listState.splice(indexStart, end).map(s => s.map(i => i.destroy(true)));
                setItems.splice(indexStart, end);
            } else if (listState.length < val.length) {
                const indexStart = listState.length;
                listState.push(...val.slice(indexStart).map(createState));
                listState.map(([, index], i) => index.set(i));
                setItems.push(...listState.slice(indexStart).map(rendMap));
            }
            update();
            // console.log(items.value);
        });
        return items
    }
    html.map=map;

    exports.FiberOfElement = FiberOfElement;
    exports.FiberOfFragment = FiberOfFragment;
    exports.FiberOfNode = FiberOfNode;
    exports.FiberOfText = FiberOfText;
    exports.LinksOfDataInTemplateString = TemplateRef;
    exports.RXState = RXState;
    exports.component = component;
    exports.createDom = createDom;
    exports.createFiber = createFiber;
    exports.define = define;
    exports.html = html;
    exports.render = render;
    exports.template = template;
    exports.useEffect = useEffect;
    exports.useEvent = useEvent;
    exports.useLayoutEffect = useLayoutEffect;
    exports.useMemo = useMemo;
    exports.useProps = useProps;
    exports.useRef = useRef;
    exports.useState = useState;

    return exports;

})({});
//# sourceMappingURL=rimax.global.js.map
