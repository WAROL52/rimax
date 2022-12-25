import { useEvent } from "../hooks/useEvent"
import { RXState } from "../hooks/useState"
import { FiberOfNode } from "./RxFiber/FiberOfNode"

type ControllerAttr = {
    (): Attr[]
    (attrName: string): string
    (attrName: string, value: string): string
}
type ControllerStyle = {
    (): CSSStyleRule["style"]
    (attrName: string): string
    (attrName: string, value: string): string
}
type ControllerChildren = {
    (): Node[]
    (...childs: any[]): Node[]
}
type TypeOfClass = string | RXState<string>

declare type Controller = {
    attr: ControllerAttr
    style: ControllerStyle
    addClass: (className: TypeOfClass) => void
    hasClass: (className: TypeOfClass) => boolean
    removeClass: (className: TypeOfClass) => void
    toggleClass: (className: TypeOfClass) => void
    on: (eventName: string, callback: (e: EventTarget) => void) => (() => void)
    getFiber: () => FiberOfNode
    destroy: () => void
    get onConnected(): (handler: () => void) => (() => void)
    set onConnected(value: () => (() => void))
    get onReady(): (hadler: () => void) => (() => void)
    set onReady(value: () => (() => void))
    get isReady(): boolean
    get isCleaned(): boolean
    get isDestroyed(): boolean
    get dispatchReady(): void
    get dispatchConnected(): void
    get textRef(): Text
    get getTextRoot(): Text
}

type DomController= {
    (el: Node): Controller
    (selector: string): Controller
    (fiber: FiberOfNode): Controller
}
export declare const $:DomController
export declare module Children{
    export const flat:(children:Element[])=>Element[]
    export const slot:(children:Element[],slotName:string)=>Element[]
    export const filterByAttr:(children:Element[],attrName:string,attrValue?:any)=>Element[]
}
