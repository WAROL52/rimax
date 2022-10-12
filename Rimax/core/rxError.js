
const rxErrorConfig={
    lang:"en",
    usePrettyLog:false
}

const codeLogError= {
    "fr":{
        0:data=>"",
    },
    "en":{

    }
}
const CODES=[]
export function rxError({code,lang={fr:(data)=>"rxError",en:(data)=>"rxError"}}) {
    if(CODES.includes(code)) throw new Error("ce code is already used")
    if(typeof lang !="object")throw new Error("lang must be an object")
    CODES.push(code)
    Object.entries(lang).map(([name,value])=>{
        codeLogError[name][code]=(data)=>{
            if(!(value instanceof Function)) throw new Error("each value of lang must be a function")
            return value(data)
        }
    })
}
export function getStack(){
    let stackString=""
    try {
        throw new Error()
    } catch (error) {
        const stacks=error.stack.split(/at\s(.+)\s*/).slice(2).filter(e=>e).map(at=>{
            const nameOfFunction=at.slice(0,at.indexOf(" "))
            const file=at.slice(at.lastIndexOf("/")+1,-1).split(":")
            return {
                at,
                nameOfFunction,
                source:at.slice(at.indexOf(" ")+1).slice(1,-1),
                fileName:file[0],
                row:file[1],
                col:file[2],
            }
        })
        stacks.at(-1).source="h"+stacks.at(-1).source+error.stack.at(-1)
        stacks.at(-1).nameOfFunction=stacks.at(-1).nameOfFunction+error.stack.at(-1)
        stackString=stacks
    }
    return stackString
}
export default function getLogError(code=0,data=null){
    try {
        return codeLogError[rxErrorConfig["lang"]][code](data)
    } catch (error) {
        return codeLogError[rxErrorConfig["lang"]][0](data)
    }
}

rxError({
    code:0,
    lang:{
        fr:(data)=>{
            return `rxError:${data}`
        },
        en:(data)=>{
            return `rxError:${data}`
        }
    }
})