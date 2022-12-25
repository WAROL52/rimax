import { useEvent, useProps, useState } from "../hooks/indexHooks.js";
import { createDom } from "./core.js";
import { $ } from "./domController.js";
const REGISTER = new WeakMap();
const options = {
  defaultProps: {},
  shadowRoot: null,
};
export function define(tagName, renderCallback, option = options) {
  const {
    defaultProps = options.defaultProps,
    shadowRoot = options.shadowRoot,
  } = option;
  const CLASSElement = class extends HTMLElement {
    static get observedAttributes() {
      return Object.keys(defaultProps);
    }
    attributeChangedCallback(name, oldV, newV) {
      const props = REGISTER.get(this).props;
      if (
        useState.isState(props[name]) &&
        props[name].toString() != newV &&
        typeof props[name].value != "object"
      ) {
        props[name].set(newV);
        console.log(name, newV);
      }
    }
    constructor(_props) {
      super();
      _props = typeof _props == "object" && _props ? _props : {};
      const handler = {
        connectedCallback: useEvent(),
        disconnectedCallback: useEvent(),
        adoptedCallback: useEvent(),
        onCleanup: [() => {}],
        mounted: useEvent({
          onSubscribe: (fn) => {
            return (...arg) => {
              const rv = fn(arg);
              if (rv instanceof Function) {
                this.onCleanup(rv);
              }
            };
          },
        }),
        props: _props,
        children: [],
      };
      REGISTER.set(this, handler);
      $(this);
      if (Array.isArray(_props.children)) {
        handler.children.push(..._props.children);
      }
      const root = option.shadowRoot
        ? this.attachShadow({
            mode: "closed" === option.shadowRoot?.mode ? "closed" : "open",
            delegatesFocus: !!option.shadowRoot?.delegatesFocus,
            slotAssignment:
              "manual" === option.shadowRoot?.slotAssignment
                ? "manual"
                : "named",
          })
        : this;
      $(root);
      const $component = Object.freeze({
        root,
        el: this,
        ...Object.entries(handler).reduce((ob, [k, v]) => {
          if (Array.isArray(v)) {
            ob[k] = v[0];
          }
          return ob;
        }, {}),
      });
      setTimeout(() => {
        Promise.resolve().then(() => {
          for (let i of this.attributes) {
            const name = i.name;
            if (useState.isState(_props[name])) {
              _props[name].set(i.value);
            } else {
              _props[name] = i.value;
            }
          }
          handler.props = useProps({ ...defaultProps, ..._props });
          handler.children.push(...this.childNodes);
          const el = renderCallback(
            { ...handler.props, children: [...handler.children] },
            $component
          );
          //   this.innerHTML = "";
          root.append(createDom(el));
          handler.mounted[1](this);
          if (this.isConnected) {
            handler.connectedCallback[1]();
          }
        });
      });
    }
    connectedCallback() {
      REGISTER.get(this).connectedCallback[1]();
    }
    disconnectedCallback() {
      REGISTER.get(this).disconnectedCallback[1]();
    }
    adoptedCallback() {
      REGISTER.get(this).adoptedCallback[1]();
    }
  };

  customElements.define(tagName, CLASSElement, {});
  return (props) => new CLASSElement({ children: [], ...props });
}
