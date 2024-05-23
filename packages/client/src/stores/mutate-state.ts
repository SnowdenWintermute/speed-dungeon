export type MutateState<T> = (fn: (state: T) => void) => void;
