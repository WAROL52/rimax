interface OnchangeOption<TypeState> {
    methode?: string;
    value?: TypeState | any
}
type TypeSet<TypeState> = {
    (value: ((state: TypeState, oldState: TypeState, option: OnchangeOption<TypeState>) => TypeState) | TypeState): void
}

type GetNumber<T extends number>={}
type GetAny<T extends any>={}
type InferGet<T>=T extends number?GetNumber<T>:GetAny<T>

type TypeGet<TypeState> = {
    <ReturnType=TypeState>(
        callback?: (state: TypeState) => ReturnType, 
        dependencyList?: RXState<any>[]
        ): ReturnType extends RXState<infer T> ? RXState<T> : RXState<ReturnType>
}&InferGet<TypeState>

type PickTypeOfArray<T extends Array<any>> = T extends Array<infer U> ? RXState<U> : never

declare class RXState<TypeState= any> {
    constructor(value: TypeState)
    static isState:(target:any)=>boolean
    get value(): TypeState
    set value(value: TypeState)
    get isDestroyed(): boolean
    get id():number
    clear(withDom?: false): void
    destroy(withDom?: true): void
    toString(): string
    valueOf(): TypeState
    onCleanup(callback: (state?: TypeState, oldState?: TypeState, option?: OnchangeOption<TypeState>) => (((state?: TypeState) => void) | void), directApply?: false): (...data: any[]) => void
    onChange(callback: (state?: TypeState, oldState?: TypeState, option?: OnchangeOption<TypeState>) => (((state?: TypeState) => void) | void), directApply?: false): (...data: any[]) => void
    onChange<T extends RXState>(
        state: T, 
        callback?: (
            state?: TypeState, 
            oldState?: TypeState, 
            option?: OnchangeOption<TypeState>
            ) => T extends RXState<infer U>?U:never): (...data: any[]) => void
    get: TypeGet<TypeState>
    set: TypeSet<TypeState>
    get isArray(): boolean
    getMap: TypeState extends Array<any> ?
        <T>(callbackfn: (item: PickTypeOfArray<TypeState>, indexOfItem: RXState<number>, items: RXState<TypeState>, setItem: TypeSet<TypeState>) => T) => RXState<T[]>
        : never
}
type PickTypeRXState<T> = T extends RXState<infer U> ? U : T

type TypeSetArray<T extends any[]>=TypeSet<T>&{
    push: T["push"]
    pop: T["pop"]
    shift: T["shift"]
    unshift: T["unshift"]
    splice: T["splice"]
    reverse: T["reverse"]
    fill: T["fill"]
    filter: T["filter"]
    slice: T["slice"]
    sort: T["sort"]
    map: T["map"]
    edit(index: number | T["findIndex"], value: T | ((currentValue: T,index:number, oldValue: T) => T)):any
    edits(index: number | T["findIndex"]|number[], value: T | ((currentValue: T,index:number, oldValue: T) => T)):any
    remove(index: number | T["findIndex"],deleteCount?:number):T[]
}

declare type useState={
    <TypeValue>(value?: TypeValue,guard?: (newState: TypeValue, oldState: TypeValue) => TypeValue): [RXState<PickTypeRXState<TypeValue>>, RXState<PickTypeRXState<TypeValue>>["set"]]
    array:<T extends RXState<any[]>|Array<any>,U extends any[]=T extends RXState<Array<infer I>>?I[]:T>(value?:T)=>[RXState<U>,TypeSetArray<U>]
    number:<T extends number|RXState<number>>(value?:T)=>[RXState<number>,TypeSet<number>]
    string:<T extends string|RXState<string>>(value?:T)=>[RXState<string>,TypeSet<string>]
    boolean:<T extends boolean|RXState<boolean>>(value?:T)=>[RXState<boolean>,TypeSet<boolean>]
    symbol:<T extends symbol|RXState<symbol>>(value?:T)=>[RXState<symbol>,TypeSet<symbol>]
    isState:(target:any)=>boolean
}

declare function useRef(callback?:(newValue?:any,oldValue?:any) =>void):RXRef

declare class RXRef {
    #current
    #update = []
    constructor(current:RXState)
    get current():any
    setRef(ref:any):void
    onUpdate(callback:(newValue?:any,oldValue?:any)=>void):void
}

declare function useEffect<T extends RXState>(
    callback: (
        valuesOfState: (T extends RXState<infer U> ? U : T)[],
        index: number,
    ) => ((
        valuesOfState: (T extends RXState<infer U> ? U : T)[],
        index: number,
    ) => void) | void,
    states?: T[]
): () => void

declare function useLayoutEffect<T extends RXState>(
    callback: (
        valuesOfState: (T extends RXState<infer U> ? U : T)[],
        index: number,
    ) => ((
        valuesOfState: (T extends RXState<infer U> ? U : T)[],
        index: number,
    ) => void) | void,
    states?: T[]
): () => void

declare function useProps<T extends object>(props?:T):{[x in keyof T]:RXState<T[x]>}

declare function useEvent<D,R=any>(handler=handlerEvent)
:[(callback:(data:D)=>R)=>()=>void, <D>(data:D) => [data:D,R[]]]

declare function useMemo<T extends RXState,R>(
    callback: (
        valuesOfState: (T extends RXState<infer U> ? U : T)[],
        index: number,
    ) =>R,
    states?: T[]
): RXState<R>

