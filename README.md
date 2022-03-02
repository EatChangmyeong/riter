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
	.filter([i, td] => i % 2 == 1 && td.textContent == 'foo')
	.forEach([, td] => td.textContent += 'bar');

// collect elements of an async iterator into an array
[...await new AsyncRiter(asyncIterable).toSync()]
```

## Usage

For the sake of completeness, an iterable/iterator is object that correctly implements TypeScript's `Iterable<T>`/`Iterator<T>` interface respectively; their `async` counterparts, on the other hand, should correctly implement `AsyncIterable<T>` and `AsyncIterator<T>`.

All methods that accepts and/or returns `number` does not accept `BigInt`s for now, but they might be supported in later updates. Expect poor support for arguments beyond `Number.MAX_SAFE_INTEGER`.

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

Discards next `n` elements away from the iterator until `{ done: true }` is encountered.

**`n`** must be zero or greater; non-integer values are rounded down. **Returns** the number of elements discarded by this call, excluding `{ done: true }` element.

### `new AsyncRiter(asyncIterable: AsyncIterable<T>)`

Constructs a new `AsyncRiter` object.

#### `#asyncIter: AsyncIterator<T>`

Underlying async iterator. You might not want to directly access and/or modify this property.

#### `#next(): Promise<IteratorResult<T>>`

Async iterator implementation for `AsyncRiter` objects.

#### `#[Symbol.asyncIterator](): AsyncIterableIterator<T>`

Async iterable implementation for `AsyncRiter` objects.

#### `#advanceBy(n: number): Promise<number>`

Discards next `n` elements away from the async iterator until `{ done: true }` is encountered.

**`n`** must be zero or greater; non-integer values are rounded down. **Resolves with** the number of elements discarded by this call, excluding `{ done: true }` element.

## Note to self

* [TypeScript type definition](https://github.com/microsoft/TypeScript/tree/main/lib)
* [Rust's `Iterator` trait](https://doc.rust-lang.org/stable/std/iter/trait.Iterator.html)
