import useState from "./useState.js";

export function useProps(props = {}) {
    if(typeof props !="object") throw new Error("props doit être une object")
    return {
        ...Object.entries(props).reduce((prop, [key, value]) => ({ ...prop, [key]: (key === "children" || key.startsWith("$"))? value :useState.isState(value) ?value : useState(value)[0] }), {})
    }
}