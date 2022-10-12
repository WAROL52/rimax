const handlerEvent = {
    beforeDispatch: (...args:any[]) => args,
    afterDispatch: (data:any, returnValue:any[]) => [data, returnValue],
    onSubscribe: callback => callback,
    clearAfterEachDispatch:false
}
export function useEvent<D,R=any>(handler=handlerEvent)
:[(callback:(data:D)=>R)=>()=>void, <D>(data:D) => [data:D,R[]]]