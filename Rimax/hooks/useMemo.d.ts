import { RXState } from "./indexHooks"

export declare function useMemo<T extends RXState,R>(
    callback: (
        valuesOfState: (T extends RXState<infer U> ? U : T)[],
        index: number,
    ) =>R,
    states?: T[]
): RXState<R>