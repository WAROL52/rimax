import { TemplateRef } from "../templateRef";
import { FiberOfNode } from "./FiberOfNode";

export declare class FiberOfElement<K, P extends { children?: any[] }> extends FiberOfNode {
    type: K
    constructor(type: K, props?: P, refs?: TemplateRef)
    components: this["refs"]["components"]
    props: P
}