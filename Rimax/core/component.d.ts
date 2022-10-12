import { RXState } from "../hooks/indexHooks"

export type ComponentOption<P> = { defaultProps: P, events: [], childrenAccepted: [] }

type StateProps<P extends { [x: string]: string }> = {
    [K in keyof P]?: RXState<P[K]>
}
type TypeProps<P extends object> = {
    [K in keyof P]?: P[K] | RXState<P[K]>
}
export declare function component<R, P extends object, E extends string>(
    callback: (props: StateProps<P>) => R,
    option?: {
        defaultProps?: P
        events?: E[]
    }
): (props: TypeProps<P>) => R