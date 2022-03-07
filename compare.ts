// https://tc39.es/ecma262/multipage/indexed-collections.html#sec-sortcompare

function default_compare_fn(x: unknown, y: unknown): number {
	// `${x}` works like ToString(x)
	// https://tc39.es/ecma262/multipage/ecmascript-language-expressions.html#sec-template-literals-runtime-semantics-evaluation
	const xstring = `${x}`, ystring = `${y}`;
	return xstring < ystring
		? -1
	: ystring < xstring
		? 1
		: 0;
};

export function sync<T>(
	x: T, y: T,
	fn: (a: T, b: T) => number = default_compare_fn
) {
	if(x === undefined) {
		return y === undefined
			? 0
			: 1;
	}
	if(y === undefined)
		return -1;
	const v = +fn.call(undefined, x, y);
	return v !== v
		? 0
		: v;
};
export async function async<T>(
	x: T, y: T,
	fn: (a: T, b: T) => number | Promise<number>
		= default_compare_fn
) {
	if(x === undefined) {
		return y === undefined
			? 0
			: 1;
	}
	if(y === undefined)
		return -1;
	const v = +await fn.call(undefined, x, y);
	return v !== v
		? 0
		: v;
};