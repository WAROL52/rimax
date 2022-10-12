import { TemplateRef } from "../templateRef";
import { FiberOfNode } from "./indexOfFiber";

export declare class FiberOfText<T> extends FiberOfNode {
    type:"TEXT"
    constructor(nodeValue:T,refs?:TemplateRef)
    props:{
        nodeValue:T,
        children:any[]
    }
}