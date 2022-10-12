
import { TemplateRef } from "../templateRef.js"
import { combineAndNoSaveRegExp, createRegExpSplit, combineAndSaveRegExp } from "../RgExp.js"

export const listTagEmpty = ["area", "base", "br", "col", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"]
export const listTagKnown = ["a", "abbr", "address", "area", "article", "aside", "audio", "b", "base", "bdi", "bdo", "blockquote", "body", "br", "button", "canvas", "caption", "cite", "code", "col", "colgroup", "data", "datalist", "dd", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "em", "embed", "fieldset", "figcaption", "figure", "font", "footer", "form", "frame", "frameset", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "iframe", "img", "input", "ins", "kbd", "label", "legend", "li", "link", "main", "map", "mark", "marquee", "menu", "meta", "meter", "nav", "noscript", "object", "ol", "optgroup", "option", "output", "p", "param", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "script", "section", "select", "slot", "small", "source", "span", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "title", "tr", "track", "u", "ul", "var", "video", "wbr"]

//a mettre dans RgExp une fois stable
export const regExpHtmlTag = /<(?:\/\s*)?(?:[^\!<>\s"'=\/\\]+)\s*(?:(?:\s*(?<="|'|\s)[^<>\s"'=\/\\]+\s*=\s*"[^"]*"|\s*(?<="|'|\s)[^<>\s"'=\/\\]+\s*=\s*'[^']*'|\s*(?<="|'|\s)[^<>\s"'=\/\\]+\s*=\s*[^<>\s"'=\/\\]+|\s*(?<="|'|\s)[^<>\s"'=\/\\]+?)*)\s*(?:\/)?\s*>/g
export const regExpHtmlTagSave = /(<(?:\/\s*)?(?:[^\!<>\s"'=\/\\]+)\s*(?:(?:\s*(?<="|'|\s)[^<>\s"'=\/\\]+\s*=\s*"[^"]*"|\s*(?<="|'|\s)[^<>\s"'=\/\\]+\s*=\s*'[^']*'|\s*(?<="|'|\s)[^<>\s"'=\/\\]+\s*=\s*[^<>\s"'=\/\\]+|\s*(?<="|'|\s)[^<>\s"'=\/\\]+?)*)\s*(?:\/)?\s*>)/
export const regExpHtmlTagFullCapture = /<(?<isClosingTag>\/\s*)?(?<type>[^\!<>\s"'=\/\\]+)\s*(?<attr>(?:\s*(?<="|'|\s)[^<>\s"'=\/\\]+\s*=\s*"[^"]*"|\s*(?<="|'|\s)[^<>\s"'=\/\\]+\s*=\s*'[^']*'|\s*(?<="|'|\s)[^<>\s"'=\/\\]+\s*=\s*[^<>\s"'=\/\\]+|\s*(?<="|'|\s)[^<>\s"'=\/\\]+?)*)\s*(?<isAutoClose>\/)?\s*>/
export const regStringValidHtml = /[^<>\s"'`=\/\\]+/
export const regStringValidHtmlSaved = /^(?<attrName>[^<>\s"'`=\/\\]+)$/
export const regAttributeName = /(?<="|'|`|\s*)[^<>\s"'`=\/\\]+\s*/

// export const regAttrWithQuotes=/(?:\s*(?<="|'|`|\s)[^<>\s"'`=\/\\]+\s*=\s*"[^"]*")/
export const regAttrWithQuotesSaved = /^(?<attrName>[^<>\s"'`=\/\\]+)\s*=\s*"(?<attrValue>[^"]*)"$/
export const regExpAttrWithQuotes = combineAndNoSaveRegExp(regAttributeName, /\s*=\s*/, /"[^"]*"/)

// export const regAttrWithApostrophe=/(?:\s*(?<="|'|`|\s)[^<>\s"'`=\/\\]+\s*=\s*'[^']*')/
export const regAttrWithApostropheSaved = /^(?<attrName>[^<>\s"'`=\/\\]+)\s*=\s*'(?<attrValue>[^']*)'$/
export const regExpAttrWithApostrophe = combineAndNoSaveRegExp(regAttributeName, /\s*=\s*/, /'[^']*'/)

export const regAttrWithBacktic = /(?:\s*(?<="|'|`|\s)[^<>\s"'`=\/\\]+\s*=\s*`[^`]*`)/
export const regAttrWithBackticSaved = /^(?<attrName>[^<>\s"'`=\/\\]+)\s*=\s*`(?<attrValue>[^`]*)`$/
export const regExpAttrWithBacktic = combineAndNoSaveRegExp(regAttributeName, /\s*=\s*/, /`[^`]*`/)

// export const regAttrWithNoDelimiter=/(?:\s*(?<="|'|`|\s)[^<>\s"'`=\/\\]+\s*=\s*[^<>\s"'`=\/\\]+\s*)/
export const regAttrWithNoDelimiterSaved = /^(?<attrName>[^<>\s"'`=\/\\]+)\s*=\s*(?<attrValue>[^<>\s"'`=\/\\]+)$/
export const regExpAttrWithNoDelimiter = combineAndNoSaveRegExp(regAttributeName, /\s*=\s*/, regStringValidHtml)


export const regExpAttr = createRegExpSplit(
    regExpAttrWithQuotes,
    regExpAttrWithApostrophe,
    regExpAttrWithBacktic,
    regExpAttrWithNoDelimiter,
    /\s+/
)

export function fasteSplitHtmlString(htmlString) { //1
    return htmlString.split(regExpHtmlTagSave)
}


export function isOpenTag(htmlTag) { // 1
    const result = regExpHtmlTagFullCapture.exec(htmlTag)
    if (!result) return null
    return result.groups.isClosingTag ? false : true
}
export function isCloseTag(htmlTag) { //1
    return !isOpenTag(htmlTag)
}
export function getCloseTag(htmlTag) { //1
    const result = regExpHtmlTagFullCapture.exec(htmlTag)
    if (!result) return null
    return isCloseTag(htmlTag) ? result.groups.type : null
}
export function getOpenTag(htmlTag) { //1
    const result = regExpHtmlTagFullCapture.exec(htmlTag)
    if (!result) return null
    return !result.groups.isClosingTag ? result.groups.type : null
}

export function parseAttrString(attrString) { //1
    let result
    const counterName = {}
    const value = (attr, name, value) => {
        const directive = (val = value, names = name) => {
            if (attr[names]) {
                let i = Math.round(Math.random() * 100_000_000)
                while ((names + `<${i}>`) in attr) { i++ }
                attr[names + `<${i}>`] = val
                return attr[names]
            }
            return val
        }
        if (name.startsWith("?")||name.startsWith("on")||["style","class"].includes(name)) {
            return directive()
        } else if (result = /^(?<name>\$[^\s</>:\[\]]+)(?:\:(?<arg>[^\s</>:\[\]]*)(\[(?<modifiers>[^\s</>\[\]]*)\])?)?(?:\<(?<index>\d+)\>)?$/.exec(name)) {
            return directive()
        }
        return isNaN(value) ? value : Number(value)
    }
    return attrString.split(regExpAttr).reduce((attr, chaine) => {
        if (/^\s*$/.test(chaine)) return attr
        let result
        if (result = regAttrWithQuotesSaved.exec(chaine)) {
            attr[result.groups.attrName] = value(attr, result.groups.attrName, result.groups.attrValue)
        } else if (result = regAttrWithApostropheSaved.exec(chaine)) {
            attr[result.groups.attrName] = value(attr, result.groups.attrName, result.groups.attrValue)
        } else if (result = regAttrWithBackticSaved.exec(chaine)) {
            attr[result.groups.attrName] = value(attr, result.groups.attrName, result.groups.attrValue)
        } else if (result = regAttrWithNoDelimiterSaved.exec(chaine)) {
            attr[result.groups.attrName] = value(attr, result.groups.attrName, result.groups.attrValue)
        } else if (result = regStringValidHtmlSaved.exec(chaine)) {
            attr[result.groups.attrName] = ""
        }
        return attr
    }, {})
}
export function parseHtmlTag(htmlTag) { //1
    const result = regExpHtmlTagFullCapture.exec(htmlTag)
    if (!result) return null
    const { type, attr, isAutoClose, isClosingTag } = result.groups
    return {
        get isTagEmpty() {
            return listTagEmpty.includes(this.type)
        },
        get isTagKnown() {
            return listTagKnown.includes(this.type)
        },
        type,
        attr,
        isAutoClose,
        isClosingTag,
        htmlTag,
        props: parseAttrString(result.groups.attr),
        initType(rxRefs) {
            if (!(rxRefs instanceof TemplateRef)) throw new Error("rxRefs must be instance of RXRefs")
            const parseResult = TemplateRef.parse(this.type, rxRefs)
            if (parseResult && parseResult.value.length == 2 && parseResult.value[0].at(-1) == ":" && parseResult.value[1] instanceof Function) {
                this.type = parseResult.value[0].slice(0, -1)
                rxRefs.components[this.type] = parseResult.value[1]
                // this.type = rxRefs.components[this.type]
                return this.type
            }
            let type = TemplateRef.split(this.type, (({ index }) => rxRefs[index]))
            type = type.length === 1 ? type[0] : type.join("")
            if (typeof type != "string" && typeof type != "function") {
                type = `${typeof type}.is-not-component-valid`
            }
            // const componentList = Object.keys(rxRefs.components ?? {})
            // if (!isKnownElement(type) && componentList.includes(type)) {
            //     type = rxRefs.components[type]
            // }
            return this.type = type
        }
    }
}
export function isKnownElement(type) {
    return listTagKnown.includes(type?.toLowerCase?.())
}
export function isTagEmpty(type) {
    return listTagEmpty.includes(type?.toLowerCase?.())
}