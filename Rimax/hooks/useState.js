const guardFn = v => v
const stateSymbol = Symbol("$$State")
const isState = ((ref) => (typeof ref == "object") && stateSymbol === ref[".rxType"]).bind()
export class RXState {
    get isArray() { return Array.isArray(this.value) }
    toString() { return String(this.value) }
    valueOf() { return this.value }
    get [".rxType"]() { return stateSymbol }
    static isState = isState
}
function createState(value, guard) {
    let currentValueOfState
    let oldValueOfState
    let isDestroyed = false
    let subscriber=0
    const ID = Math.random()
    const GUARDS = []
    const DESTROY_EVENTS = new Set()
    const UPDATE_EVENTS = new Set()
    const ACTIONS={}
    const dispatchUpdate = (option) => { UPDATE_EVENTS.forEach(fn =>fn(currentValueOfState, oldValueOfState, option)) }
    
    return Object.freeze(new (class rxState extends RXState {
        get guards() { return [...GUARDS] }
        get isDestroyed() { return isDestroyed }
        get id() { return ID }
        get len() { return {onChange:UPDATE_EVENTS.size,onCleanup:DESTROY_EVENTS.size,subscriber} }
        addGuard(guard) {
            if (!(guard instanceof Function)) return () => undefined
            const callback = (...a) => guard(...a)
            const lastIndex = GUARDS.push(callback) - 1
            let isRemoved = false
            return () => {
                if (isRemoved) return true
                if (GUARDS[lastIndex] === callback) {
                    GUARDS.splice(lastIndex, 1)
                    isRemoved = true
                    return true
                }
                const i = GUARDS.find(fn => fn === callback)
                if (i > -1) {
                    GUARDS.splice(i, 1)
                    return true
                }
                return false
            }
        }

        clear(withDom = false) {
            DESTROY_EVENTS.forEach(fn => fn(withDom))
            DESTROY_EVENTS.clear()
            UPDATE_EVENTS.clear()
        }
        destroy(withDom = true) {
            if (isDestroyed) return;
            this.clear(withDom)
            isDestroyed = true
        }

        onChange = ((callbackOrState, directApply = false) => {
            if (callbackOrState instanceof RXState) {
                const callback = directApply instanceof Function ? directApply : v => v
                const state=callbackOrState
                subscriber++
                let isRemoved
                return this.onChange((...args) =>{
                    state.set(() => callback(...args), ...args.slice(1))
                    return ()=>{
                        if(isRemoved) return
                        isRemoved=true
                        subscriber--
                    }
                }, true)
            }
            if (!(callbackOrState instanceof Function)) throw new Error("callback doit être une fonction")
            const on = {
                dispatch: callbackOrState, destroy: directApply ? callbackOrState(this.value, undefined, { methode: "set", value: this.value }) : undefined
            }
            const onDispatch = (...arg) => on.destroy = on.dispatch(...arg)
            let isCalled = false
            const destroy = (...arg) => {
                if (isCalled) return
                isCalled = true
                if (on.destroy instanceof Function) on.destroy(...arg);
                DESTROY_EVENTS.delete(destroy)
                UPDATE_EVENTS.delete(onDispatch)
            }
            UPDATE_EVENTS.add(onDispatch)
            DESTROY_EVENTS.add(destroy)
            return destroy
        }).bind()
        onCleanup = ((callback) => {
            if (!(callback instanceof Function)) throw new Error("callback doit être une fonction")
            const fn=(...args)=>callback(...args)
            DESTROY_EVENTS.add(fn)
            return () => DESTROY_EVENTS.delete(callback)
        }).bind()


        get oldValue() { return oldValueOfState }

        constructor(value, guard = v => v) {
            super()
            Object.defineProperty(this, "value", {
                get: (() => currentValueOfState).bind(),
                set: ((value) => this.set(value)).bind(),
                enumerable: true,
            })
            if(guard&& typeof guard =="object"){
                Object.assign(ACTIONS,guard.actions??{})
                guard=guard.guard??(v => v)
            }
            if (!(guard instanceof Function)) throw new Error("guard doit être une fonction")
            currentValueOfState = value
            GUARDS.push(guard)
            const toValidate = (value, oldValue = oldValueOfState, option = {}) => {
                const oldValues = []
                return GUARDS.reduceRight((val, guardFn) => {
                    oldValues.push(val)
                    return guardFn(val, oldValue, option, [...oldValues])
                }, value)
            }
            if (!(value instanceof Promise)) {
                currentValueOfState = toValidate(value, undefined, {})
            }
            const createStateComputed = (callback = () => currentValueOfState, dependencies = [], guard = v => v) => {
                if (!(callback instanceof Function)) throw new Error("callback doit être une function")
                if (isDestroyed) throw new Error("cette Etat ne peut plus etre utiliser car elle est deja detruit")
                const optDependencies=(dependencies&&!Array.isArray(dependencies)&&typeof dependencies=="object")?dependencies:{}
                dependencies=Array.isArray(dependencies)?dependencies:optDependencies.dependencies??[]
                if (!Array.isArray(dependencies)) throw new Error("dependencies doit être une Array")
                const update = (option = {}) => callback(currentValueOfState, oldValueOfState, option)
                const optionState={guard,...optDependencies}
                const [state, setState] = useState(update(), optionState)
                if(optionState.guard!==guard)state.addGuard(guard);
                const states = [this, ...dependencies]
                const listrmv = states.map(st => {
                    if (st instanceof RXState) {
                        return st.onChange((_1, _2, option) => {
                            setState(update(option), option)
                            return () => !state.isDestroyed && state.destroy(true)
                        })
                    }
                })
                state.onCleanup(() => listrmv.map(fn => fn instanceof Function && fn()))
                return state
            }
            this.get = ((callback = () => this.value, dependencies = []) => createStateComputed(callback, dependencies)).bind()
            Object.entries(stateType).map(([type, fnGuard]) => this.get[type] = (callback = () => this.value, dependencies = []) => createStateComputed(callback, dependencies, fnGuard))
            this.set = ((value, option = { methode: "set", value: value }) => {
                if (isDestroyed) throw new Error("cette Etat ne peut plus etre utiliser car elle est deja detruit")
                if (typeof option != "object") throw new Error("option doit être un object")
                if (value instanceof Promise) {
                    return value.then(v => this.set(v))
                }
                if (value instanceof RXState) value = value.value;
                if (value instanceof Function) value = value(currentValueOfState, oldValueOfState)
                const _oldValue = currentValueOfState
                if (_oldValue !== value) {
                    value = toValidate(value, _oldValue, option);
                    oldValueOfState = _oldValue
                    currentValueOfState = value
                    dispatchUpdate(option)
                }
                return currentValueOfState
            }).bind()
            insertArrayMethode(this, { createStateComputed })
            Object.entries(ACTIONS).map(([k,v])=>this.set[k]=payload=>this.set(v instanceof Function ?v(currentValueOfState,payload):v))
            if (value instanceof Promise) {
                value.then(v => this.set(v))
            }
        }

    })(value, guard))
}
const stateType = {
    array(v) {
        if (!Array.isArray(v)) throw new Error("cette state doit être de type Array")
        return v
    },
    number(v) {
        if (typeof v != "number") throw new Error("cette state doit être de type Number")
        return v
    },
    string(v) {
        if (typeof v != "string") throw new Error("cette state doit être de type string")
        return v
    },
    function(v) {
        if (typeof v != "function") throw new Error("cette state doit être de type function")
        return v
    },
    boolean(v) {
        if (typeof v != "boolean") throw new Error("cette state doit être de type boolean")
        return v
    },
    symbol(v) {
        if (typeof v != "symbol") throw new Error("cette state doit être de type symbol")
        return v
    },
    object(v) {
        if (typeof v != "object") throw new Error("cette state doit être de type object")
        return v
    },
}
function insertArrayMethode(stateInstace, { createStateComputed }) {
    const state = stateInstace
    const isArray = () => {
        if (!state.isArray) throw new Error("pour pouvoir utiliser cette methode le type de state doit être une Array")
    }
    const isFunction = (callback) => {
        if (!(callback instanceof Function)) throw new Error("callback doit doit être une function")
    }
    const getIndex = (index) => {
        if (index instanceof RXState) {
            index = index.value
        }
        if (index instanceof Function) {
            index = state.value.findIndex(index)
        }
        if (isNaN(index)) throw new Error("index doit être une nombre ou une fonction qui retourne un nombre")
        return index
    }
    state.get.map = (callback) => {
        isFunction(callback)
        const createState = (v, i) => [useState(v)[0], useState(i)[0]]
        const rendMap = (v) => callback(...v, state)
        const listState = state.value.map(createState)
        let listElement = listState.map(rendMap)
        const [items, setItems] = useState(listElement)
        const update = () => listState.map(([v, i], index) => {
            if (!i.isDestroyed) i.set(index);
            if (!v.isDestroyed) v.set(state.value[index]);
        })
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
    state.get.callback = (callback) => {
        if (!(callback instanceof Function)) throw new Error("callback doit être une function")
        return state.get(() => callback)
    }
    const action = (args, action) => {
        isArray()
        if (state.value[action] instanceof Function) {
            const returnValue = state.value[action](...args)
            return state.set([...state.value], { methode: "set", action, args, returnValue })
        }
    }
    // TODO: state.set.remove
    // TODO: state.set.removeItem
    // TODO: state.set.editItem
    state.set.splice = (...args) => action([...args], "splice")
    state.set.remove = (start, deleteCount = 1) => {
        const returnValue = state.value.splice(start, deleteCount)
        return state.set([...state.value], { methode: "set", action: "remove", args: [start, deleteCount], returnValue })
    }
    state.set.edit = (index, value) => {
        isArray()
        index = getIndex(index)
        if (index > -1) {
            if (value instanceof Function) {
                value = value(state.value[index], index, state.value)
            }
            const returnValue = state.value.splice(index, 1, value)
            return state.set([...state.value], { methode: "set", action: "edit", args: [index, value], returnValue })
        }
    }
    state.set.push = (...items) => action([...items], "push")
    state.set.pop = () => action([], "pop")
    state.set.shift = () => action([], "shift")
    state.set.unshift = (...items) => action([...items], "shift")
    state.set.reverse = () => action([], "reverse")
    state.set.fill = (...items) => action([...items], "fill")
    state.set.filter = (predicate, ...args) => {
        isArray()
        isFunction(predicate)
        const returnValue = state.value.filter(predicate, ...args)
        return state.set(returnValue, { methode: "set", action: "filter", args: [predicate, ...args], returnValue })
    }
    state.set.slice = (...args) => {
        isArray()
        const returnValue = state.value.slice(...args)
        return state.set(returnValue, { methode: "set", action: "slice", args, returnValue })
    }
    state.set.sort = (compareFn = (a, b) => b - a) => {
        isArray()
        isFunction(compareFn)
        const oldValue = state.value.slice()
        const returnValue = state.value.sort(compareFn)
        if (returnValue.every((item, index) => item === oldValue[index])) return state.value
        return state.set(returnValue, { methode: "set", action: "sort", args:arguments, returnValue })
    }
    state.set.map = (callbackfn, thisArg = state.value) => {
        isArray()
        isFunction(callbackfn)
        const returnValue = state.value.map(callbackfn, ...args)
        return state.set(returnValue, { methode: "set", action: "map", args, returnValue })
    }
}

export default function useState(value, guard = guardFn) {
    if (value instanceof RXState) {
        value = value
        if (guard instanceof Function && guard !== guardFn) value.addGuard(guard);
    } else if (Array.isArray(value) && value[0] instanceof RXState && value[1] === value[0].set) {
        value = value[0]
        if (guard instanceof Function && guard !== guardFn) value.addGuard(guard);
    } else {
        value = createState(value, guard)
    }
    return [value, value.set]
}


Object.entries(stateType).map(([type, guard]) => useState[type] = (value) => useState(value, guard))
useState.isState = isState