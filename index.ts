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
}

export { Riter, AsyncRiter };
