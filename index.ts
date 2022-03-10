import * as Comparator from './compare.js';

class Riter<T> implements IterableIterator<T> {
	iter: Iterator<T>;
	constructor(iterable: Iterable<T>) {
		this.iter = iterable[Symbol.iterator]();
	}
	next(): IteratorResult<T> {
		return this.iter.next();
	}
	[Symbol.iterator](): Riter<T> {
		return this;
	}

	advanceBy(n: number): number {
		if(typeof n !== 'number')
			throw new TypeError(`${n} is not a number`);
		if(isNaN(n) || n < 0)
			throw new RangeError(`${n} should be zero or greater`);

		n = Math.floor(n);
		let discarded = 0;
		for(; discarded < n; discarded++)
			if(this.iter.next().done)
				break;
		return discarded;
	}

	// alias to #every()
	all(f: (a: T) => boolean): boolean { return this.every(f); }

	// alias to #some()
	any(f: (a: T) => boolean): boolean { return this.some(f); }

	append(...values: T[]): Riter<T> {
		if(values.length === 0)
			return this;
		return this.concat(values);
	}

	// alias to #concat()
	chain(...its: Iterable<T>[]): Riter<T> { return this.concat(...its); }

	compare(rhs: Iterable<T>, f?: (a: T, b: T) => number): number {
		if(f !== undefined && typeof f !== 'function')
			throw new TypeError(`${f} is not a function`);

		const
			left = this[Symbol.iterator](),
			right = rhs[Symbol.iterator]();
		while(true) {
			const lvalue = left.next(), rvalue = right.next();
			if(lvalue.done)
				return rvalue.done
					? 0
					: -1;
			if(rvalue.done)
				return 1;
			const compared = Comparator.sync(lvalue.value, rvalue.value, f);
			if(compared !== 0)
				return compared;
		}
	}

	concat(...its: Iterable<T>[]): Riter<T> {
		if(its.length === 0)
			return this;
		const gen_fn = function*(lhs: Riter<T>, rhs: Iterable<T>[]) {
			yield* lhs;
			for(const x of rhs)
				yield* x;
		};
		return new Riter(gen_fn(this, its));
	}

	// alias to #length()
	count(): number { return this.length() };

	every(f: (a: T) => boolean): boolean {
		if(typeof f !== 'function')
			throw new TypeError(`${f} is not a function`);

		while(true) {
			const { value, done } = this.iter.next();
			if(done)
				return true;
			if(!(f(value) as unknown))
				return false;
		}
	}

	length(): number {
		let len = 0;
		while(true) {
			const { done } = this.iter.next();
			if(done)
				return len;
			len++;
		}
	}

	some(f: (a: T) => boolean): boolean {
		if(typeof f !== 'function')
			throw new TypeError(`${f} is not a function`);

		while(true) {
			const { value, done } = this.iter.next();
			if(done)
				return false;
			if(f(value) as unknown)
				return true;
		}
	}

	toAsync(): AsyncRiter<T> {
		const gen_fn = async function*(riter: Riter<T>) {
			yield* riter;
		};
		return new AsyncRiter(gen_fn(this));
	}
}

class AsyncRiter<T> implements AsyncIterableIterator<T> {
	asyncIter: AsyncIterator<T>;
	constructor(asyncIterable: AsyncIterable<T>) {
		this.asyncIter = asyncIterable[Symbol.asyncIterator]();
	}
	next(): Promise<IteratorResult<T>> {
		return this.asyncIter.next();
	}
	[Symbol.asyncIterator](): AsyncRiter<T> {
		return this;
	}

	async advanceBy(n: number): Promise<number> {
		if(typeof n !== 'number')
			throw new TypeError(`${n} is not a number`);
		if(isNaN(n) || n < 0)
			throw new RangeError(`${n} should be zero or greater`);

		n = Math.floor(n);
		let discarded = 0;
		for(; discarded < n; discarded++)
			if((await this.asyncIter.next()).done)
				break;
		return discarded;
	}

	// alias to #every()
	async all(f: (a: T) => boolean | Promise<boolean>): Promise<boolean> {
		return this.every(f);
	}

	// alias to #some()
	async any(f: (a: T) => boolean | Promise<boolean>): Promise<boolean> {
		return this.some(f);
	}

	append(...values: T[]): AsyncRiter<T> {
		if(values.length === 0)
			return this;
		return this.concat(new Riter(values).toAsync());
	}

	// alias to #concat()
	chain(...its: AsyncIterable<T>[]): AsyncRiter<T> {
		return this.concat(...its);
	}

	async compare(
		rhs: AsyncIterable<T>,
		f?: (a: T, b: T) => number | Promise<number>
	): Promise<number> {
		if(f !== undefined && typeof f !== 'function')
			throw new TypeError(`${f} is not a function`);

		const
			left = this[Symbol.asyncIterator](),
			right = rhs[Symbol.asyncIterator]();
		while(true) {
			const lvalue = await left.next(), rvalue = await right.next();
			if(lvalue.done)
				return rvalue.done
					? 0
					: -1;
			if(rvalue.done)
				return 1;
			const compared = await Comparator.async(
				lvalue.value, rvalue.value, f
			);
			if(compared !== 0)
				return compared;
		}
	}

	concat(...its: AsyncIterable<T>[]): AsyncRiter<T> {
		if(its.length === 0)
			return this;
		return new AsyncRiter((async function*(
			lhs: AsyncRiter<T>, rhs: AsyncIterable<T>[]
		) {
			yield* lhs;
			for(const x of rhs)
				yield* x;
		})(this, its));
	}

	// alias to #length()
	async count(): Promise<number> { return this.length() };

	async every(f: (a: T) => boolean | Promise<boolean>): Promise<boolean> {
		if(typeof f !== 'function')
			throw new TypeError(`${f} is not a function`);

		while(true) {
			const { value, done } = await this.asyncIter.next();
			if(done)
				return true;
			if(!await (f(value) as unknown))
				return false;
		}
	}

	async length(): Promise<number> {
		let len = 0;
		while(true) {
			const { done } = await this.asyncIter.next();
			if(done)
				return len;
			len++;
		}
	}

	async some(f: (a: T) => boolean | Promise<boolean>): Promise<boolean> {
		if(typeof f !== 'function')
			throw new TypeError(`${f} is not a function`);

		while(true) {
			const { value, done } = await this.asyncIter.next();
			if(done)
				return false;
			if(await (f(value) as unknown))
				return true;
		}
	}

	async toSync(): Promise<Riter<T>> {
		const result = [];
		for await(const x of this)
			result.push(x);
		return new Riter(result);
	}
}

export { Riter, AsyncRiter };
