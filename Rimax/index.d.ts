import { RXState } from "./Rimax/hooks/indexHooks";



export { useState,RXState,useRef, useEffect, useLayoutEffect, useProps, useEvent,useMemo } from "./Rimax/hooks/indexHooks";

export { define } from "./Rimax/core/customeElement";
export { component } from "./Rimax/core/component";
export { FiberOfElement, FiberOfText, FiberOfFragment, FiberOfNode } from "./Rimax/core/RxFiber/indexOfFiber";
export { TemplateRef as LinksOfDataInTemplateString } from "./Rimax/core/templateRef";
export declare let html: {
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
export declare function render(element: any, container?:Element| HTMLElement|Text | DocumentFragment):Promise<Element| HTMLElement|Text | DocumentFragment>
export declare function template(...args: any[]): FiberOfNode


type TagElement = HTMLElementTagNameMap & HTMLElementDeprecatedTagNameMap
type FiberOf = {
    "TEXT": FiberOfText
    "FRAGMENT": FiberOfFragment
} & { [x in keyof TagElement]: FiberOfElement<TagElement[x]> }

type HTMLElementTag = HTMLElementTagNameMap & HTMLElementDeprecatedTagNameMap & { "TEXT": FiberOfText, "FRAGMENT": FiberOfFragment }
export declare function createFiber<K extends keyof HTMLElementTag>(
    type: K,
    props?: object,
    ...children: any[]
): FiberOf[K];

export declare function createFiber<T extends string>(
    type: T,
    props?: object,
    ...children: any[]
): FiberOfElement<T>;
type CreateFiber={
    <K extends () => void>(
        type: K,
        props?: object,
        ...children: any[]
    ): FiberOfElement<K>
    ["TEXT"] = "TEXT" as const;
    ["FRAGMENT"] = "FRAGMENT" as const;
}
export declare const createFiber:CreateFiber


