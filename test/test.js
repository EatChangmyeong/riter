import Assert from 'assert/strict';
import { Riter, AsyncRiter } from '../dist/index.js';

function yields(x) {
	return { value: x, done: false };
}
function done(x = undefined) {
	return { value: x, done: true };
}
async function* intoAsync(iterable) {
	yield* iterable; // async yield* can also iterate over sync iterables
}

describe('Riter', () => {
	it('is iterable', () => {
		for(const x of new Riter([]));
	});
	it('is an iterator', () => {
		const iter = new Riter([1, 2]);
		Assert.deepEqual(iter.next(), yields(1));
		Assert.deepEqual(iter.next(), yields(2));
		Assert.deepEqual(iter.next(), done());
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
			function testWith(arg) {
				Assert.throws(() => new Riter(arg), TypeError);
			}

			testWith(); // undefined
			testWith(null);
			testWith(true);
			testWith(1);
			testWith(1n);
			testWith({});
			// async generator objects are only async iterable, not sync
			testWith((async function*() {})());
			// user-defined async iterable, shouldn't be iterable
			testWith({
				async *[Symbol.asyncIterator]() {},
			});
		});
	});

	describe('#advanceBy()', () => {
		it('skips the first n elements', () => {
			function testWith(iterable, n, remaining) {
				const riter = new Riter(iterable);
				Assert.equal(riter.advanceBy(n), Math.floor(Math.abs(n)));
				for(const x of remaining)
					Assert.deepEqual(riter.next(), yields(x));
				Assert.deepEqual(riter.next(), done());
			}

			testWith([1, 2, 3, 4, 5], 3, [4, 5]);
			testWith([4, 5, 6, 7], 4, []);
			testWith(['zero'], 0, ['zero']); // zero works too
			testWith(['minus zero'], -0, ['minus zero']); // negative zero works too
			testWith('riter', 2.8, [...'ter']); // rounds down
			testWith(
				[...Array(100)].map((x, i) => 2*i), 50,
				[...Array(50)].map((x, i) => 2*i + 100)
			);
		});
		it('skips all remaining elements if the iterator is short', () => {
			function testWith(iterable, n, expected) {
				const riter = new Riter(iterable);
				Assert.equal(riter.advanceBy(n), expected);
				Assert.deepEqual(riter.next(), done());
			}

			testWith([1, 2, 3, 4, 5], 7, 5);
			testWith([], 5, 0);
			testWith('foo', 9, 3);
			testWith(new Set('bar'), 4, 3);
			testWith(['baz'], Infinity, 1); // infinity works too
		});
		it('rejects non-number or negative argument', () => {
			function testWith(iterable, n, type) {
				Assert.throws(() => new Riter(iterable).advanceBy(n), type);
			}

			testWith([1, 2, 3], 5n, TypeError); // BigInt is unfortunately not supported
			testWith([4, 5, 6, 7], '3', TypeError);
			testWith([8, 9], Symbol(), TypeError);
			testWith([10], function() {}, TypeError);
			testWith([11, 12, 13, 14], {}, TypeError);
			testWith([15, 16], undefined, TypeError);
			testWith('1234', -1, RangeError);
			testWith('56', -Infinity, RangeError);
			testWith('789', NaN, RangeError);
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
			function testWith(arg) {
				Assert.throws(() => new AsyncRiter(arg), TypeError);
			}

			testWith(); // undefined
			testWith(null);
			testWith(true);
			testWith(1);
			testWith(1n);
			testWith('string');
			testWith({});
			testWith([1, 2, 3]);
			new Riter(new Set([1, 2, 3]));
			// generator objects are only sync iterable, not async
			testWith((function*() {})());
			// user-defined sync iterable, shouldn't be async iterable
			testWith({
				*[Symbol.iterator]() {},
			});
		});
	});

	describe('#advanceBy()', () => {
		it('skips the first n elements', async () => {
			async function testWith(iterable, n, remaining) {
				const riter = new AsyncRiter(intoAsync(iterable));
				Assert.equal(await riter.advanceBy(n), Math.floor(Math.abs(n)));
				for(const x of remaining)
					Assert.deepEqual(await riter.next(), yields(x));
				Assert.deepEqual(await riter.next(), done());
			}

			await Promise.all([
				testWith([1, 2, 3, 4, 5], 3, [4, 5]),
				testWith([4, 5, 6, 7], 4, []),
				testWith(['zero'], 0, ['zero']), // zero works too
				testWith(['minus zero'], -0, ['minus zero']), // negative zero works too
				testWith('riter', 2.8, [...'ter']), // rounds down
				testWith(
					[...Array(100)].map((x, i) => 2*i), 50,
					[...Array(50)].map((x, i) => 2*i + 100)
				),
			]);
		});
		it('skips all remaining elements if the iterator is short', async () => {
			async function testWith(iterable, n, expected) {
				const riter = new AsyncRiter(intoAsync(iterable));
				Assert.equal(await riter.advanceBy(n), expected);
				Assert.deepEqual(await riter.next(), done());
			}

			await Promise.all([
				testWith([1, 2, 3, 4, 5], 7, 5),
				testWith([], 5, 0),
				testWith('foo', 9, 3),
				testWith(new Set('bar'), 4, 3),
				testWith(['baz'], Infinity, 1), // infinity works too
			]);
		});
		it('rejects non-number or negative argument', async () => {
			async function testWith(iterable, n, type) {
				await Assert.rejects(
					new AsyncRiter(intoAsync(iterable)).advanceBy(n),
					type
				);
			}

			await Promise.all([
				testWith([1, 2, 3], 5n, TypeError), // BigInt is unfortunately not supported
				testWith([4, 5, 6, 7], '3', TypeError),
				testWith([8, 9], Symbol(), TypeError),
				testWith([10], function() {}, TypeError),
				testWith([11, 12, 13, 14], {}, TypeError),
				testWith([15, 16], undefined, TypeError),
				testWith('1234', -1, RangeError),
				testWith('56', -Infinity, RangeError),
				testWith('789', NaN, RangeError),
			]);
		});
	});
});
