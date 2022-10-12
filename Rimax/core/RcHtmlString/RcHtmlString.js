import { FiberOfElement, FiberOfFragment, FiberOfNode, FiberOfText } from "../RxFiber/indexOfFiber.js"
import { TemplateRef } from "../templateRef.js"
import { createRegExpSplit } from "../RgExp.js"
import { fasteSplitHtmlString, isOpenTag, isTagEmpty, parseHtmlTag } from "./HtmlStringParser.js"

function rxReform(fiberList, htmlStringSplited, dataBinding) {
    while (htmlStringSplited.length) {
        const text = htmlStringSplited.shift()
        if (/^\s*$/.test(text)) continue
        if (isOpenTag(text)) {
            const fiber = parseHtmlTag(text)
            fiber.children = []
            fiber.initType(dataBinding)
            if (!isTagEmpty(fiber.type) && !fiber.isAutoClose) {
                getChildren(fiber, htmlStringSplited, dataBinding)
            }
            const el = new FiberOfElement(fiber.type, { ...fiber.props, children: fiber.children }, dataBinding)
            fiberList.push(el)
        } else {
            const listT = text.split(createRegExpSplit(TemplateRef.regExp, /{{[^{}]*}}/))//(/((?:\(_\|-\[RXRefs\{index:\d+,type:\w+\}\]-\|_\))|(?:{{[^{}]*}}))/)
            if (/^\s*$/.test(listT[0])) listT.shift()
            if (/^\s*$/.test(listT.at(-1))) listT.pop()
            fiberList.push(...listT.map(t => {
                const isRef = (typeof t == "string") ? TemplateRef.parse(t, dataBinding) : t
                t = isRef ? isRef.value[0] : t
                if (typeof t != "string") return t
                const isComment = (c) => /\s*\<\!--.*--\>\s*/.test(c)
                if (isComment(t)) {
                    return t.split(/(\s*\<\!--.*--\>\s*)/).map(t =>isComment(t) ? document.createComment(/^\s*\<\!--(.*)--\>\s*$/.exec(t)[1]): t).filter(t => t)
                }
                return new FiberOfText(t, dataBinding)
            }))
        }
    }
    return fiberList
}
function getChildren(fiber, htmlStringSplited, dataBinding) {
    if (fiber.type instanceof Function && !fiber.type.name) return
    let count = 1
    const index = htmlStringSplited.findIndex(e => {
        const tag = parseHtmlTag(e)
        const rcRef = TemplateRef.parse(tag ? tag.type : e, dataBinding)
        if (tag && ((rcRef && rcRef.value[0] === fiber.type) || (tag.type === fiber.type))) {
            count = tag.isClosingTag ? count - 1 : count + 1
            if (tag.isClosingTag && count <= 0) return true
        }
        return false
    })
    if (index === -1) {
        fiber.children = htmlStringSplited.splice(0, htmlStringSplited.length).filter(e => !/^\s*$/.test(e))
    } else {
        fiber.children = htmlStringSplited.splice(0, index + 1).filter(e => !/^\s*$/.test(e))
        fiber.children.pop()
    }
    if (fiber.type == "script") {
        let innerText = fiber.children.join("")
        const res = TemplateRef.parse(innerText, dataBinding)
        if (res) {
            innerText = res.valueString
        }
        fiber.children = [new Text(innerText)]
    } else {
        fiber.children = rxReform([], fiber.children, dataBinding)
    }
}
function parse(strings, ...rxRefs) {
    return [[...rxRefs.reduce((list, _str, index) => {
        list.push(strings[index], `(_|-[RXRefs{index:${index},type:${typeof rxRefs[index]}}]-|_)`)
        return list
    }, []), strings[rxRefs.length]].join(""), rxRefs]
}

function parseHtmlString(htmlString, rxRefs) {
    if (!(rxRefs instanceof TemplateRef)) throw new Error("rxRefs must be instance of RXRefs")
    const htmlArray = fasteSplitHtmlString(htmlString)
    const html = rxReform([], htmlArray, rxRefs)
    if (html.length == 1) {
        const el = html[0]
        return el instanceof FiberOfNode ? el : new FiberOfText(el, rxRefs)
    }
    const frag = new FiberOfFragment(html, rxRefs)
    return frag
}

export function template(strings, ...refs) {
    let config
    if (typeof refs[0] == "object" && refs[0]["<isStore>"] === true) {
        config = refs[0]
        refs[0] = ""
    }
    const [htmlstring] = parse(strings, ...refs)
    const rxRefs = new TemplateRef(...refs)
    const rcNode = parseHtmlString(htmlstring, rxRefs)
    if (config) {
        if (config.components && typeof config.components == "object") rcNode.components = config.components
        if (config.directives && typeof config.directives == "object") rcNode.directives = config.directives
    }
    return rcNode
}