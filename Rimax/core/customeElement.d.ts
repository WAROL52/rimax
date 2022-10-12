import { RXState } from "../hooks/indexHooks"

export type ComponentOption<P> = { defaultProps: P, events: [], childrenAccepted: [] }

type StateProps<P extends { [x: string]: string }> = {
    [K in keyof P]: RXState<P[K]>
}&{children:any[]}
type TypeProps<P extends object> = {
    [K in keyof P]?: P[K] | RXState<P[K]>
}
type ComponentInstance<P extends object, E extends string> = {
    el:HTMLElement,
    root:ShadowRoot|null, 
    connectedCallback:(callback:()=>void)=>()=>void,
    disconnectedCallback:(callback:()=>void)=>()=>void,
    adoptedCallback:(callback:()=>void)=>()=>void,
    mounted:(callback:(el:HTMLElement,children:any[])=>(()=>void)|void)=>()=>void,
    onCleanup:(callback:()=>void)=>()=>void,
    
}
type UseShadowRoot = boolean|{
    mode?: 'open' | "closed",
    extends?: keyof TagElement,
    delegatesFocus?: boolean,
    slotAssignment?: "manual" | "named"
}
type TagElement = HTMLElementTagNameMap & HTMLElementDeprecatedTagNameMap
export declare function define<R, P extends object, E extends string>(
    tagName: `${string}-${string}`,
    callback: (props: StateProps<P>,root:ComponentInstance<P, E>) => R,
    option?: {
        defaultProps?: P
        shadowRoot?: UseShadowRoot
    }): (props?: TypeProps<P>) => HTMLElement