import { useEvent } from "../hooks/useEvent.js"
import { RXState } from "../hooks/useState.js"
const DATABASE = new Map()
function createHandler(dom) {
    if (!(dom instanceof Node)) throw new Error("dom doit etre un instance de Node")
    if (DATABASE.get(dom)) return DATABASE.get(dom)
    let isDestroyed = false
    let destroyList = []
    const [onReady, dispatchReady] = useEvent({ clearAfterEachDispatch: true })
    const [onConnected, dispatchConnected] = useEvent({ clearAfterEachDispatch: true })
    let isReady = false
    onReady(() => isReady = true)
    const $children = [...dom.childNodes]
    const textRef = new Text()
    const root = new Text()
    const fiber = null
    const getTextRoot = () => Promise.resolve().then(() => {
        if (dom.parentNode) {
            dom.after(textRef)
            dom.after(root)
        } else if (root.parentNode) {
            root.after(textRef)
        }
        return textRef
    })
    const isValid = () => { if (isDestroyed) throw new Error("cette dom est deja considerer comme detruit, donc vous ne peux plus faire cette action..."); return true }
    function onCleanUp(callback) {
        isValid()
        if (callback instanceof RXState && callback.value instanceof Function) {
            const state = callback
            callback = (...args) => {
                if (!(state.value instanceof Function)) throw new Error("state.value doit etre une function")
                state.value(...args)
            }
        } else if (Array.isArray(callback)) {
            callback.map(fn => handler.onDestroy(fn))
            return
        }
        if ((callback instanceof Function)) {
            destroyList.push(callback)
        }
    }
    const handler = Object.defineProperties({}, {
        getFiber: () => fiber,
        "onConnected": {
            get: () => isValid() && onConnected,
            set: val => isValid() && onConnected(val)
        },
        "onReady": {
            get: () => isValid() && onReady,
            set: val => isValid() && onReady(val)
        },
        "isReady": {
            get: () => isReady,
        },
        "dispatchReady": {
            get: () => isValid() && dispatchReady,
        },
        "dispatchConnected": {
            get: () => isValid() && dispatchConnected
        },
        "model": {},
        isDestroyed: {
            get() { return isDestroyed }
        },
        isClean: {
            get() { return isDestroyed }
        },
        "destroyList": { get() { return isValid() && [...destroyList] } },
        "destroy": {
            value: (withDom = false) => {
                if (dom instanceof Node && !(dom instanceof DocumentFragment)) {
                    dom.remove()
                }
                if (isDestroyed) return
                handler.destroyList.map(fn => fn instanceof Function && fn(withDom))
                isDestroyed = true
                destroyList = []
                if (dom instanceof Text && withDom) {
                    dom.data = ""
                }
                handler.$children.map(el => el instanceof Node && DomController.$(el).destroy())
            },
            writable: false
        },
        "onCleanup": {
            get() { return isValid() && onCleanUp },
            set(value) { isValid() && onCleanUp(value) }
        },
        "$children": {
            get() { return [...$children] },
            set(value) {
                value = Array.isArray(value) ? value : [value]
                $children.push(...value)
            }
        },
        getTextRoot: {
            value: getTextRoot,
            writable: false
        },
        textRef: {
            get() { return textRef }
        }

    })
    handler.onConnected(() => {
        if (dom.parentNode) {
            dom.after(root)
        }
    })
    if (dom.isConnected) {
        Promise.resolve().then(() => dispatchConnected(dom.parentElement))
    } else {
        dom.onconnected = () => {
            console.log("wala");
            dispatchConnected(dom.parentElement)
        }
    }
    DATABASE.set(dom, handler)
    return handler
}
export class DomController {
    static $(dom) {
        return createHandler(dom)
    }
    static children(...children) {
        children = children.flat(Infinity)
        return children
    }
    static getFiberOf(dom) { this.$(dom).getFiber() }
}
