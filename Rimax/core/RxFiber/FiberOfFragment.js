import { TemplateRef } from "../templateRef.js"
import {FiberOfNode} from "./FiberOfNode.js"

export class FiberOfFragment extends FiberOfNode {
    constructor(children, refs=new TemplateRef()) {
        if (!(refs instanceof TemplateRef)) throw new Error("refs must be an instance of RXRefs")
        super()
        this.refs = refs
        this.type = "FRAGMENT"
        this.props = Object.freeze({
            children:children ?? []
        })
        this.initProps(this.refs)
        Object.freeze(this)
    }
}