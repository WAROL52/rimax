import {TemplateRef} from "../templateRef.js"
import {FiberOfNode} from "./FiberOfNode.js"

export class FiberOfElement extends FiberOfNode {
    constructor(type, props = {}, refs=new TemplateRef()) {
        if (!(refs instanceof TemplateRef)) throw new Error("refs must be an instance of RXRefs")
        super()
        this.type = type
        this.refs = refs
        this.props = Object.freeze({
            ...props,
            children: props.children?? []
        })
        this.props.children.map((child,index)=>{
            if(child instanceof DocumentFragment){
                this.props.children[index]=[...child.$children]
            }
        })
        this.initProps(this.refs)
        this.components=this.refs.components
        if(this.components[type]){
            this.type=this.components[type]
        }
        Object.freeze(this)
    }
}