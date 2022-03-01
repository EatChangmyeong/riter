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

### new Riter(iterable)

### new AsyncRiter(asyncIterable)

## Note to self

* [TypeScript type definition](https://github.com/microsoft/TypeScript/tree/main/lib)
* [Rust's `Iterator` trait](https://doc.rust-lang.org/stable/std/iter/trait.Iterator.html)
