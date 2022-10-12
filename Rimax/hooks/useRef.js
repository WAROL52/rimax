import useState from "./useState.js"
const refSymbol=Symbol("$$ref")
export default function useRef(value) {
    const [ref, changeRef] = useState(value)
    const OBJECT=Object
    return OBJECT.freeze(new (class Object {
        constructor(){
            OBJECT.defineProperty(this,"current",{
                get:(()=>ref.value).bind(),
                set:((val)=>changeRef(val)).bind(),
                enumerable:true,
                configurable:false
            })
            OBJECT.defineProperty(this,"onChange",{
                value:((fn)=>ref.onChange(fn)).bind(),
                enumerable:true,
            })
        }
        onCleanup(fn){return ref.onCleanup(fn)}
        destroy(fn){return ref.destroy(true)}
        set(fn){return changeRef(fn)}
        get [".rxType"](){return refSymbol}
    }))
}
useRef.isRef=((ref)=>(typeof ref=="object")&&refSymbol===ref[".rxType"]).bind()
