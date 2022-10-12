import { createRegExpSplit } from "./RgExp.js"

export class TemplateRef extends Array {
    static get regExp() { return /\(_\|-\[RXRefs\{index:\d+,type:[\w\$]+\}\]-\|_\)/ }
    static get regExpSaved() { return /\(_\|-\[RXRefs\{index:(?<index>\d+),type:(?<type>[\w\$]+)\}\]-\|_\)/ }
    static get regExpSavedG() { return /\(_\|-\[RXRefs\{index:(?<index>\d+),type:(?<type>[\w\$]+)\}\]-\|_\)/g }
    static {
        this.split = function (chaine = "", includeResults = true) {
            if (typeof chaine != "string") throw new Error("chaine doit etre une chaine de caractere")
            const reg = includeResults ? createRegExpSplit(this.regExp) : this.regExp
            const result = chaine.split(reg).reduce((l, item) => {
                if (!item) return l
                const r = this.parse(item)
                if (r && includeResults instanceof Function) item = includeResults(r)
                l.push(item)
                return l
            }, [])
            return result
        }
        this.replaceAll = function (chaine, value = "") {
            if (typeof chaine != "string") throw new Error("chaine doit etre une chaine de caractere")
            return chaine.replaceAll(this.regExpSavedG, (input, index, type) => value instanceof Function ? value({ input, index, type }) : value)
        }
        this.parse = function (chaine = "", refs = null) {
            if (typeof chaine != "string") throw new Error("chaine doit etre une chaine de caractere")
            const result = /\(_\|-\[RXRefs\{index:(?<index>\d+),type:(?<type>[\w\$]+)\}\]-\|_\)/.exec(chaine)
            const value = refs ? this.split(chaine, ({ index }) => refs[index]) : null
            const valueString = value ? value.join('') : ""
            return result ? {
                index: result.groups.index,
                type: result.groups.type,
                input: result.input,
                value, valueString, refs
            } : null
        }
    }
    constructor(...refs) {
        super()
        this.push(...refs)
        this.components={}
    }
}