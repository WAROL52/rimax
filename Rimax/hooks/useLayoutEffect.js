import { RXState } from "./useState.js"

export function useLayoutEffect(callback, states = []) {
    if (!Array.isArray(states)) throw new Error("states doit être une Array")
    const listRmv = []
    let remove
    const array = [...states]
    const getValue = s => s instanceof RXState ? s.value : s
    const update=i=> remove = callback([...array.map(getValue)],i)
    array.forEach((st, i) => {
        if (st instanceof RXState) {
            listRmv.push(st.onChange(() => {update(i)}))
        }
    })
    update(-1)
    return () => {
        listRmv.splice(0,listRmv.length).map(fn => fn?.())
        if (remove instanceof Function) remove(-1, [...array].map(getValue))
    }
}