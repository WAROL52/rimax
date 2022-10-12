import { useState, RXState, useLayoutEffect, useMemo, useRef } from "../../hooks/indexHooks.js"
import { DomController } from "../domController.js"
import { TemplateRef } from "../templateRef.js"

const customeElementRegistry = {}

const regExpDirective = /^(?<directiveName>(?:[A-z][\w\-]*:)|@|#)(?<arg>[\w-]*)(?<modifiers>\[[\w\-,]*\])?$/
const directiveOption = {
    el: null,
    attrName: "",
    attrValue: "",
    directiveName: "",
    arg: "",
    modifiers: {},
    index: 0
}
export class FiberOfNode {
    #components = ({ ...customeElementRegistry })
    get components() { return this.#components }
    set components(components) {
        Object.assign(this.#components, components)
    }
    refs = new TemplateRef()
    directives = {
        $onInit({ attrValue, el} = directiveOption){
            attrValue=attrValue instanceof RXState?attrValue.value:attrValue
            if(attrValue instanceof Function){
                DomController.$(el).onCleanup=attrValue(el)
                return
            }
            console.warn("$onInit.attrValue doit être de type Function")
        },
        $shadowRoot({ attrValue, el, arg } = directiveOption) {
            const elementsCanAttachShadowRoot = ["article", "aside", "blockquote", "body", "div", "footer", "h1", "h2", "h3", "h4", "h5", "h6", "header", "main", "nav", "p", "section", "span"]
            if (elementsCanAttachShadowRoot.includes(el.localName) || el.localName.includes("-")) {
                let callback
                if (attrValue instanceof RXState) attrValue = attrValue.value
                if (attrValue instanceof Function) callback = attrValue
                const oldChildren = [...el.childNodes]
                const root = el.attachShadow({ mode: arg === "closed" ? "closed" : "open" })
                const returnValue = callback instanceof Function ? callback({ el, root, children: oldChildren }) : oldChildren
                const children = Array.isArray(returnValue) ? returnValue : [returnValue]
                el.innerHTML = ""
                root.append(...children)
            } else {
                console.warn(`l'element ${el.localName} ne suporte pas le attachShadow. Seule les element personnalisé (balise avec un tiré) et quelque element native le supporte,
                voici une liste d'element qui le support:`, elementsCanAttachShadowRoot);
            }
        },
        $attrState({ attrValue, el, setAttribute } = directiveOption) {
            let cleanup
            if (attrValue instanceof RXState) {
                const update = (name, value) => {
                    if (cleanup instanceof Function) cleanup();
                    cleanup = setAttribute(el, name, value ?? "")
                }
                return attrValue.onChange((value, oldValue) => {
                    if (value && typeof value == "object") {
                        if (oldValue && typeof oldValue == "object") {
                            const isAsOld = value.attrName === oldValue.attrName && value.attrValue === oldValue.attrValue
                            if (!isAsOld) {
                                update(value.attrName, value.attrValue ?? "")
                            }
                        } else {
                            update(value.attrName, value.attrValue ?? "")
                        }
                    } else {
                        update(value, "")
                    }
                    return cleanup
                }, true)
            }
            return setAttribute(el, attrValue, true)
        },
        $if({ attrValue, el, index, data ,arg} = directiveOption) {
            index = Math.random()
            if (typeof data.listCondition != "object") data.listCondition = {}
            const getValue = (value) => value instanceof Function ? value(el) : !!value
            const hasValidNow=()=>Object.values(data.listCondition).every(isTrue => isTrue)
            // const makeVisible = (isVisible = hasValidNow()) => el.getTextRoot()
            const makeVisible = (isVisible = hasValidNow()) =>DomController.$(el).getTextRoot()
                .then(textRef => {
                    if(!textRef.parentNode){
                        // return el.onConnected(()=>el.getTextRoot().then(()=>hasValidNow() ? textRef.after(el) : el.remove()))
                        return DomController.$(el).onConnected(()=>DomController.$(el).getTextRoot().then(()=>hasValidNow() ? textRef.after(el) : el.remove()))
                    }
                    return textRef.parentNode && isVisible ? textRef.after(el) : el.remove()
                })
            if (attrValue instanceof RXState) {
                return attrValue.onChange((value) => {
                    const v=getValue(value)
                    data.listCondition[index] =arg=="false"?!v:v
                    makeVisible()
                    return () => {
                        delete data.listCondition[index]
                        attrValue.destroy(true)
                    }
                }, true)
            } else {
                data.listCondition[index] = getValue(attrValue)
                makeVisible()
            }
            return () => data.listCondition[index] = true
        },
        $ref({ el, attrValue } = directiveOption) {
            if (attrValue instanceof RXState) {
                attrValue=attrValue.value
            }
            if (attrValue instanceof Function) {
                return attrValue(el)
            }else if (useRef.isRef(attrValue)){
                attrValue.current=el
            }
        },
        $show({ el: dom, attrValue } = directiveOption) {
            if (attrValue instanceof RXState) {
                return attrValue.onChange((isShow) => {
                    dom.hidden = !isShow
                    return () => attrValue.destroy(true)
                }, true)
            } else {
                dom.hidden = !attrValue
            }
        },
        $bind({ el, arg, modifiers, attrValue } = directiveOption) {
            const fnRmvs = []
            if (attrValue instanceof RXState) {
                fnRmvs.push(attrValue.onChange((v) => {
                    if (arg in el) {
                        el[arg] = v
                    } else {
                        el.setAttribute(arg, v)
                    }
                    return () => attrValue.destroy(true)
                }, true))
            }
            const handlerEvent = () => {
                const value = arg in el ? el[arg] : el.getAttribute(arg)
                if (attrValue instanceof RXState) attrValue.set(value)
            }
            fnRmvs.push(...Object.keys(modifiers).map(eventName => {
                el.addEventListener(eventName, handlerEvent)
                return () => el.removeEventListener(eventName, handlerEvent)
            }))
            if (Object.keys(modifiers).length == 0) {
                const eventName = ["input"].includes(el.localName) ? "input" : "change"
                el.addEventListener(eventName, handlerEvent)
                fnRmvs.push(() => el.removeEventListener(eventName, handlerEvent))
            }
            return () => fnRmvs.map(fn => fn())
        },
        $directives({ el, arg, modifiers, attrValue } = directiveOption) {
            if (attrValue instanceof RXState) attrValue = attrValue.value
            if (typeof attrValue == "object") {
                Object.assign(this, attrValue)
            }
        }
    }
    initProps(refs = this.refs) {
        if (!(refs instanceof TemplateRef)) throw new Error("refs must be an instance of RXRefs")
        const getrefs = ({ index }) => this.refs[index]
        const generateKey = (data, key) => {
            const gk = () => {
                let i = Math.round(Math.random() * 100_000_000)
                while ((key + `<${i}>`) in data) { i++ }
                key += `<${i}>`
                return key
            }
            if (key in data) {
                if (key.includes("<") && key.includes(">") && key.at(-1) == ">") {
                    const indexA = key.indexOf("<")
                    key = key.slice(0, indexA)
                }
                return gk()
            }
            return key
        }
        this.props = Object.entries(this.props).reduce((props, [attrName, value]) => {
            const originalAttrName = attrName
            const attrNameComputed = TemplateRef.parse(attrName, this.refs)
            const valueArray = typeof value == "string" ? TemplateRef.split(value ?? "", getrefs) : [value]


            if (/^\s*$/.test(valueArray[0]) && !(valueArray[0] instanceof RXState)) valueArray.shift()
            if (/^\s*$/.test(valueArray.at(-1)) && !(valueArray[0] instanceof RXState)) valueArray.pop()

            let hasValueFinal = false
            let valueFinal
            const getValue = () => {
                if (hasValueFinal) return valueFinal
                hasValueFinal = true
                if (valueArray.length == 0) {
                    valueFinal = ""
                    return ""
                }
                if (valueArray.length == 1) {
                    valueFinal = valueArray[0]
                    return valueArray[0]
                }
                const stateValue = useMemo(() => valueArray.join("") , valueArray)
                valueFinal = stateValue
                return stateValue
            }
            if (attrNameComputed) {
                let hasCallback = false
                const hasState = !!attrNameComputed.value.find(v => {
                    if (v instanceof Function) {
                        hasCallback = true
                    }
                    return v instanceof RXState
                })
                const isDirective = attrNameComputed.value[0] == "$" && attrNameComputed.value[1] instanceof Function
                const createMemo = () => useMemo(() => ({
                    attrName: attrNameComputed.value.map(v => v instanceof Function ? v.name : v instanceof RXState ? v.toString() : typeof v == "object" ? v?.constructor?.name : v).join(""),
                    attrValue: getValue()
                }), [...attrNameComputed.value])

                if (isDirective) {
                    const callback = attrNameComputed.value[1]
                    const id = Math.round(Math.random() * 1_000_000)
                    const callbackName = (callback.name[0] == "$" ? callback.name : "$" + callback.name) + "{" + id + "}"
                    this.directives[callbackName] = callback
                    let key = "$attrState"
                    key = generateKey(props, key)
                    attrNameComputed.value[0] = ""
                    attrNameComputed.value[1] = callbackName
                    const attr = createMemo()
                    props[key] = attr
                    return props
                } else if (hasState) {
                    let key = "$attrState"
                    key = generateKey(props, key)
                    const attr = createMemo()
                    props[key] = attr
                    return props
                } else if (hasCallback) {
                    const lnc = [...attrNameComputed.value] // list Name Computed
                    if (lnc[0] instanceof Function && lnc.length == 1) {
                        let key = "$onInit"
                        key = generateKey(props, key)
                        props[key] = lnc[0]
                        return props
                    } else {
                        let key = [...attrNameComputed.value].map(v => v instanceof Function ? v.name : v).join("")
                        key = generateKey(props, key)
                        props[key] = getValue()
                        return props
                    }
                } else if (attrNameComputed.value[0] instanceof Object && attrNameComputed.value.length === 1) {
                    if (value != "") return props
                    if (attrNameComputed.value[0].constructor !== Object) return props
                    Object.entries(attrNameComputed.value[0]).map(([k, v]) => {
                        k = generateKey(props, k)
                        props[k] = v
                    })
                    return props
                } else {
                    attrName = attrNameComputed.valueString
                }
            }
            let ismustState=false
            if(attrName[0]==":"){
                ismustState=true
                attrName=attrName.slice(1)
            }
            if (attrName == "children") {
                props.children = value
                return props
            }
            attrName = generateKey(props, attrName)
            props[attrName] = ismustState?useMemo(()=>getValue()):getValue()
            return props
        }, {})
    }
    constructor() {}
    type
    props
    #dom
    #parent
    get parent(){return this.#parent}
    set parent(parentFiber){
        if(!(parentFiber instanceof FiberOfNode)) throw new Error('parentFiber doit être une instance FiberOfNode')
        this.#parent=parentFiber
    }
    get dom(){
        return this.#dom
    }
    set dom(domValue){
        if(this.#dom) throw new Error("dom a déja une valeur Node ")
        if(!(domValue instanceof Node)) throw new Error("domValue doit être une instance de Node")
        this.#dom=domValue
    }
}
export { customeElementRegistry }