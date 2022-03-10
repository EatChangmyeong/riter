# Riter (in development)

An iterator wrapper that supports Rust-style chaining

## Install

TODO: This package is not yet available. Once it's mature enough, you should be able to install it with `npm i --save riter`.

## Example

TODO: actually implement them

```javascript
// select all <td>s at odd indices whose textContent is 'foo', and append 'bar' to each of them
// only for demonstration: you should use :nth-child(odd) selector instead
new Riter(document.querySelectorAll('td'))
	.enumerate()
	.filter(([i, td]) => i % 2 == 1 && td.textContent == 'foo')
	.forEach(([, td]) => td.textContent += 'bar');

// collect elements of an async iterator into an array
[...await new AsyncRiter(asyncIterable).toSync()]
```

## Documentation

For the sake of completeness, an iterable/iterator is object that correctly implements TypeScript's `Iterable<T>`/`Iterator<T>` interface respectively; their `async` counterparts, on the other hand, should correctly implement `AsyncIterable<T>` and `AsyncIterator<T>`.

It doesn't work well with generator object's `.next()` arguments and final `return` value. I don't know how I should deal with them yet.

All methods that accepts and/or returns `number` does not accept `BigInt`s for now, but they might be supported in later updates. Expect poor support for arguments beyond `Number.MAX_SAFE_INTEGER`.

If a method for `Riter` takes a callback, its async counterpart can also handle `async` callbacks (functions that return Promises).

If an error occurs in any `async` method, the method itself won't throw anything; the returned promise will reject instead.

### `new Riter(iterable: Iterable<T>)`

Constructs a new `Riter` object.

#### `#iter: Iterator<T>`

Underlying iterator. You might not want to directly access and/or modify this property.

#### `#next(): IteratorResult<T>`

Iterator implementation for `Riter` objects.

#### `#[Symbol.iterator](): IterableIterator<T>`

Iterable implementation for `Riter` objects.

#### `#advanceBy(n: number): number`

*Eagerly* discards next `n` elements away from the iterator until `{ done: true }` is encountered. The last `{ done: true }` element is also discarded.

**`n`** must be zero or greater; non-integer values are rounded down. **Returns** the number of elements discarded by this call, excluding `{ done: true }` element.

`#skip(n)` might be a better option if it should be done lazily (that is, delayed until the first `next()` call).

#### `#all(f: (a: T) => boolean): boolean`

Alias to `#every()`.

#### `#any(f: (a: T) => boolean): boolean`

Alias to `#some()`.

#### `#append(...values: T[]): Riter<T>`

Appends multiple values at the end of the iterator. That is, it **returns** a new iterator that iterates over the original `Riter`, then each of the arguments **`values`**, one by one.

An `#append()` call with no arguments is a no-op and returns itself.

`#concat()` might be more favorable if you want to add elements of one or more iterators.

#### `#chain(...its: Iterable<T>[]): Riter<T>`

Alias to `#concat()`.

#### `#compare(rhs: Iterable<T>, f?: (a: T, b: T) => number): number`

Compares two iterators lexicographically and, according to the result, **returns**:

* a negative number if `this` compares less than `rhs`,
* a positive number if `this` compares greater than `rhs`, and
* zero if `this` compares equal to `rhs`.

Lexicographic comparison works by comparing elements one-by-one until it encounters a mismatch or at least one of them finishes.

* If either element compares less than the other, the original iterator also compares less.
* If both iterators finish at the same time, they compare equal.
* If either iterator finishes first, that iterator compares less than the other.

This method may return `Infinity` or `-Infinity`, but it never returns `-0` or `NaN`.

A user-defined comparison function **`f`** can be supplied. In which case, `-0` and `NaN` is considered as `0`. In fact, it *is* okay for `f` to return anything other than numbers if `+f(...)` does not throw; returning numbers is still recommended. If `f` is *not* supplied or is `undefined`, it will mirror the behavior of `Array.prototype.sort()`'s default comparator (coerce both into string before comparing).

#### `#concat(...its: Iterable<T>[]): Riter<T>`

Concatenates multiple iterators in a sequence. That is, it **returns** a new iterator that iterates over the original `Riter`, then each of the iterable arguments **`its`**, one by one.

A `#concat()` call with no arguments is a no-op and returns itself.

`#append()` might be more favorable if you want to add a few "independent" elements.

#### `#count(): number`

Alias to `#length()`.

#### `#every(f: (a: T) => boolean): boolean`

**Returns** `true` if and only if every remaining elements matches the given predicate **`f`**.

This method will consume elements out of the iterator until the first mismatch (inclusive). In fact, it *is* okay for `f` to return any truthy/falsy values other than just booleans; returning booleans is still recommended.

It will vacuously return `true` if the iterator is empty.

#### `#length(): number`

Consumes the `Riter` and **returns** the number of elements the `Riter` had before.

#### `#some(f: (a: T) => boolean): boolean`

**Returns** `true` if and only if any of the remaining elements matches the given predicate **`f`**.

