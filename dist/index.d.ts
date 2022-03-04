declare class Riter<T> implements IterableIterator<T> {
    iter: Iterator<T>;
    constructor(iterable: Iterable<T>);
    next(): IteratorResult<T>;
    [Symbol.iterator](): Riter<T>;
    advanceBy(n: number): number;
    all(f: (a: T) => boolean): boolean;
    any(f: (a: T) => boolean): boolean;
    append(...values: T[]): Riter<T>;
    chain(...its: Iterable<T>[]): Riter<T>;
    concat(...its: Iterable<T>[]): Riter<T>;
    every(f: (a: T) => boolean): boolean;
    some(f: (a: T) => boolean): boolean;
    toAsync(): AsyncRiter<T>;
}
declare class AsyncRiter<T> implements AsyncIterableIterator<T> {
    asyncIter: AsyncIterator<T>;
    constructor(asyncIterable: AsyncIterable<T>);
    next(): Promise<IteratorResult<T>>;
    [Symbol.asyncIterator](): AsyncRiter<T>;
    advanceBy(n: number): Promise<number>;
    all(f: (a: T) => boolean | Promise<boolean>): Promise<boolean>;
    any(f: (a: T) => boolean | Promise<boolean>): Promise<boolean>;
    append(...values: T[]): AsyncRiter<T>;
    chain(...its: AsyncIterable<T>[]): AsyncRiter<T>;
    concat(...its: AsyncIterable<T>[]): AsyncRiter<T>;
    every(f: (a: T) => boolean | Promise<boolean>): Promise<boolean>;
    some(f: (a: T) => boolean | Promise<boolean>): Promise<boolean>;
    toSync(): Promise<Riter<T>>;
}
export { Riter, AsyncRiter };
