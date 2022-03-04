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
    // alias to #every()
    all(f) { return this.every(f); }
    // alias to #some()
    any(f) { return this.some(f); }
    append(...values) {
        if (values.length === 0)
            return this;
        return this.concat(values);
    }
    // alias to #concat()
    chain(...its) { return this.concat(...its); }
    concat(...its) {
        if (its.length === 0)
            return this;
        return new Riter((function* (lhs, rhs) {
            yield* lhs;
            for (const x of rhs)
                yield* x;
        })(this, its));
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
    some(f) {
        if (typeof f !== 'function')
            throw new TypeError(`${f} is not a function`);
        while (true) {
            const { value, done } = this.iter.next();
            if (done)
                return false;
            if (f(value))
                return true;
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
    // alias to #every()
    async all(f) {
        return this.every(f);
    }
    // alias to #some()
    async any(f) {
        return this.some(f);
    }
    append(...values) {
        if (values.length === 0)
            return this;
        // TODO: replace this implementation with
        // return this.concat(new Riter(values).toAsync());
        return this.concat({
            async *[Symbol.asyncIterator]() {
                for (const x of values)
                    yield x;
            }
        });
    }
    // alias to #concat()
    chain(...its) {
        return this.concat(...its);
    }
    concat(...its) {
        if (its.length === 0)
            return this;
        return new AsyncRiter((async function* (lhs, rhs) {
            yield* lhs;
            for (const x of rhs)
                yield* x;
        })(this, its));
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
    async some(f) {
        if (typeof f !== 'function')
            throw new TypeError(`${f} is not a function`);
        while (true) {
            const { value, done } = await this.asyncIter.next();
            if (done)
                return false;
            if (await f(value))
                return true;
        }
    }
}
export { Riter, AsyncRiter };
