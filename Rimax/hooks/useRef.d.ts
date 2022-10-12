import { RXState } from "./indexHooks.js"

declare function useRef(callback?:(newValue?:any,oldValue?:any) =>void):RXRef
export default useRef
export declare class RXRef {
    #current
    #update = []
    constructor(current:RXState)
    get current():any
    setRef(ref:any):void
    onUpdate(callback:(newValue?:any,oldValue?:any)=>void):void
}