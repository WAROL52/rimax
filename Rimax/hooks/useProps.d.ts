import {RXState} from "./indexHooks";
export function useProps<T extends object>(props?:T):{[x in keyof T]:RXState<T[x]>}