import Assert from 'assert/strict';
import { Riter, AsyncRiter } from '../dist/index.js';

describe('Riter', () => {
	it('is iterable', () => {
		for(const x of new Riter([]));
	});
	it('is an iterator', () => {
		const iter = new Riter([1, 2]);
		Assert.deepEqual(iter.next(), { value: 1, done: false });
		Assert.deepEqual(iter.next(), { value: 2, done: false });
		Assert.deepEqual(iter.next(), { value: undefined, done: true });
	});

	describe('#constructor()', () => {
		it('accepts iterables', () => {
			new Riter('string');
			new Riter([1, 2, 3]);
			new Riter(new Uint8Array());
			new Riter(new Set([1, 2, 3]));
			new Riter(Object.entries({}));
			new Riter((function*() {})()); // generator object
			new Riter({ // user-defined iterable
				*[Symbol.iterator]() {},
			});
			new Riter({ // both iterable and async iterable
				*[Symbol.iterator]() {},
				async *[Symbol.asyncIterator]() {},
			});
		});
		it('rejects non-iterable', () => {
			function test_with(arg) {
				Assert.throws(() => new Riter(arg), TypeError);
			}

			test_with(); // undefined
			test_with(null);
			test_with(true);
			test_with(1);
			test_with(1n);
			test_with({});
			// async generator objects are only async iterable, not sync
			test_with((async function*() {})());
			// user-defined async iterable, shouldn't be iterable
			test_with({
				async *[Symbol.asyncIterator]() {},
			});
		});
	});
});

describe('AsyncRiter', () => {
	it('is async iterable', async () => {
		for await(const x of new AsyncRiter((async function*() {})()));
	});
	it('is an async iterator', async () => {
		const iter = new AsyncRiter((async function*() {
			yield 1;
			yield 2;
		})());
		Assert.deepEqual(await iter.next(), { value: 1, done: false });
		Assert.deepEqual(await iter.next(), { value: 2, done: false });
		Assert.deepEqual(await iter.next(), { value: undefined, done: true });
	});

	describe('#constructor()', () => {
		it('accepts async iterables', () => {
			// there are no built-in async iterables yet, I have to define some myself

			new AsyncRiter((async function*() {})()); // async generator object
			new AsyncRiter({ // user-defined async iterable
				async *[Symbol.asyncIterator]() {},
			});
			new AsyncRiter({ // both iterable and async iterable
				*[Symbol.iterator]() {},
				async *[Symbol.asyncIterator]() {},
			});
		});
		it('rejects non-iterable', () => {
			function test_with(arg) {
				Assert.throws(() => new AsyncRiter(arg), TypeError);
			}

			test_with(); // undefined
			test_with(null);
			test_with(true);
			test_with(1);
			test_with(1n);
			test_with('string');
			test_with({});
			test_with([1, 2, 3]);
			new Riter(new Set([1, 2, 3]));
			// generator objects are only sync iterable, not async
			test_with((function*() {})());
			// user-defined sync iterable, shouldn't be async iterable
			test_with({
				*[Symbol.iterator]() {},
			});
		});
	});
});
