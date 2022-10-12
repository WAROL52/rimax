import { TemplateRef } from "../templateRef"

export declare class FiberOfNode{
    get components() :{[k:string]:()=>any}
    set components(components:object)
    readonly refs:TemplateRef
    readonly directives:object
    readonly initProps(refs:TemplateRef = this.refs):void
    readonly type:keyof HTMLElementTag|(()=>any)
    readonly type:string
    readonly props:object
    readonly dom:Element| HTMLElement|Text | DocumentFragment
    readonly createDom():Element| HTMLElement|Text | DocumentFragment
    get parent():FiberOfNode
    set parent(parent:FiberOfNode)
}
type HTMLElementTag=HTMLElementTagNameMap&HTMLElementDeprecatedTagNameMap&{"TEXT":"TEXT","FRAGMENT":"FRAGMENT"}