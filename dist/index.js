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
    advanceBy(n) {
        if (typeof n !== 'number')
            throw new TypeError(`${n} is not a number`);
        if (isNaN(n) || n < 0)
            throw new RangeError(`${n} should be zero or greater`);
        n = Math.floor(n);
        let discarded = 0;
        for (; discarded < n; discarded++)
            if (this.iter.next().done)
                break;
        return discarded;
    }
    every(f) {
        if (typeof f !== 'function')
            throw new TypeError(`${f} is not a function`);
        while (true) {
            const { value, done } = this.iter.next();
            if (done)
                return true;
            if (!f(value))
                return false;
        }
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
    async advanceBy(n) {
        if (typeof n !== 'number')
            throw new TypeError(`${n} is not a number`);
        if (isNaN(n) || n < 0)
            throw new RangeError(`${n} should be zero or greater`);
        n = Math.floor(n);
        let discarded = 0;
        for (; discarded < n; discarded++)
            if ((await this.asyncIter.next()).done)
                break;
        return discarded;
    }
    async every(f) {
        if (typeof f !== 'function')
            throw new TypeError(`${f} is not a function`);
        while (true) {
            const { value, done } = await this.asyncIter.next();
            if (done)
                return true;
            if (!await f(value))
                return false;
        }
    }
}
export { Riter, AsyncRiter };
