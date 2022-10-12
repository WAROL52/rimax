import { useProps } from "../hooks/indexHooks.js"

export function component(callback, option = { defaultProps: {}}) {
    if(typeof option!="object") throw new Error("option doit être une de type object")
    const defaultProps=option.defaultProps??{}
    if(typeof defaultProps!="object") throw new Error("option.defaultProps doit être une de type object")
    const fn=(props) => callback(useProps({...defaultProps,...props}))
    fn.defaultProps=defaultProps
    return fn
}
