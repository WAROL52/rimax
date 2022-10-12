import useState, { RXState } from "./useState.js"

export function useMemo(callback, states = []) {
    if (!Array.isArray(states)) throw new Error("states doit être une Array")
    const listRmv = []
    const [state,setState]=useState()
    const array = [...states]
    const getValue = s => s instanceof RXState ? s.value : s
    const update=i=> setState(callback([...array.map(getValue)],i))
    array.forEach((st, i) => {
        if (st instanceof RXState) {
            listRmv.push(st.onChange(() => {update(i)}))
        }
    })
    update(-1)
    state.onCleanup(()=>listRmv.splice(0,listRmv.length).map(fn => fn?.()))
    return state
}