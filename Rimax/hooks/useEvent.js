const handlerEvent = {
    beforeDispatch: (...args) => [...args],
    afterDispatch: (data, returnValue) => [data, returnValue],
    onSubscribe: callback => callback,
    clearAfterEachDispatch:false
}
export function useEvent(handler = handlerEvent) {
    if (typeof handler !== "object") throw new Error("handler doit être un object")
    const { beforeDispatch=handlerEvent.beforeDispatch, afterDispatch=handlerEvent.afterDispatch, onSubscribe=handlerEvent.onSubscribe,clearAfterEachDispatch=handlerEvent.clearAfterEachDispatch} = handler
    const EVENTS = new Set()
    const subscribe = (callback) => {
        if (!(callback instanceof Function)) throw new Error("callback doit être un function")
        callback = onSubscribe(callback)
        if (callback instanceof Function) EVENTS.add(callback)
        return () => EVENTS.delete(callback)
    }
    return [subscribe, (data,...rest) => {
        const args = beforeDispatch(data,...rest)
        const returnValue = EVENTS.forEach(fn => fn?.(...(Array.isArray(args)?args:[args])))
        if(clearAfterEachDispatch)EVENTS.clear();
        return afterDispatch(data, returnValue)
    }]
}