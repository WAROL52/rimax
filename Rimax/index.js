export { createDom, render } from "./core/core.js";
export {component} from "./core/component.js";
export { useState, RXState,useRef,useEffect,useLayoutEffect,useProps,useEvent,useMemo } from "./hooks/indexHooks.js";
export {define} from "./core/customeElement.js";
export { TemplateRef as LinksOfDataInTemplateString } from "./core/templateRef.js";
export {FiberOfElement,FiberOfFragment,FiberOfNode,FiberOfText} from "./core/RxFiber/indexOfFiber.js";
export { template } from "./core/RcHtmlString/RcHtmlString.js";
export {$,Children} from "./core/domController.js"

import { createDom, } from "./core/core.js";
import { useState,RXState} from "./hooks/indexHooks.js";
import { template } from "./core/RcHtmlString/RcHtmlString.js";


export function html(...args) {
    return createDom(template(...args))
}
const needCallback = (callback, args, $this) => callback.apply($this, args)
needCallback.after = (callback, args, $this) => Promise.resolve().then(() => callback.apply($this, args))
needCallback.idle = (callback, args, $this) => requestIdleCallback(() => callback.apply($this, args))
//###################
const Fragment = "FRAGMENT"
const TextElement = "TEXT"
export function createFiber(type, props, ...children) {
    const refs = new LinksOfDataInTemplateString()
    props = props ?? { children: [] }
    children = children.map(child => child instanceof RcHtmlNode ? child : new RcHtmlText(child, refs))
    if (type == Fragment) {
        return new RcHtmlFragment(children, refs)
    }
    if (type == TextElement) {
        return new RcHtmlText(children, refs)
    }
    return new RcHtmlElement(type, { ...props, children }, refs)
}
createFiber.Fragment = Fragment
createFiber.Text = TextElement
//###################


function map(state, callback) {
    const list=state instanceof RXState?[...(state.value)]:state
    var [state,setState]=useState(state,(v)=>{
        list.splice(0,list.length,...v)
        return list
    })
    // isFunction(callback)
    const createState = (v, i) => [useState(v)[0], useState(i)[0]]
    const rendMap = (v) => callback(...v, state,(value)=>{
        const [item,index]=v
        return setState.edit(index,value)
    })
    const listState = state.value.map(createState)
    let listElement = needCallback.after(()=>listState.map(rendMap))
    const [items, setItems] = useState(listElement)
    items.onChange(list=>needCallback.after(()=>{
        if(list instanceof Promise) return;
        if(!list.every(item=>item instanceof Node)){
            throw new Error("html.map doit retourner des list d'element Node")
        }
    }),true)
    const update = () => listState.map(([v, i], index) => needCallback.after(()=>{
        if (!i.isDestroyed) i.set(index);
        if (!v.isDestroyed) v.set(state.value[index]);
    }))
    state.onChange((val) => {
        if (listState.length > val.length) {
            const indexStart = val.length
            const end = listState.length
            listState.splice(indexStart, end).map(s => s.map(i => i.destroy(true)))
            setItems.splice(indexStart, end)
        } else if (listState.length < val.length) {
            const indexStart = listState.length
            listState.push(...val.slice(indexStart).map(createState))
            listState.map(([, index], i) => index.set(i))
            setItems.push(...listState.slice(indexStart).map(rendMap))
        }
        update()
        // console.log(items.value);
    })
    return items
}
html.map=map
