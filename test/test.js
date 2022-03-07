import Assert from 'assert/strict';
import { Riter, AsyncRiter } from '../dist/index.js';
import { sync as comparator } from '../dist/compare.js';

function irandom(x) {
	return Math.floor(x*Math.random());
}
function signZero(x) {
	return x === 0
		? 0
		: Math.sign(x);
}

function iterEqual(lhs, rhs, n = Infinity) {
	lhs = lhs[Symbol.iterator]();
	rhs = rhs[Symbol.iterator]();
	for(let i = 0; i < n; i++) {
		const lnext = lhs.next(), rnext = rhs.next();
		Assert.deepEqual(lnext, rnext);
		if(lnext.done)
			break;
	}
}
function iterDone(iter) {
	Assert.ok(iter.next().done);
}
async function asyncIterEqual(lhs, rhs, n = Infinity) {
	lhs = lhs[Symbol.asyncIterator]();
	rhs = rhs[Symbol.asyncIterator]();
	for(let i = 0; i < n; i++) {
		const lnext = lhs.next(), rnext = rhs.next();
		Assert.deepEqual(await lnext, await rnext);
		if((await lnext).done)
			break;
	}
}
async function asyncIterDone(iter) {
	Assert.ok((await iter.next()).done);
}
async function* intoAsync(iterable) {
	yield* iterable; // async yield* can also iterate over sync iterables
}

