export declare class TemplateRef extends Array {
    static get regExp(): RegExp
    static get regExpSaved(): RegExp
    static get regExpSavedG(): RegExp
    static split: (chaine: string, includeResults?: boolean) => string[]
    static replaceAll: (chaine: string, value?: ((option: { input: string, index: number, type: string }) => string) | string) => string
    static parse: <T extends TemplateRef|undefined>(chaine: string, linksOfData?:T) => null | {
        index:number|string,
        type: string,
        input:string,
        value:T extends TemplateRef?TemplateRef[keyof TemplateRef ]:null,
        valueString:string,
        refs:T
    }
    constructor(...refs:any[])
    components:{[x:string]:()=>any}
}