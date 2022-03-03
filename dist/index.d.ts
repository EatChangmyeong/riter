declare class Riter<T> implements IterableIterator<T> {
    iter: Iterator<T>;
    constructor(iterable: Iterable<T>);
    next(): IteratorResult<T>;
    [Symbol.iterator](): IterableIterator<T>;
    advanceBy(n: number): number;
    all(f: (a: T) => boolean): boolean;
    any(f: (a: T) => boolean): boolean;
    every(f: (a: T) => boolean): boolean;
    some(f: (a: T) => boolean): boolean;
}
declare class AsyncRiter<T> implements AsyncIterableIterator<T> {
    asyncIter: AsyncIterator<T>;
    constructor(asyncIterable: AsyncIterable<T>);
    next(): Promise<IteratorResult<T>>;
    [Symbol.asyncIterator](): AsyncIterableIterator<T>;
    advanceBy(n: number): Promise<number>;
    all(f: (a: T) => boolean | Promise<boolean>): Promise<boolean>;
    any(f: (a: T) => boolean | Promise<boolean>): Promise<boolean>;
    every(f: (a: T) => boolean | Promise<boolean>): Promise<boolean>;
    some(f: (a: T) => boolean | Promise<boolean>): Promise<boolean>;
}
export { Riter, AsyncRiter };