describe('Default sorting function', () => {
	it('mimics the behavior of SortCompare', () => {
		function testWith(x, y, f) {
			const
				[less, greater] = [x, y].sort(f),
				compared = comparator(x, y, f);
			switch(compared) {
				case -1:
					Assert.equal(x, less);
					Assert.equal(y, greater);
				break;
				// Array.prototype.sort() had no guarantee of stability until ES2019
				// compared == 0 case can't be reliably tested because we're targeting ES2018
				case 1:
					Assert.equal(y, less);
					Assert.equal(x, greater);
				break;
			}
		}
		function random_number() {
			return Math.tan(Math.PI*(Math.random() - 0.5));
		}
		function random_string() {
			return [...Array(irandom(65))]
					.map(() => String.fromCharCode(irandom(0x10000)));
		}
		/*
			let's just return
			- undefined
			- null
			- NaN
			- numbers
			- strings
			and call it a day for now
		*/
		function random_object() {
			const rand = Math.random();
			if(rand < 0.01)
				return undefined;
			else if(rand < 0.02)
				return null;
			else if(rand < 0.03)
				return NaN;
			else if(rand < 0.515)
				return random_number();
			else
				return random_string();
		}

		// default comparer
		for(let i = 0; i < 1000; i++)
			testWith(random_object(), random_object());

		// user-defined comparer
		for(let i = 0; i < 1000; i++)
			testWith(random_object(), random_object(), (x, y) => x - y);
	});
});

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
			new Riter({ *[Symbol.iterator]() {} }); // user-defined iterable
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
			testWith({ async *[Symbol.asyncIterator]() {} });
		});
	});

	describe('#advanceBy()', () => {
		it('skips the first n elements', () => {
			function testWith(iterable, n, remaining) {
				const riter = new Riter(iterable);
				Assert.equal(riter.advanceBy(n), Math.floor(Math.abs(n)));
				iterEqual(riter, remaining);
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
				iterDone(riter);
			}

			testWith([1, 2, 3, 4, 5], 7, 5);
			testWith([], 5, 0);
			testWith('foo', 9, 3);
			testWith(new Set('bar'), 4, 3);
			testWith(['baz'], Infinity, 1); // infinity works too
		});
		it('rejects non-number or negative argument', () => {
			function testWith(iterable, n, type) {
				Assert.throws(
					() => new Riter(iterable).advanceBy(n),
					type
				);
			}

			testWith([0], false, TypeError);
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

	describe('#append()', () => {
		it('appends values to the iterator', () => {
			function testWith(lhs, rhs, expected) {
				iterEqual(
					new Riter(lhs).append(...rhs),
					expected
				);
			}

			testWith([1, 2, 3], [4, 5, 6], [1, 2, 3, 4, 5, 6]);
			testWith('Original', [...'Appended'], 'OriginalAppended');
			testWith([1, 2, 3], [], [1, 2, 3]);
			testWith([], [1, 2, 3], [1, 2, 3]);
			testWith([], [], []);
			testWith(['one', 'two'], ['three'], ['one', 'two', 'three']);
		});
		it('is no-op if no arguments are provided', () => {
			function testWith(lhs) {
				const
					riter = new Riter(lhs),
					iter = riter.iter;
				iter.next = () => Assert.fail();
				const appended = riter.append();
				Assert.equal(appended, riter);
				Assert.equal(appended.iter, iter);
			}

			testWith([1, 2, 3]);
			testWith('noop');
		});
	});

	describe('#compare()', () => {
		function testWith(lhs_factory, rhs_factory, expected, f) {
			Assert.equal(
				signZero(new Riter(lhs_factory()).compare(rhs_factory(), f)),
				signZero(expected)
			);
			Assert.equal(
				signZero(new Riter(rhs_factory()).compare(lhs_factory(), f)),
				signZero(-expected)
			);
		}

		it('compares two iterators lexicographically', () => {
			// neither is prefix of the other
			testWith(() => [1, 2, 3, 4], () => [1, 2, 4, 5], -1);
			testWith(() => 'ace', () => 'abcd', 1);
			testWith(() => '123', () => '45', -1);

			// one is prefix of the other
			testWith(() => [1, 2, 3], () => [1, 2, 3, 4, 5], -1);
			testWith(() => 'eatchangmyeong', () => 'eatch', 1);

			// both are same
			testWith(() => [9, 7, 5, 3], () => [9, 7, 5, 3], 0);
			testWith(() => 'foo', () => 'foo', 0);

			// one is empty
			testWith(() => ['a', 'a', 'a'], () => [], 1);
			testWith(() => '', () => 'vs empty', -1);

			// both are empty
			testWith(() => [], () => [], 0);
		});

		it('accepts user-defined comparator', () => {
			function reverse_as_number(x, y) {
				return y - x;
			}
			testWith(() => [1, 2, 4], () => [5, 7, 8], 1, reverse_as_number);
			testWith(() => ['123'], () => ['45'], -1, reverse_as_number);

			function compare_pair([la, lb], [ra, rb]) {
				return la != ra
					? la - ra
					: lb - rb;
			}
			testWith(
				() => [[3, 5], [9, 2], [-5, -4]],
				() => [[3, 5], [9, 1], [-5, -4]],
				1, compare_pair
			);
			testWith(
				() => [[3, 5], [9, 2], [-5, -4]],
				() => [[3, 5], [10, 2], [-5, -4]],
				-1, compare_pair
			);

			function by_length(x, y) {
				return x.length - y.length;
			}
			testWith(() => ['ab', 'cd'], () => ['ef', 'g'], 1, by_length);
		});

		it('rejects non-function argument', () => {
			function testWith(lhs, rhs, f) {
				Assert.throws(
					() => new Riter(lhs).compare(rhs, f),
					TypeError
				);
			}

			testWith([1, 2], [3, 4], true);
			testWith([4, 5], [6], 2);
			testWith([], [[]], 2n);
			testWith('asdfasdf', 'asdfasdf', 'asdfasdf');
			testWith('qw', 'er', {});
			testWith('zx', 'cv', []);
		});

		it('never returns negative zero or NaN', () => {
			function testWith(iter_factory, f) {
				const result = new Riter(iter_factory()).compare(iter_factory(), f);
				Assert.notEqual(result, -0);
				Assert.notEqual(result, NaN);
			}
			function always_minus_zero() {
				return -0;
			}
			function maybe_minus_zero() {
				return Math.random() < 0.5 ? 0 : -0;
			}
			function always_nan() {
				return NaN;
			}
			function maybe_nan() {
				return Math.random() < 0.5 ? 0 : NaN;
			}

			testWith(() => [1, 2, 3], () => always_minus_zero);
			testWith(() => [], always_minus_zero);
			testWith(() => 'equal_test', always_minus_zero);
			testWith(() => [1, 2, 3], () => maybe_minus_zero);
			testWith(() => [], maybe_minus_zero);
			testWith(() => 'equal_test', maybe_minus_zero);
			testWith(() => [1, 2, 3], () => always_nan);
			testWith(() => [], always_nan);
			testWith(() => 'equal_test', always_nan);
			testWith(() => [1, 2, 3], () => maybe_nan);
			testWith(() => [], maybe_nan);
			testWith(() => 'equal_test', maybe_nan);
		});
	});

	describe('#concat()', () => {
		it('concatenates two iterators together', () => {
			function testWith(lhs, rhs, expected) {
				iterEqual(
					new Riter(lhs).concat(rhs),
					expected
				);
			}

			testWith([1, 2, 3], [4, 5, 6], [1, 2, 3, 4, 5, 6]);
			testWith('Chained', 'Iterator', 'ChainedIterator');
			testWith([1, 2, 3], [], [1, 2, 3]);
			testWith([], [1, 2, 3], [1, 2, 3]);
			testWith([], [], []);
		});
		it('also concatenates three or more iterators', () => {
			function testWith(lhs, rhs, expected) {
				iterEqual(
					new Riter(lhs).concat(...rhs),
					expected
				);
			}

			testWith([1, 2], [[3, 4], [5, 6]], [1, 2, 3, 4, 5, 6]);
			testWith('foo', ['bar', 'baz', 'quux'], 'foobarbazquux');
			testWith([10], [[], [], []], [10]);
		});
		it('is no-op if no arguments are provided', () => {
			function testWith(lhs) {
				const
					riter = new Riter(lhs),
					iter = riter.iter;
				iter.next = () => Assert.fail();
				const concatted = riter.concat();
				Assert.equal(concatted, riter);
				Assert.equal(concatted.iter, iter);
			}

			testWith([1, 2, 3]);
			testWith('noop');
		});
	});

	describe('#every()', () => {
		it('consumes the iterator until the first mismatch', () => {
			const riter = new Riter([1, 3, 5, 7, 10, 11, 14]);
			riter.every(x => x % 2 === 1);
			iterEqual(riter, [11, 14]);
		});

		it('returns true if every element matches', () => {
			function testWith(iterable, f) {
				Assert.equal(new Riter(iterable).every(f), true);
			}

			testWith([1, 3, 5, 7, 9], x => x % 2 === 1);
			testWith(new Set([-3, -5, -7, -8]), x => x < 0);
			testWith('eatchangmyeong', x => x.toLowerCase() === x);
			testWith([], () => false); // should vacuously return true
		});

		it('returns false if any element does not match', () => {
			function testWith(iterable, f) {
				Assert.equal(new Riter(iterable).every(f), false);
			}

			testWith([1, 3, 5, 7, 10], x => x % 2 === 1);
			testWith(new Set([-3, -5, 7, -8]), x => x < 0);
			testWith('EatChangmyeong', x => x.toLowerCase() === x);
		});

		it('rejects non-function argument', () => {
			function testWith(iterable, f) {
				Assert.throws(
					() => new Riter(iterable).every(f),
					TypeError
				);
			}

			testWith([1, 2, 3, 4, 5], true);
			testWith([1, 3, 5, 7, 9], 2);
			testWith([4, 6, 8], 2n);
			testWith('asdfasdf', 'asdfasdf');
			testWith('qwer', {});
			testWith('zxcv', []);
		});
	});

	describe('#some()', () => {
		it('consumes the iterator until the first match', () => {
			const riter = new Riter([1, 3, 5, 7, 10, 11, 14]);
			riter.some(x => x % 2 === 0);
			iterEqual(riter, [11, 14]);
		});

		it('returns true if any element matches', () => {
			function testWith(iterable, f) {
				Assert.equal(new Riter(iterable).some(f), true);
			}

			testWith([1, 3, 5, 7, 9], x => x % 2 === 1);
			testWith(new Set([-3, -5, -7, -8]), x => x < -7);
			testWith('EatChangmyeong', x => x.toUpperCase() === x);
		});

		it('returns false if no elements match', () => {
			function testWith(iterable, f) {
				Assert.equal(new Riter(iterable).some(f), false);
			}

			testWith([1, 3, 5, 7, 9], x => x % 2 === 0);
			testWith(new Set([-3, -5, -7, -8]), x => x >= 0);
			testWith('EATCHANGMYEONG', x => x.toLowerCase() === x);
			testWith([], () => true); // should vacuously return false
		});

		it('rejects non-function argument', () => {
			function testWith(iterable, f) {
				Assert.throws(() => new Riter(iterable).some(f), TypeError);
			}

			testWith([1, 2, 3, 4, 5], true);
			testWith([1, 3, 5, 7, 9], 2);
			testWith([4, 6, 8], 2n);
			testWith('asdfasdf', 'asdfasdf');
			testWith('qwer', {});
			testWith('zxcv', []);
		});
	});

	describe('#toAsync()', () => {
		it('turns a Riter to AsyncRiter', () => {
			function testWith(iterable) {
				Assert.ok(new Riter(iterable).toAsync() instanceof AsyncRiter);
			}

			testWith([]);
			testWith('asdf');
		});
		it('yields the same elements as the original', async () => {
			async function testWith(iter_factory) {
				asyncIterEqual(
					new Riter(iter_factory()).toAsync(),
					intoAsync(iter_factory())
				);
			}

			await Promise.all([
				testWith(() => [1, 2, 3]),
				testWith(() => 'sync_to_async'),
				testWith(() => ['abc', 'def', 'ghi']),
			]);
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
			new AsyncRiter({ async *[Symbol.asyncIterator]() {} }); // user-defined async iterable
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
			testWith({ *[Symbol.iterator]() {} });
		});
	});

	describe('#advanceBy()', () => {
		it('skips the first n elements', async () => {
			async function testWith(iterable, n, remaining) {
				const riter = new AsyncRiter(intoAsync(iterable));
				Assert.equal(await riter.advanceBy(n), Math.floor(Math.abs(n)));
				await asyncIterEqual(riter, intoAsync(remaining));
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
				await asyncIterDone(riter);
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
				testWith([0], false, TypeError),
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

	describe('#append()', () => {
		it('appends values to the iterator', async () => {
			async function testWith(lhs, rhs, expected) {
				await asyncIterEqual(
					new AsyncRiter(intoAsync(lhs)).append(...rhs),
					intoAsync(expected)
				);
			}

			await Promise.all([
				testWith([1, 2, 3], [4, 5, 6], [1, 2, 3, 4, 5, 6]),
				testWith('Original', [...'Appended'], 'OriginalAppended'),
				testWith([1, 2, 3], [], [1, 2, 3]),
				testWith([], [1, 2, 3], [1, 2, 3]),
				testWith([], [], []),
				testWith(['one', 'two'], ['three'], ['one', 'two', 'three']),
			]);
		});
		it('is no-op if no arguments are provided', () => {
			function testWith(lhs) {
				const
					riter = new AsyncRiter(intoAsync(lhs)),
					iter = riter.asyncIter;
				iter.next = () => Assert.fail();
				const appended = riter.append();
				Assert.equal(appended, riter);
				Assert.equal(appended.asyncIter, iter);
			}

			testWith([1, 2, 3]);
			testWith('noop');
		});
	});

	describe('#compare()', () => {
		async function testWith(lhs_factory, rhs_factory, expected, f) {
			Assert.equal(
				signZero(
					await new AsyncRiter(intoAsync(lhs_factory()))
						.compare(intoAsync(rhs_factory()), f)
				),
				signZero(expected)
			);
			Assert.equal(
				signZero(
					await new AsyncRiter(intoAsync(rhs_factory()))
						.compare(intoAsync(lhs_factory()), f)
				),
				signZero(-expected)
			);
		}

		it('compares two iterators lexicographically', async () => {
			await Promise.all([
				// neither is prefix of the other
				testWith(() => [1, 2, 3, 4], () => [1, 2, 4, 5], -1),
				testWith(() => 'ace', () => 'abcd', 1),
				testWith(() => '123', () => '45', -1),

				// one is prefix of the other
				testWith(() => [1, 2, 3], () => [1, 2, 3, 4, 5], -1),
				testWith(() => 'eatchangmyeong', () => 'eatch', 1),

				// both are same
				testWith(() => [9, 7, 5, 3], () => [9, 7, 5, 3], 0),
				testWith(() => 'foo', () => 'foo', 0),

				// one is empty
				testWith(() => ['a', 'a', 'a'], () => [], 1),
				testWith(() => '', () => 'vs empty', -1),

				// both are empty
				testWith(() => [], () => [], 0),
			]);
		});

		it('accepts user-defined comparator', async () => {
			function reverse_as_number(x, y) {
				return y - x;
			}
			function compare_pair([la, lb], [ra, rb]) {
				return la != ra
					? la - ra
					: lb - rb;
			}
			function by_length(x, y) {
				return x.length - y.length;
			}

			await Promise.all([
				testWith(() => [1, 2, 4], () => [5, 7, 8], 1, reverse_as_number),
				testWith(() => ['123'], () => ['45'], -1, reverse_as_number),
				testWith(
					() => [[3, 5], [9, 2], [-5, -4]],
					() => [[3, 5], [9, 1], [-5, -4]],
					1, compare_pair
				),
				testWith(
					() => [[3, 5], [9, 2], [-5, -4]],
					() => [[3, 5], [10, 2], [-5, -4]],
					-1, compare_pair
				),
				testWith(() => ['ab', 'cd'], () => ['ef', 'g'], 1, by_length),
			]);
		});

		it('rejects non-function argument', async () => {
			async function testWith(lhs, rhs, f) {
				await Assert.rejects(
					new AsyncRiter(intoAsync(lhs)).compare(intoAsync(rhs), f),
					TypeError
				);
			}

			await Promise.all([
				testWith([1, 2], [3, 4], true),
				testWith([4, 5], [6], 2),
				testWith([], [[]], 2n),
				testWith('asdfasdf', 'asdfasdf', 'asdfasdf'),
				testWith('qw', 'er', {}),
				testWith('zx', 'cv', []),
			]);
		});

		it('accepts promise as callback return value', async () => {
			async function async_as_number(x, y) {
				return x - y;
			}

			await Promise.all([
				testWith(() => [1, 2, 4], () => [5, 7, 8], -1, async_as_number),
				testWith(() => ['123'], () => ['45'], 1, async_as_number),
			]);
		});

		it('never returns negative zero or NaN', async () => {
			async function testWith(iter_factory, f) {
				const result = await new AsyncRiter(intoAsync(iter_factory()))
					.compare(intoAsync(iter_factory()), f);
				Assert.notEqual(result, -0);
				Assert.notEqual(result, NaN);
			}
			function always_minus_zero() {
				return -0;
			}
			function maybe_minus_zero() {
				return Math.random() < 0.5 ? 0 : -0;
			}
			function always_nan() {
				return NaN;
			}
			function maybe_nan() {
				return Math.random() < 0.5 ? 0 : NaN;
			}

			await Promise.all([
				testWith(() => [1, 2, 3], () => always_minus_zero),
				testWith(() => [], always_minus_zero),
				testWith(() => 'equal_test', always_minus_zero),
				testWith(() => [1, 2, 3], () => maybe_minus_zero),
				testWith(() => [], maybe_minus_zero),
				testWith(() => 'equal_test', maybe_minus_zero),
				testWith(() => [1, 2, 3], () => always_nan),
				testWith(() => [], always_nan),
				testWith(() => 'equal_test', always_nan),
				testWith(() => [1, 2, 3], () => maybe_nan),
				testWith(() => [], maybe_nan),
				testWith(() => 'equal_test', maybe_nan),
			]);
		});
	});

	describe('#concat()', () => {
		it('concatenates two iterators together', async () => {
			async function testWith(lhs, rhs, expected) {
				await asyncIterEqual(
					new AsyncRiter(intoAsync(lhs)).concat(intoAsync(rhs)),
					intoAsync(expected)
				);
			}

			await Promise.all([
				testWith([1, 2, 3], [4, 5, 6], [1, 2, 3, 4, 5, 6]),
				testWith('Async', 'Iterator', 'AsyncIterator'),
				testWith([1, 2, 3], [], [1, 2, 3]),
				testWith([], [1, 2, 3], [1, 2, 3]),
				testWith([], [], []),
			]);
		});
		it('also concatenates three or more iterators', async () => {
			async function testWith(lhs, rhs, expected) {
				await asyncIterEqual(
					new AsyncRiter(intoAsync(lhs))
						.concat(...rhs.map(intoAsync)),
					intoAsync(expected)
				);
			}

			await Promise.all([
				testWith([1, 2], [[3, 4], [5, 6]], [1, 2, 3, 4, 5, 6]),
				testWith('foo', ['bar', 'baz', 'quux'], 'foobarbazquux'),
				testWith([10], [[], [], []], [10]),
			]);
		});
		it('is no-op if no arguments are provided', () => {
			function testWith(lhs) {
				const
					riter = new AsyncRiter(intoAsync(lhs)),
					iter = riter.asyncIter;
				iter.next = () => Assert.fail();
				const concatted = riter.concat();
				Assert.equal(concatted, riter);
				Assert.equal(concatted.asyncIter, iter);
			}

			testWith([1, 2, 3]);
			testWith('noop');
		});
	});

	describe('#every()', () => {
		it('consumes the iterator until the first mismatch', async () => {
			const riter = new AsyncRiter(intoAsync([1, 3, 5, 7, 10, 11, 14]));
			await riter.every(x => x % 2 === 1);
			await asyncIterEqual(riter, intoAsync([11, 14]));
		});

		it('returns true if every element matches', async () => {
			async function testWith(iterable, f) {
				Assert.equal(
					await new AsyncRiter(intoAsync(iterable)).every(f),
					true
				);
			}

			await Promise.all([
				testWith([1, 3, 5, 7, 9], x => x % 2 === 1),
				testWith(new Set([-3, -5, -7, -8]), x => x < 0),
				testWith('eatchangmyeong', x => x.toLowerCase() === x),
				testWith([], () => false), // should vacuously return true
			]);
		});

		it('returns false if any element does not match', async () => {
			async function testWith(iterable, f) {
				Assert.equal(
					await new AsyncRiter(intoAsync(iterable)).every(f),
					false
				);
			}

			await Promise.all([
				testWith([1, 3, 5, 7, 10], x => x % 2 === 1),
				testWith(new Set([-3, -5, 7, -8]), x => x < 0),
				testWith('EatChangmyeong', x => x.toLowerCase() === x),
			]);
		});

		it('rejects non-function argument', async () => {
			async function testWith(iterable, f) {
				await Assert.rejects(
					new AsyncRiter(intoAsync(iterable)).every(f),
					TypeError
				);
			}

			await Promise.all([
				testWith([1, 2, 3, 4, 5], true),
				testWith([1, 3, 5, 7, 9], 2),
				testWith([4, 6, 8], 2n),
				testWith('asdfasdf', 'asdfasdf'),
				testWith('qwer', {}),
				testWith('zxcv', []),
			]);
		});

		it('accepts promise as callback return value', async () => {
			async function testWith(iterable, f, returns) {
				Assert.equal(
					await new AsyncRiter(intoAsync(iterable)).every(x => Promise.resolve(f(x))),
					returns
				);
			}

			await Promise.all([
				testWith([2, 4, 6], x => x % 2 === 0, true),
				testWith([3, 6, 8], x => x % 3 === 0, false),
			]);
		});
	});

	describe('#some()', () => {
		it('consumes the iterator until the first match', async () => {
			const riter = new AsyncRiter(intoAsync([1, 3, 5, 7, 10, 11, 14]));
			await riter.some(x => x % 2 === 0);
			await asyncIterEqual(riter, intoAsync([11, 14]));
		});

		it('returns true if any element matches', async () => {
			async function testWith(iterable, f) {
				Assert.equal(
					await new AsyncRiter(intoAsync(iterable)).some(f),
					true
				);
			}

			await Promise.all([
				testWith([1, 3, 5, 7, 9], x => x % 2 === 1),
				testWith(new Set([-3, -5, -7, -8]), x => x < -7),
				testWith('EatChangmyeong', x => x.toUpperCase() === x),
			]);
		});

		it('returns false if no elements match', async () => {
			async function testWith(iterable, f) {
				Assert.equal(
					await new AsyncRiter(intoAsync(iterable)).some(f),
					false
				);
			}

			await Promise.all([
				testWith([1, 3, 5, 7, 9], x => x % 2 === 0),
				testWith(new Set([-3, -5, -7, -8]), x => x >= 0),
				testWith('EATCHANGMYEONG', x => x.toLowerCase() === x),
				testWith([], () => true), // should vacuously return false
			]);
		});

		it('rejects non-function argument', async () => {
			async function testWith(iterable, f) {
				await Assert.rejects(
					new AsyncRiter(intoAsync(iterable)).some(f),
					TypeError
				);
			}

			await Promise.all([
				testWith([1, 2, 3, 4, 5], true),
				testWith([1, 3, 5, 7, 9], 2),
				testWith([4, 6, 8], 2n),
				testWith('asdfasdf', 'asdfasdf'),
				testWith('qwer', {}),
				testWith('zxcv', []),
			]);
		});

		it('accepts promise as callback return value', async () => {
			async function testWith(iterable, f, returns) {
				Assert.equal(
					await new AsyncRiter(intoAsync(iterable)).some(x => Promise.resolve(f(x))),
					returns
				);
			}

			await Promise.all([
				testWith([3, 5, 6], x => x % 2 === 0, true),
				testWith([4, 7, 10], x => x % 3 === 0, false),
			]);
		});
	});

	describe('#toSync()', () => {
		it('consumes the AsyncRiter to create a Riter', async () => {
			async function testWith(iterable) {
				const riter = new AsyncRiter(intoAsync(iterable));
				Assert.ok(await riter.toSync() instanceof Riter);
				asyncIterDone(riter);
			}

			await Promise.all([
				testWith([1, 2, 3]),
				testWith('qwer'),
			]);
		});
		it('yields the same elements as the original', async () => {
			async function testWith(iter_factory) {
				iterEqual(
					await new AsyncRiter(intoAsync(iter_factory())).toSync(),
					iter_factory()
				);
			}

			await Promise.all([
				testWith(() => [1, 2, 3]),
				testWith(() => 'async_to_sync'),
				testWith(() => ['abc', 'def', 'ghi']),
			]);
		});
	});
});
