export declare function sync<T>(x: T, y: T, fn?: (a: T, b: T) => number): number;
export declare function async<T>(x: T, y: T, fn?: (a: T, b: T) => number | Promise<number>): Promise<number>;
