class Riter {
    constructor(iterable) {
        this.iter = iterable[Symbol.iterator]();
    }
    next() {
        return this.iter.next();
    }
    [Symbol.iterator]() {
        return this;
    }
}
class AsyncRiter {
    constructor(asyncIterable) {
        this.asyncIter = asyncIterable[Symbol.asyncIterator]();
    }
    next() {
        return this.asyncIter.next();
    }
    [Symbol.asyncIterator]() {
        return this;
    }
}
export { Riter, AsyncRiter };
