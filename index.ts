class Riter<T> implements IterableIterator<T> {
	iter: Iterator<T>;
	constructor(iterable: Iterable<T>) {
		this.iter = iterable[Symbol.iterator]();
	}
	next(): IteratorResult<T> {
		return this.iter.next();
	}
	[Symbol.iterator](): IterableIterator<T> {
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

	concat(...its: Iterable<T>[]): Riter<T> {
		if(its.length === 0)
			return this;
		return new Riter((function*(lhs: Riter<T>, rhs: Iterable<T>[]) {
			yield* lhs;
			for(const x of rhs)
				yield* x;
		})(this, its));
	}

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
}

class AsyncRiter<T> implements AsyncIterableIterator<T> {
	asyncIter: AsyncIterator<T>;
	constructor(asyncIterable: AsyncIterable<T>) {
		this.asyncIter = asyncIterable[Symbol.asyncIterator]();
	}
	next(): Promise<IteratorResult<T>> {
		return this.asyncIter.next();
	}
	[Symbol.asyncIterator](): AsyncIterableIterator<T> {
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
		// TODO: replace this implementation with
		// return this.concat(new Riter(values).toAsync());
		return this.concat({
			async *[Symbol.asyncIterator]() {
				for(const x of values)
					yield x;
			}
		});
	}

	// alias to #concat()
	chain(...its: AsyncIterable<T>[]): AsyncRiter<T> {
		return this.concat(...its);
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
}

export { Riter, AsyncRiter };
