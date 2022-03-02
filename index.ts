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
}

export { Riter, AsyncRiter };
