// https://tc39.es/ecma262/multipage/indexed-collections.html#sec-sortcompare

export function default_compare_fn(x: unknown, y: unknown): number {
	// `${x}` works like ToString(x)
	// https://tc39.es/ecma262/multipage/ecmascript-language-expressions.html#sec-template-literals-runtime-semantics-evaluation
	const xstring = `${x}`, ystring = `${y}`;
	return xstring < ystring
		? -1
	: ystring < xstring
		? 1
		: 0;
};

export default function(
	x: unknown, y: unknown,
	fn: (a: unknown, b: unknown) => unknown = default_compare_fn
) {
	if(x === undefined) {
		return y === undefined
			? 0
			: 1;
	}
	if(y === undefined)
		return -1;
	const v = +(fn.call(undefined, x, y) as any);
	return v !== v
		? 0
		: v;
};