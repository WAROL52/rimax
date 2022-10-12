import { TemplateRef } from "../templateRef.js"
import {FiberOfNode} from "./FiberOfNode.js"

export class FiberOfText extends FiberOfNode {
    constructor(text, refs=new TemplateRef()) {
        if (!(refs instanceof TemplateRef)) throw new Error("refs must be an instance of RXRefs")
        super()
        this.refs = refs
        this.type = "TEXT"
        this.props = Object.freeze({
            nodeValue: text,
            children: []
        })
        Object.freeze(this)
        if(this.props.nodeValue instanceof Node ) {
            if(this.props.nodeValue instanceof DocumentFragment){
                console.log([...this.props.nodeValue.$children]);
            }
            return this.props.nodeValue
        }
        if (this.props.nodeValue instanceof FiberOfNode) return this.props.nodeValue
    }
}