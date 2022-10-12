
export function createRegExp(...regs){
    return regs.reduce((regFinal,reg)=>new RegExp(regFinal.source+reg.source))
}
function getRegSource(reg){
    return typeof reg=="string"?reg:reg.source
}
export function combineRegExp(...regs){
    return regs.reduce((regFinal,reg)=>new RegExp(regFinal.source+getRegSource(reg)))
}
export function combineAndSaveRegExp(...regs){
    return new RegExp(`(${combineRegExp(...regs).source})`)
}
export function combineAndNoSaveRegExp(...regs){
    return new RegExp(`(?:${combineRegExp(...regs).source})`)
}
export function createRegExpSaved(...regs){
    return new RegExp(`(${createRegExp(...regs).source})`)
}
export function createRegExpSplit(...regs){
    return createRegExpSaved(regs.reduce((regFinal,reg)=>new RegExp(regFinal.source+"|"+reg.source)))
}