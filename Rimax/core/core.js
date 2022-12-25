import { useEvent, RXState } from "../hooks/indexHooks.js";
import { $ } from "./domController.js";
import { getStack } from "./rxError.js";

import {
  FiberOfElement,
  FiberOfFragment,
  FiberOfNode,
  FiberOfText,
} from "./RxFiber/indexOfFiber.js";
import { TemplateRef } from "./templateRef.js";

const needCallback = (callback, args, $this) => callback.apply($this, args);
needCallback.after = (callback, args, $this) =>
  Promise.resolve().then(() => callback.apply($this, args));
needCallback.idle = (callback, args, $this) =>
  requestIdleCallback(() => callback.apply($this, args));

function createElement(fiber) {
  const sendListOfDom = (list) =>
    list.flat(Infinity).map((child) => createDom(child));
  if (fiber instanceof Node) return fiber;
  if (fiber instanceof FiberOfNode && fiber.dom instanceof Node)
    return fiber.dom;
  if (fiber instanceof FiberOfFragment) {
    return sendListOfDom(fiber.props.children);
  }
  if (fiber instanceof FiberOfText) {
    if (Array.isArray(fiber.props.nodeValue)) {
      return sendListOfDom(fiber.props.nodeValue);
    }
    return fiber.props.nodeValue instanceof Node
      ? fiber.props.nodeValue
      : new Text(fiber.props.nodeValue);
  }
  if (fiber instanceof FiberOfElement) {
    if (fiber.components[fiber.type] instanceof Function) {
      const component = fiber.components[fiber.type];
      fiber.type = component;
    }
    if (fiber.type instanceof Function) {
      let props = fiber.props;
      if (typeof fiber.type.defaultProps == "object")
        props = { ...fiber.type.defaultProps, ...props };
      const el = fiber.type(props);
      return createDom(el);
    }
    return document.createElement(fiber.type);
  }
  if (Array.isArray(fiber)) {
    return sendListOfDom(fiber);
  }
  if (fiber instanceof Function) {
    let props = { children: [] };
    if (typeof fiber.defaultProps == "object")
      props = { ...fiber.defaultProps, children: [] };
    return createDom(fiber(props));
  }
  if (fiber instanceof RXState) {
    return createDom(new FiberOfText(fiber, new TemplateRef()));
  }
  try {
    return new Text(JSON.stringify(fiber));
  } catch (error) {
    return new Text(fiber);
  }
}
function initProps(dom, fiber) {
  if (!(dom instanceof Node)) throw new Error("dom doit etre un element node");
  if (!(dom instanceof HTMLElement)) return null;
  if (fiber && fiber.type instanceof Function) return null;
  if (!(fiber instanceof FiberOfElement)) return null;
  const globalData = {};
  const counterName = {};

  const setOneAttribute = (
    props,
    [attrName, attrValue],
    dom,
    listOnCleanup = []
  ) => {
    const setAttribute = (value, domEl = dom, attrN = attrName) => {
      if (/^\s*$/.test(attrN)) return;
      if (domEl instanceof HTMLSelectElement && ["multiple"].includes(attrN)) {
        domEl.multiple = true;
      } else if (["disabled", "hidden"].includes(attrN)) {
        // console.log(value);
        // domEl.setAttribute(attrN,"")
        return (domEl[attrN] = value === "" ? true : value);
      } else if (
        attrN in domEl ||
        ["object", "function"].includes(typeof value)
      ) {
        if (typeof value == "object" && typeof domEl[attrN] == "object")
          return Object.assign(domEl[attrN], value);
        return (domEl[attrN] = value);
      }
      domEl.setAttribute(attrN, value);
    };
    const setAttr = (el, attrName, attrValue) => {
      const listrmv = [];
      setOneAttribute(props, [attrName, attrValue], el, listrmv);
      return () =>
        needCallback(() =>
          listrmv.map((fn) => fn instanceof Function && fn() /** */)
        );
    };
    const rendAttribute = (update, onRemove) => {
      const redOneStyle = (value) => {
        if (value instanceof RXState) {
          // dom.onCleanup = value.onChange((val, oldVal) => {
          $(dom).onCleanup(
            value.onChange((val, oldVal) => {
              update(val, oldVal);
              return () => value.destroy();
            }, true)
          );
        } else {
          update(value);
        }
      };
      if (Array.isArray(attrValue)) {
        attrValue.map((val) => redOneStyle(val));
      } else {
        redOneStyle(attrValue);
      }
      $(dom).onCleanup(() => onRemove instanceof Function && onRemove());
    };
    const toClean = () => null;
    let cleanup = toClean;
    let resultReg;
    const rcState = attrValue;
    const originalAttrName = attrName;
    const res = /^([^<>]+)<\d+>$/.exec(attrName);
    if (res) {
      attrName = res[1];
    }
    if (attrName == "children" || !(fiber instanceof FiberOfElement))
      return props;
    if (typeof attrName != "string") return props;

    if (attrName && (attrName.startsWith("on") || attrName.startsWith("@"))) {
      let type = attrName
        .slice(attrName.startsWith("on") ? 2 : 1)
        .toLowerCase();
      if (type.indexOf("<") > -1) {
        type = type.slice(0, type.indexOf("<"));
      }
      const applyCallback = (fn, args = []) => {
        if (fn instanceof RXState) {
          fn = fn.isDestroyed ? () => null : fn.value;
        }
        return fn(...args);
      };
      const callback = (...args) => {
        if (Array.isArray(attrValue)) {
          return attrValue.map((fn) => applyCallback(fn, args));
        }
        applyCallback(attrValue, args);
      };
      let removeEv = () => dom.removeEventListener(type, callback);
      $(dom).onCleanup(removeEv);
      // dom.onDestroy(removeEv)
      dom.addEventListener(type, callback);
      cleanup = () => removeEv;
      return props;
    } else if (attrName[0] == ".") {
      const oldValue = dom[attrName.slice(1)];
      dom[attrName.slice(1)] = attrValue;
      cleanup = () => (dom[attrName.slice(1)] = oldValue);
      return props;
    } else if (
      (resultReg =
        /^(?<name>(?:\$|\:)[^\s</>\:\[\]]+)(?:\:(?<arg>[^\s</>:\[\]]*)(\[(?<modifiers>[^\s</>\[\]]*)\])?)?(?:\<(?<index>\d+)\>)?$/.exec(
          attrName
        ))
    ) {
      const { name, arg, modifiers } = resultReg.groups;
      counterName[name] = name in counterName ? counterName[name] + 1 : 0;
      if (fiber.directives[name] instanceof Function) {
        let index = counterName[name];
        const directivesMustSync = ["$ref"];
        const callback = directivesMustSync.includes(name)
          ? needCallback
          : needCallback.after;
        callback(() => {
          if (!globalData[name]) globalData[name] = {};
          const rmv = fiber.directives[name]({
            setAttribute: setAttr,
            globalData,
            data: globalData[name],
            el: dom,
            attrName,
            attrValue,
            index: index ? Number(index) : 0,
            directiveName: name,
            arg,
            modifiers:
              modifiers?.split(",").reduce((data, modif) => {
                data[modif] = true;
                return data;
              }, {}) || {},
          });
          if (rmv instanceof Function) {
            // dom.onDestroy(rmv)
            $(dom).onCleanup(rmv);
            cleanup = rmv;
            listOnCleanup.push(cleanup);
          }
        });
      }
      return props;
    } else if (
      ["input", "select", "textarea"].includes(dom.localName) &&
      ["value", "checked"].includes(attrName) &&
      rcState instanceof RXState
    ) {
      if (
        ["select"].includes(dom.localName) &&
        dom instanceof HTMLSelectElement
      ) {
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
      const rmv = (e) =>
        needCallback.after(() => {
          if (["checkbox"].includes(e.target.type)) {
            return rcState.set(e.target.checked);
          }
          return rcState.set(e.target[attrName]);
        });
      dom.addEventListener("input", rmv);
      cleanup = () => {
        dom.removeEventListener("input", rmv);
        dom.value = "";
      };
      // dom.onDestroy(cleanup)
      $(dom).onCleanup(cleanup);
    } else if (attrName == "style" || /^style<\d+>/.test(attrName)) {
      const styleDefault = dom.style.cssText;
      const rendStyle = (value) =>
        needCallback.after(() => {
          if (value instanceof Object) {
            Object.assign(dom.style, value);
          } else {
            dom.style.cssText += value;
          }
        });
      rendAttribute(rendStyle, () => rendStyle(styleDefault));
      return props;
    } else if (attrName == "class" || /^class\<\d+\>/.test(attrName)) {
      const styleDefault = dom.getAttribute("class");

      const rendClass = (value, oldValue) =>
        needCallback.after(() => {
          const addValue = (_value) =>
            String(_value)
              .split(" ")
              .map((val) => val && dom.classList.add(val));
          const removeValue = (_value) =>
            String(_value)
              .split(" ")
              .map((val) => val && dom.classList.remove(val));
          Array.isArray(oldValue)
            ? oldValue.map((val) => removeValue(val))
            : removeValue(oldValue);
          Array.isArray(value)
            ? value.map((val) => addValue(val))
            : addValue(value);
        });
      rendAttribute(rendClass, () => rendClass(styleDefault));
      return props;
    } else if (attrName && attrName.startsWith("?")) {
      attrName = /^([^<>]+)\<\d+\>/.test(attrName)
        ? attrName.slice(0, attrName.indexOf("<"))
        : attrName;
      if (!attrValue) return props;
      let rmvAttr; //=setAttr(dom,attrName.slice(1),"")
      const insertAttr = (value) => {
        const inertAttr = (v) => setAttr(dom, attrName.slice(1), v);
        if (typeof attrValue == "object") {
          const { when, value: val } = value;
          if (when instanceof RXState) {
            let rmAt;
            return when.onChange((isTrue) => {
              if (isTrue) {
                if (!rmAt)
                  rmAt = inertAttr(val instanceof RXState ? val.get() : val);
              } else {
                if (rmAt) rmAt();
                rmAt = null;
              }
              return () => rmAt && rmAt();
            }, true);
          } else {
            if (when) return inertAttr(val);
          }
        } else {
          return inertAttr(value);
        }
      };
      if (attrValue instanceof RXState) {
      } else {
        rmvAttr = insertAttr(attrValue);
      }

      const rmv = () => rmvAttr();
      if (rmv instanceof Function) {
        dom.onDestroy(rmv);
        cleanup = rmv;
        listOnCleanup.push(cleanup);
      }
      return props;
    }
    if (attrValue instanceof RXState) {
      const state = attrValue;
      const clean = state.onChange((v) => {
        setAttribute(v);
        return () => {
          state.destroy(true);
          dom.removeAttribute(attrName);
        };
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
    return props;
  };
  Object.entries(fiber.props).reduce(
    (props, [attrName, attrValue]) =>
      setOneAttribute(props, [attrName, attrValue], dom),
    {}
  );
}
const updateArray = {
  set(valueOfState, oldValueOfState, { methode, value, textRef, listElement }) {
    if (!Array.isArray(listElement))
      throw new Error("listElement doit être une Array");
    if (!Array.isArray(valueOfState))
      throw new Error("valueOfState doit être une Array");
    textRef.$firstElement = listElement[0];
    if (valueOfState.every((v) => v instanceof Node)) {
      const listDom = [];
      listElement
        .splice(
          0,
          listElement.length,
          ...valueOfState.map((item, indexItem) => {
            const dom = createDom(item);
            if (indexItem == 0) {
              if (textRef.$firstElement !== dom) {
                textRef.$firstElement = dom;
                textRef.after(dom);
              }
            } else if (listElement[indexItem] !== dom) {
              listDom.at(-1).after(dom);
            } else {
            }
            listDom.push(dom);
            return dom;
          })
        )
        .map((e) => !listElement.find((_e) => _e === e) && $(e).destroy(true));
    } else {
      listElement
        .splice(
          0,
          listElement.length,
          ...valueOfState.map((v) => {
            const dom = createDom(v);
            textRef.before(dom);
            return dom;
          })
        )
        .map((e) => $(e).destroy());
    }
  },
};
function updateDataBinding(state, textDom, dom, listElement) {
  const remove = state.onChange(
    (valueOfState, oldValueOfState, { methode, value, ...option }) => {
      oldValueOfState instanceof Node &&
        valueOfState !== oldValueOfState &&
        oldValueOfState.destroy(true);

      if (valueOfState instanceof Node) {
        listElement
          .splice(0, listElement.length)
          .map((el) => el instanceof Node && el.destroy());
        textDom.data = "";
        needCallback.idle(() => textDom.after(valueOfState));
        listElement.push(valueOfState);
      } else {
        textDom.data = valueOfState;
        if (Array.isArray(valueOfState)) {
          textDom.data = "";
          const args = [
            valueOfState,
            oldValueOfState,
            { ...option, methode, value, listElement, textRef: textDom },
          ];
          needCallback.after(() => {
            if (updateArray[methode] instanceof Function) {
              updateArray[methode](...args);
            } else {
              updateArray.set(...args);
            }
          });
        } else if (valueOfState instanceof FiberOfNode) {
          textDom.data = "";
          let isUpdate = true;
          // console.log(isUpdate);
          listElement
            .splice(0, listElement.length)
            .map((el) => el instanceof Node && el.destroy());
          isUpdate = false;
          const el = createDom(valueOfState);
          listElement.push(el);
          el.onDestroy(() => listElement.length && remove());
          let isRended = false;
          const putAfter = (elRef, elTarget, isforced = false) => {
            if (isRended && !isforced) return true;
            if (elRef.parentNode) {
              elRef.after(elTarget);
              isRended = true;
              return true;
            }
            return false;
          };

          const rendLater = () => {
            putAfter(textDom, el);
            if (!isRended) return requestIdleCallback(rendLater);
          };
          requestIdleCallback(rendLater);
          textDom.onConnected((p) => {
            if (p instanceof Node && textDom.parentNode !== p) {
              p.append(textDom);
              return putAfter(textDom, el, true);
            }
            putAfter(textDom, el);
          });
        } else if (typeof valueOfState == "object") {
          try {
            textDom.data = JSON.stringify(valueOfState, null, 20);
          } catch (error) {}
        }
      }
      return (withDom = true) => {
        textDom.data = "";
        listElement.map((dom) => dom.destroy(withDom));
        if (oldValueOfState instanceof Node) {
          oldValueOfState.destroy();
        }
        if (withDom) {
          textDom.remove();
          state.destroy(true);
        }
      };
    },
    true
  );
  // dom.onDestroy(remove)
  $(dom).onCleanup(remove);
}
function bindData(textDom, textFiber) {
  if (!(textFiber.props.nodeValue instanceof RXState)) return textDom;
  let state = textFiber.props.nodeValue;
  const dom = Array.isArray(state.value) ? new DocumentFragment() : textDom;
  textFiber.dom = dom;
  // insertEventDom(dom)
  if (Array.isArray(state.value)) dom.append(textDom);

  if (!(textDom instanceof Text))
    throw new Error("textDom doit être une instance de Text");
  // if (!(textDom.onDestroy instanceof Function)) throw new Error("textDom.onDestroy doit être une fonction")

  let listElement = [];
  // updateDataBinding(state, textDom, dom, listElement)
  needCallback.after(() => updateDataBinding(state, textDom, dom, listElement));

  return dom;
}
function insertEventDom(dom) {
  console.warn(123);
  throw new Error(
    "the function insertEventDom is deprecied..., Please use insertEventDom.$(dom)"
  );
  if (!(dom instanceof Node))
    throw new Error("dom doit etre un instance de Node");
  if (dom.destroy instanceof Function) return;
  useEvent;
  let isDestroyed = false;
  let destroyList = [];
  const [onReady, dispatchReady] = useEvent({ clearAfterEachDispatch: true });
  const [onConnected, dispatchConnected] = useEvent({
    clearAfterEachDispatch: true,
  });
  let isReady = false;
  onReady(() => (isReady = true));
  const $children = [...dom.childNodes];
  const textRef = new Text();
  const root = new Text();
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
  Object.defineProperties(dom, {
    onConnected: {
      get: () => onConnected,
      set: (val) => onConnected(val),
    },
    onReady: {
      get: () => onReady,
      set: (val) => onReady(val),
    },
    isReady: {
      get: () => isReady,
    },
    dispatchReady: {
      get: () => dispatchReady,
    },
    dispatchConnected: {
      get: () => dispatchConnected,
    },
    model: {},
    isDestroyed: {
      get() {
        return isDestroyed;
      },
    },
    isClean: {
      get() {
        return isDestroyed;
      },
    },
    destroyList: {
      get() {
        return [...destroyList];
      },
    },
    onDestroy: {
      value: (callback) => {
        if (callback instanceof RXState && callback.value instanceof Function) {
          const state = callback;
          callback = (...args) => {
            if (!(state.value instanceof Function))
              throw new Error("state.value doit etre une function");
            state.value(...args);
          };
        } else if (Array.isArray(callback)) {
          callback.map((fn) => dom.onDestroy(fn));
          return;
        }
        if (callback instanceof Function) {
          destroyList.push(callback);
        }
      },
      writable: false,
    },
    destroy: {
      value: (withDom = false) => {
        if (dom instanceof Node && !(dom instanceof DocumentFragment)) {
          dom.remove();
        }
        if (isDestroyed) return;
        dom.destroyList.map((fn) => fn(withDom));
        isDestroyed = true;
        destroyList = [];
        if (dom instanceof Text && withDom) {
          dom.data = "";
        }
        dom.$children.map((el) => el instanceof Node && el.destroy());
      },
      writable: false,
    },
    onCleanup: {
      get() {
        return dom.onDestroy;
      },
      set(value) {
        dom.onDestroy(value);
      },
    },
    $children: {
      get() {
        return $children;
      },
      set(value) {
        value = Array.isArray(value) ? value : [value];
        $children.push(...value);
      },
    },
    getTextRoot: {
      value: getTextRoot,
      writable: false,
    },
    textRef: {
      get() {
        return textRef;
      },
    },
  });
  dom.onConnected(() => {
    if (dom.parentNode) {
      dom.after(root);
    }
  });
}

const listOfTagPriority = ["style", "link"];
const isRendPriority = (element, container) => {
  if (listOfTagPriority.includes(String(element?.type).toLowerCase()))
    return true;
  if (listOfTagPriority.includes(container.localName)) return true;
};
function createTextRef(container) {
  if (!(container instanceof Node))
    throw new Error("container doit être de type Node");
  const txtRef = new Text("");
  if (container.shadowRoot) {
    container.shadowRoot.append(txtRef);
  } else {
    container.append(txtRef);
  }
  return txtRef;
}
export function render(element, container = document.body) {
  if (typeof container == "string")
    container = document.querySelector(container);
  if (!(container instanceof Node))
    throw new Error("container doit être de type Node");
  let returnDom;
  const txtRef = createTextRef(container);
  function appendChild(dom) {
    if (Array.isArray(dom)) {
      returnDom = dom.map((child) => render(child, container));
      return returnDom;
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
    if (returnDom) return returnDom;
    if (!(container instanceof Node))
      throw new Error("container doit etre un instance de Node");
    // const dom = await needCallback.after(() => createDom(element))
    const dom = createDom(element)
    appendChild(dom);
    return returnDom;
  }
  if (isRendPriority(element, container)) {
    const dom = createDom(element);
    appendChild(dom);
  }
  return init();
}

export function createDom(fiber) {
  if (fiber instanceof FiberOfNode && fiber.dom instanceof Node) {
    throw new Error(
      "fibre a déja une instance dom, fais une copie du fibre si vous voulez une autre instance"
    );
  }
  if (Array.isArray(fiber)) {
    // fiber=new FiberOfFragment(fiber)
    return fiber.flat(Infinity).map((child) => createDom(child));
  } else if (fiber instanceof Function) {
    fiber = new FiberOfElement(fiber, { children: [] });
  } else if (
    !(fiber instanceof EventTarget) &&
    !(fiber instanceof FiberOfNode)
  ) {
    fiber = new FiberOfText(fiber);
  }
  const dom = createElement(fiber);
  if (
    fiber instanceof FiberOfNode &&
    dom instanceof Node &&
    !(dom.fiber instanceof FiberOfNode)
  ) {
    Object.defineProperty(dom, "fiber", {
      get: () => fiber,
    });
  }

  const createChild = (childDom) => {
    // insertEventDom(childDom)
    // const handlerDom=$(childDom)
    if (fiber instanceof Node) return childDom;
    if (fiber instanceof FiberOfText && RXState.isState(fiber.props.nodeValue))
      return bindData(childDom, fiber);
    if (fiber && fiber.type instanceof Function) return childDom;
    const rending = [];
    if (fiber instanceof FiberOfNode) {
      fiber.dom = childDom;
      if (!fiber.props.children) return childDom;
      rending.push(
        ...fiber.props.children.flat(Infinity).map((child) => {
          if (typeof fiber.components != "object") {
            console.warn("fiber.component doit être une object");
            fiber.components = {};
          }
          if (child instanceof FiberOfNode) {
            child.parent = fiber;
            Object.assign(child.directives, fiber.directives);
            child.components = fiber.components;
          }
          return render(child, childDom);
        })
      );
    }
    Promise.all(rending).then((children) => {
      initProps(childDom, fiber);
      needCallback.after(() => $(childDom).dispatchReady(childDom, children));
    });
    return childDom;
  };
  if (Array.isArray(dom)) {
    if (fiber.parent instanceof FiberOfNode) {
      return dom;
    }
    const doc = new DocumentFragment();
    // insertEventDom(doc)
    // $(doc).$children = dom
    // doc.$children = dom
    doc.append(...dom);
    return doc;
  }
  return createChild(dom);
}
