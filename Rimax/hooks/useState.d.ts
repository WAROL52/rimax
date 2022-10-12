interface OnchangeOption<TypeState> {
    methode?: string;
    value?: TypeState | any
}
type TypeSet<TypeState> = {
    (value: ((state: TypeState, oldState: TypeState, option: OnchangeOption<TypeState>) => TypeState) | TypeState): void
}

type GetNumber<T extends number>={}
type GetAny<T extends any>={}
type InferGet<T>=T extends number?GetNumber<T>:GetAny<T>

type TypeGet<TypeState> = {
    <ReturnType=TypeState>(
        callback?: (state: TypeState) => ReturnType, 
        dependencyList?: RXState<any>[]
        ): ReturnType extends RXState<infer T> ? RXState<T> : RXState<ReturnType>
}&InferGet<TypeState>

type PickTypeOfArray<T extends Array<any>> = T extends Array<infer U> ? RXState<U> : never

export declare class RXState<TypeState= any> {
    constructor(value: TypeState)
    static isState:(target:any)=>boolean
    get value(): TypeState
    set value(value: TypeState)
    get isDestroyed(): boolean
    get id():number
    clear(withDom?: false): void
    destroy(withDom?: true): void
    toString(): string
    valueOf(): TypeState
    onCleanup(callback: (state?: TypeState, oldState?: TypeState, option?: OnchangeOption<TypeState>) => (((state?: TypeState) => void) | void), directApply?: false): (...data: any[]) => void
    onChange(callback: (state?: TypeState, oldState?: TypeState, option?: OnchangeOption<TypeState>) => (((state?: TypeState) => void) | void), directApply?: false): (...data: any[]) => void
    onChange<T extends RXState>(
        state: T, 
        callback?: (
            state?: TypeState, 
            oldState?: TypeState, 
            option?: OnchangeOption<TypeState>
            ) => T extends RXState<infer U>?U:never): (...data: any[]) => void
    get: TypeGet<TypeState>
    set: TypeSet<TypeState>
    get isArray(): boolean
    getMap: TypeState extends Array<any> ?
        <T>(callbackfn: (item: PickTypeOfArray<TypeState>, indexOfItem: RXState<number>, items: RXState<TypeState>, setItem: TypeSet<TypeState>) => T) => RXState<T[]>
        : never
}
type PickTypeRXState<T> = T extends RXState<infer U> ? U : T

type TypeSetArray<T extends any[]>=TypeSet<T>&{
    push: T["push"]
    pop: T["pop"]
    shift: T["shift"]
    unshift: T["unshift"]
    splice: T["splice"]
    reverse: T["reverse"]
    fill: T["fill"]
    filter: T["filter"]
    slice: T["slice"]
    sort: T["sort"]
    map: T["map"]
    edit(index: number | T["findIndex"], value: T | ((currentValue: T,index:number, oldValue: T) => T)):any
    edits(index: number | T["findIndex"]|number[], value: T | ((currentValue: T,index:number, oldValue: T) => T)):any
    remove(index: number | T["findIndex"],deleteCount?:number):T[]
}

export declare type useState={
    <TypeValue>(value?: TypeValue,guard?: (newState: TypeValue, oldState: TypeValue) => TypeValue): [RXState<PickTypeRXState<TypeValue>>, RXState<PickTypeRXState<TypeValue>>["set"]]
    array:<T extends RXState<any[]>|Array<any>,U extends any[]=T extends RXState<Array<infer I>>?I[]:T>(value?:T)=>[RXState<U>,TypeSetArray<U>]
    number:<T extends number|RXState<number>>(value?:T)=>[RXState<number>,TypeSet<number>]
    string:<T extends string|RXState<string>>(value?:T)=>[RXState<string>,TypeSet<string>]
    boolean:<T extends boolean|RXState<boolean>>(value?:T)=>[RXState<boolean>,TypeSet<boolean>]
    symbol:<T extends symbol|RXState<symbol>>(value?:T)=>[RXState<symbol>,TypeSet<symbol>]
    isState:(target:any)=>boolean
}