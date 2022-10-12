import { TemplateRef } from "../templateRef";
import { FiberOfNode } from "./FiberOfNode";

export declare class FiberOfFragment<T> extends FiberOfNode {
    type:"FRAGMENT"
    constructor(children:T[], refs?:TemplateRef)
    props:{
        children:T[]
    }
}