import { useEvent, useProps, useState } from "../hooks/indexHooks.js"
import { createDom } from "./core.js"
import { DomController } from "./domController.js"


export function define(tagName, renderCallback, option = { defaultProps: {}, shadowRoot: null }) {
    const _defaultProps = { ...(option.defaultProps ?? {}) }
    const EVENTS = {}
    const CLASSElement = class extends HTMLElement { 
        #id = Math.random()
        static get observedAttributes() { return Object.keys(_defaultProps) }
        attributeChangedCallback(name, oldV, newV) {
            if (useState.isState(this.props[name]) && this.props[name].toString() != newV && typeof this.props[name].value != "object") {
                this.props[name].set(newV)
            }
        }
        constructor(props) {
            props = typeof props == "object" ? props : { children: [] }
            super()
            // insertEventDom(this)
            DomController.$(this)
            // this.innerHTML='<slot/>'
            props = useProps({ ..._defaultProps, ...props })
            props.children.push(...[...this.childNodes].map(c => {
                c.remove()
                insertEventDom(c)
                DomController.$(c)
                return c
            }))
            this.props = props
            Object.entries(props).map(([attrName, attrValue]) => {
                if (attrName == "children" || attrName.startsWith('$')) return;
                this.onCleanup = attrValue.onChange((val) => {
                    if (typeof val != 'object') {
                        Promise.resolve().then(() => this.setAttribute(attrName, attrValue.toString()))
                        return () => this.removeAttribute(attrName)
                    }
                    this.removeAttribute(attrName)
                }, true)
            })
            const root = option.shadowRoot && this.attachShadow({
                mode: "closed" === option.shadowRoot?.mode ? "closed" : "open",
                delegatesFocus: !!option.shadowRoot?.delegatesFocus,
                slotAssignment: "manual"// === option.shadowRoot?.slotAssignment ? "manual" : "named"
            })
            EVENTS[this.#id] = {
                connectedCallback: useEvent(),
                disconnectedCallback: useEvent(),
                adoptedCallback: useEvent(),
                onCleanup: [this.onCleanup],
                mounted: useEvent({
                    onSubscribe: (fn) => {
                        return (...arg) => {
                            const rv = fn(arg)
                            if (rv instanceof Function) {
                                this.onCleanup(rv)
                            }
                        }
                    }
                }),
            }
            const $component = Object.freeze({
                root, el: this,
                ...Object.entries(EVENTS[this.#id]).reduce((ob, [k, v]) => {
                    ob[k] = v[0]
                    return ob
                }, {})
            })
            const children = createDom(renderCallback(props, $component))
            const container = root || this
            container.append(children)
            const re = this.dispatchReady(this, children)
            EVENTS[this.#id].mounted[1](this, children)
        }
        connectedCallback(...arg) { EVENTS[this.#id].connectedCallback[1](...arg) }
        disconnectedCallback(...arg) { EVENTS[this.#id].disconnectedCallback[1](...arg) }
        adoptedCallback(...arg) { EVENTS[this.#id].adoptedCallback[1](...arg) }
    }

    customElements.define(tagName, CLASSElement, { extends: option.extends })
    return (props) => new CLASSElement({children:[],...props})
}