type StateProps$1<P extends { [x: string]: string }> = {
    [K in keyof P]: RXState<P[K]>
}&{children:any[]}
type TypeProps$1<P extends object> = {
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
    extends?: keyof TagElement$1,
    delegatesFocus?: boolean,
    slotAssignment?: "manual" | "named"
}
type TagElement$1 = HTMLElementTagNameMap & HTMLElementDeprecatedTagNameMap
declare function define<R, P extends object, E extends string>(
    tagName: `${string}-${string}`,
    callback: (props: StateProps$1<P>,root:ComponentInstance<P, E>) => R,
    option?: {
        defaultProps?: P
        shadowRoot?: UseShadowRoot
    }): (props?: TypeProps$1<P>) => HTMLElement

type StateProps<P extends { [x: string]: string }> = {
    [K in keyof P]?: RXState<P[K]>
}
type TypeProps<P extends object> = {
    [K in keyof P]?: P[K] | RXState<P[K]>
}
declare function component<R, P extends object, E extends string>(
    callback: (props: StateProps<P>) => R,
    option?: {
        defaultProps?: P
        events?: E[]
    }
): (props: TypeProps<P>) => R

declare class TemplateRef extends Array {
    static get regExp(): RegExp
    static get regExpSaved(): RegExp
    static get regExpSavedG(): RegExp
    static split: (chaine: string, includeResults?: boolean) => string[]
    static replaceAll: (chaine: string, value?: ((option: { input: string, index: number, type: string }) => string) | string) => string
    static parse: <T extends TemplateRef|undefined>(chaine: string, linksOfData?:T) => null | {
        index:number|string,
        type: string,
        input:string,
        value:T extends TemplateRef?TemplateRef[keyof TemplateRef ]:null,
        valueString:string,
        refs:T
    }
    constructor(...refs:any[])
    components:{[x:string]:()=>any}
}

declare class FiberOfNode$1{
    get components() :{[k:string]:()=>any}
    set components(components:object)
    readonly refs:TemplateRef
    readonly directives:object
    readonly initProps(refs:TemplateRef = this.refs):void
    readonly type:keyof HTMLElementTag$1|(()=>any)
    readonly type:string
    readonly props:object
    readonly dom:Element| HTMLElement|Text | DocumentFragment
    readonly createDom():Element| HTMLElement|Text | DocumentFragment
    get parent():FiberOfNode$1
    set parent(parent:FiberOfNode$1)
}
type HTMLElementTag$1=HTMLElementTagNameMap&HTMLElementDeprecatedTagNameMap&{"TEXT":"TEXT","FRAGMENT":"FRAGMENT"}

declare class FiberOfElement$1<K, P extends { children?: any[] }> extends FiberOfNode$1 {
    type: K
    constructor(type: K, props?: P, refs?: TemplateRef)
    components: this["refs"]["components"]
    props: P
}

declare class FiberOfFragment$1<T> extends FiberOfNode$1 {
    type:"FRAGMENT"
    constructor(children:T[], refs?:TemplateRef)
    props:{
        children:T[]
    }
}

declare class FiberOfText$1<T> extends FiberOfNode$1 {
    type:"TEXT"
    constructor(nodeValue:T,refs?:TemplateRef)
    props:{
        nodeValue:T,
        children:any[]
    }
}

declare let html: {
    (...args: any[]): HTMLElement | Text | DocumentFragment
    map: <S extends any[] | RXState<any[]>, R extends HTMLElement | Text | DocumentFragment >(
        state: S,
        render: (
            item: S extends Array<infer T> ? RXState<T> : S extends RXState<Array<infer U>> ? RXState<U> : never,
            indexOfItem: RXState<number>,
            items: S extends Array<infer T> ? RXState<T[]> : S extends RXState<Array<infer U>> ? RXState<U[]> : never,
            setItems: S extends Array<infer T> ? RXState<T[]>["set"] : S extends RXState<Array<infer U>> ? RXState<U[]>["set"] : never
        ) => R) => RXState<R[]>
}
declare function render(element: any, container?:Element| HTMLElement|Text | DocumentFragment):Promise<Element| HTMLElement|Text | DocumentFragment>
declare function template(...args: any[]): FiberOfNode


type TagElement = HTMLElementTagNameMap & HTMLElementDeprecatedTagNameMap
type FiberOf = {
    "TEXT": FiberOfText
    "FRAGMENT": FiberOfFragment
} & { [x in keyof TagElement]: FiberOfElement<TagElement[x]> }

type HTMLElementTag = HTMLElementTagNameMap & HTMLElementDeprecatedTagNameMap & { "TEXT": FiberOfText, "FRAGMENT": FiberOfFragment }
type CreateFiber={
    <K extends () => void>(
        type: K,
        props?: object,
        ...children: any[]
    ): FiberOfElement<K>
    ["TEXT"] = "TEXT" as const;
    ["FRAGMENT"] = "FRAGMENT" as const;
}
declare function createFiber<K extends keyof HTMLElementTag>(
    type: K,
    props?: object,
    ...children: any[]
): FiberOf[K];

declare function createFiber<T extends string>(
    type: T,
    props?: object,
    ...children: any[]
): FiberOfElement<T>;
declare const createFiber:CreateFiber

export { FiberOfElement$1 as FiberOfElement, FiberOfFragment$1 as FiberOfFragment, FiberOfNode$1 as FiberOfNode, FiberOfText$1 as FiberOfText, TemplateRef as LinksOfDataInTemplateString, RXState, component, createFiber, define, html, render, template, useEffect, useEvent, useLayoutEffect, useMemo, useProps, useRef, useState };
