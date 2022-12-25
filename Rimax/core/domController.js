import { useEvent } from "../hooks/indexHooks.js";
// import R from "../hooks/indexHooks.js";
// console.log(R);
import {RXState } from "../hooks/indexHooks.js";
const DATABASE = new WeakMap();
export function $(dom) {
  if (!(dom instanceof Node))
    throw new Error("dom doit etre un instance de Node");
  if (DATABASE.get(dom)) return DATABASE.get(dom);
  let isDestroyed = false;
  let destroyList = [];
  const [onReady, dispatchReady] = useEvent({ clearAfterEachDispatch: true });
  const [onConnected, dispatchConnected] = useEvent({clearAfterEachDispatch: true});
  let isReady = false;
  onReady(() => (isReady = true));
  const children = [...dom.childNodes];
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
      dom.style[propertyName]=value
    }
    return dom.style[propertyName]
  };
  const addClass = (className) => dom instanceof Element&&dom.classList.add(className);
  const hasClass = (className) => dom instanceof Element&&dom.classList.contains(className);
  const removeClass = (className) => dom instanceof Element&&dom.classList.remove(className);
  const toggleClass = (className) => dom instanceof Element&&dom.classList.toggle(className);
  const on = (type, value) => {
    const handler=e=>value instanceof Function&&value(e)
    dom.addEventListener(type,handler)
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
  Object.freeze(HANDLER)
  HANDLER.onConnected(() => {
    if (dom.parentNode) {
      dom.after(root);
    }
  });
  const id=setInterval(()=>{
    if(dom.parentElement){
      clearInterval(id)
      dispatchConnected(dom.parentElement);
    }
  },10)
  DATABASE.set(dom, HANDLER);
  return HANDLER;
}
export const Children={
  flat(children){
    if(Array.isArray(children)){
      return children.flat(Infinity)
    }
    throw new Error("children must be an Array")
  },
  slot(children,slotName){
    if(Array.isArray(children)){
      return children.filter(child=>{
        return child instanceof Element&&child.getAttribute("slot")===slotName
      })
    }
    throw new Error("children must be an Array")
  },
  filterByAttr(children,attrName,attrValue){
    if(Array.isArray(children)){
      if(attrValue===undefined) return  children.filter(child=>child instanceof Element&&child.getAttribute(attrName))
      return children.filter(child=>child instanceof Element&&child.getAttribute(attrName)===attrValue)
    }
    throw new Error("children must be an Array")
  }
}