This method will consume elements out of the iterator until the first match (inclusive). In fact, it *is* okay for `f` to return any truthy/falsy values other than just booleans; returning booleans is still recommended.

It will vacuously return `false` if the iterator is empty.

#### `#toAsync(): AsyncRiter<T>`

**Returns** an `AsyncRiter` that yields the element of current `Riter` asynchronously. This `AsyncRiter` will consume `Riter`'s element one-by-one, on-demand.

### `new AsyncRiter(asyncIterable: AsyncIterable<T>)`

Constructs a new `AsyncRiter` object.

#### `#asyncIter: AsyncIterator<T>`

Underlying async iterator. You might not want to directly access and/or modify this property.

#### `#next(): Promise<IteratorResult<T>>`

Async iterator implementation for `AsyncRiter` objects.

#### `#[Symbol.asyncIterator](): AsyncIterableIterator<T>`

Async iterable implementation for `AsyncRiter` objects.

#### `#advanceBy(n: number): Promise<number>`

*Eagerly* discards next `n` elements away from the async iterator until `{ done: true }` is encountered. The last `{ done: true }` element is also discarded.

**`n`** must be zero or greater; non-integer values are rounded down. **Resolves with** the number of elements discarded by this call, excluding `{ done: true }` element.

`#skip(n)` might be a better option if it should be done lazily (that is, delayed until the first `next()` call).

#### `#all(f: (a: T) => boolean | Promise<boolean>): boolean`

Alias to `#every()`.

#### `#any(f: (a: T) => boolean): boolean`

Alias to `#some()`.

#### `#append(...values: T[]): AsyncRiter<T>`

Appends multiple values at the end of the iterator. That is, it **returns** a new iterator that iterates over the original `AsyncRiter`, then each of the arguments **`values`**, one by one.

An `#append()` call with no arguments is a no-op and returns itself.

`#concat()` might be more favorable if you want to add elements of one or more iterators.

#### `#chain(...its: AsyncIterable<T>[]): AsyncRiter<T>`

Alias to `#concat()`.

#### `#compare(rhs: AsyncIterable<T>, f?: (a: T, b: T) => number | Promise<number>): Promise<number>`

Compares two async iterators lexicographically and, according to the result, **resolves with**:

* a negative number if `this` compares less than `rhs`,
* a positive number if `this` compares greater than `rhs`, and
* zero if `this` compares equal to `rhs`.

Lexicographic comparison works by comparing elements one-by-one until it encounters a mismatch or at least one of them finishes.

* If either element compares less than the other, the original iterator also compares less.
* If both iterators finish at the same time, they compare equal.
* If either iterator finishes first, that iterator compares less than the other.

This method may resolve with `Infinity` or `-Infinity`, but it never resolves with `-0` or `NaN`.

A user-defined comparison function **`f`** can be supplied. In which case, `-0` and `NaN` is considered as `0`. In fact, it *is* okay for `f` to return anything other than numbers if `+(await f(...))` does not throw; returning numbers is still recommended. If `f` is *not* supplied or is `undefined`, it will mirror the behavior of `Array.prototype.sort()`'s default comparator (coerce both into string before comparing).

#### `#concat(...its: AsyncIterable<T>[]): AsyncRiter<T>`

Concatenates multiple async iterators in a sequence. That is, it **returns** a new async iterator that iterates over the original `AsyncRiter`, then each of the async iterable arguments **`its`**, one by one.

A `#concat()` call with no arguments is a no-op and returns itself.

`#append()` might be more favorable if you want to add a few "independent" elements.

#### `#count(): Promise<number>`

Alias to `#length()`.

#### `#every(f: (a: T) => boolean | Promise<boolean>): boolean`

**Resolves with** `true` if and only if every remaining elements matches the given predicate **`f`**.

This method will consume elements out of the iterator until the first mismatch (inclusive). In fact, it *is* okay for `f` to return any truthy/falsy values other than just booleans; returning booleans is still recommended.

It will vacuously resolve with `true` if the iterator is empty.

#### `#length(): Promise<number>`

Consumes the `AsyncRiter` and **resolves with** the number of elements the `AsyncRiter` had before.

#### `#some(f: (a: T) => boolean): boolean`

**Resolves with** `true` if and only if any of the remaining elements matches the given predicate **`f`**.

This method will consume elements out of the iterator until the first match (inclusive). In fact, it *is* okay for `f` to return any truthy/falsy values other than just booleans; returning booleans is still recommended.

It will vacuously return `false` if the iterator is empty.

#### `#toSync(): Promise<Riter<T>>`

**Resolves with** a `Riter` that yields the element of current `AsyncRiter` synchronously. Due to how JavaScript's `async` works, this will fully comsume the `AsyncRiter`, store its elements in an array, and use it to construct the resulting `Riter`.

## Note to self

* [TypeScript type definition](https://github.com/microsoft/TypeScript/tree/main/lib)
* [Rust's `Iterator` trait](https://doc.rust-lang.org/stable/std/iter/trait.Iterator.html)
