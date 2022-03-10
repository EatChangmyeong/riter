import * as Comparator from './compare.js';
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
    compare(rhs, f) {
        if (f !== undefined && typeof f !== 'function')
            throw new TypeError(`${f} is not a function`);
        const left = this[Symbol.iterator](), right = rhs[Symbol.iterator]();
        while (true) {
            const lvalue = left.next(), rvalue = right.next();
            if (lvalue.done)
                return rvalue.done
                    ? 0
                    : -1;
            if (rvalue.done)
                return 1;
            const compared = Comparator.sync(lvalue.value, rvalue.value, f);
            if (compared !== 0)
                return compared;
        }
    }
    concat(...its) {
        if (its.length === 0)
            return this;
        const gen_fn = function* (lhs, rhs) {
            yield* lhs;
            for (const x of rhs)
                yield* x;
        };
        return new Riter(gen_fn(this, its));
    }
    // alias to #length()
    count() { return this.length(); }
    ;
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
    length() {
        let len = 0;
        while (true) {
            const { done } = this.iter.next();
            if (done)
                return len;
            len++;
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
    toAsync() {
        const gen_fn = async function* (riter) {
            yield* riter;
        };
        return new AsyncRiter(gen_fn(this));
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
        return this.concat(new Riter(values).toAsync());
    }
    // alias to #concat()
    chain(...its) {
        return this.concat(...its);
    }
    async compare(rhs, f) {
        if (f !== undefined && typeof f !== 'function')
            throw new TypeError(`${f} is not a function`);
        const left = this[Symbol.asyncIterator](), right = rhs[Symbol.asyncIterator]();
        while (true) {
            const lvalue = await left.next(), rvalue = await right.next();
            if (lvalue.done)
                return rvalue.done
                    ? 0
                    : -1;
            if (rvalue.done)
                return 1;
            const compared = await Comparator.async(lvalue.value, rvalue.value, f);
            if (compared !== 0)
                return compared;
        }
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
    // alias to #length()
    async count() { return this.length(); }
    ;
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
    async length() {
        let len = 0;
        while (true) {
            const { done } = await this.asyncIter.next();
            if (done)
                return len;
            len++;
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
    async toSync() {
        const result = [];
        for await (const x of this)
            result.push(x);
        return new Riter(result);
    }
}
export { Riter, AsyncRiter };
