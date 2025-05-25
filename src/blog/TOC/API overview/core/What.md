# 🔶 `What` Class — Functional Programming with `@fizzwiz/fluent`

The `What` class defines a functional interface that supports both evaluation and definition of function values based on argument patterns. It parallels the role of the `Each` class for iterables, providing powerful methods to compose, restrict, and transform functions.

## Abstract Methods

A `What` is a function defined by implementing two abstract methods:

| Signature             | Description                  |
| --------------------- | ---------------------------- |
| `what(...args)`       | Retrieves the function value |
| `let(arg, value)`     | Defines the function value   |

### ⧉ Snippet: `What`

```js
// Abstract structure
class What {
  what(...args) {
    throw new Error('abstract method!');
  }

  let(args, value) {
    throw new Error('abstract method!');
  }
}
```

## 🔧 Instantiation

You can instantiate a `What` either by directly implementing the abstract methods, or by converting an existing function or argument-value pair.

| Signature                 | Description                                                                     |
| ------------------------- | ------------------------------------------------------------------------------- |
| `What.of(args, value)`    | Returns a What producing `value` when called with `args`, `undefined` otherwise |
| `What.as(f)`              | Converts an existing function `f` to a What                                     |

### ⧉ Snippet: `of()`

```js
const f = What.of('answer', 42);
console.log(f.what('answer')); // -> 42
```

### ⧉ Snippet: `as()`

```js
const g = What.as(x => x * x);
console.log(g.what(4)); // -> 16
```

If `as()` is used, the resulting `What` retains an abstract `let()` that throws if invoked.

## 🎯 Function Restriction

`What` instances can be restricted using predicates — especially useful when dealing with multivalued functions that return iterables.

Predicates can accept up to three arguments:
- `value`: the individual value from the iterable,
- `i`: the index of the value,
- `arg`: the original input to the function producing the iterable.

| Signature                                       | Description                                                                 |
| ----------------------------------------------- | --------------------------------------------------------------------------- |
| `if(predicate)`                                 | Restricts output to `arg` values where `predicate(arg)` returns true        |
| `which(predicate)`                              | Filters iterable values using `predicate(value, i, arg)`                    |
| `when(predicateOrIndex, start = true, inclusive = start)` | Uses `Each.when` to slice the iterable based on a `predicate(value, i, arg)` or index        |

### ⧉ Snippet: `if()`

```js
const f = What.of(1, 0);
const g = f.if((arg, val) => val !== 0);
console.log(g.what(0)); // -> 1
console.log(g.what(1)); // -> undefined
```

### ⧉ Snippet: `which()`

```js
const f = What.as(i => [-i, +i]);
const g = f.which((arg, val) => val > 0);
console.log([...g.what(0)]); // -> [0]
console.log([...g.what(1)]); // -> [1]
```

### ⧉ Snippet: `when()`

```js
const f = What.as(i => [i - 1, i, i + 1]);
const g = f.when(2, false);
console.log([...g.what(2)]); // -> [1, 2]
```

## 🧩 Function Composition

Just like `Each`, a `What` can be composed via several methods. Composition supports chaining, fallback logic, and parallel execution.

| Signature         | Description                                                                       |
| ----------------- | ------------------------------------------------------------------------          |
| `then(that)`      | Sequential composition: `that(f(arg))`                                            |
| `else(that)`      | Fallback: use `that(arg)` if `this.what(arg)` is `undefined`                      |
| `match(...those)` | Parallel composition: returns `[this(arg), ...those.map(f => f(arg))]`            |
| `each(that)`      | Cartesian composition: returns `that(value)` across iterated values `this(arg)`   |

### ⧉ Snippet: `then()`

```js
const f = What.as(x => x + 1);
const g = What.as(x => x * 2);
const h = f.then(g);
console.log(h.what(3)); // -> 8
```

### ⧉ Snippet: `else()`

```js
const f = What.as(x => x > 0 ? x : undefined);
const g = What.of(42, -1);
const h = f.else(g);
console.log(h.what(-1)); // -> 42
```

### ⧉ Snippet: `match()`

```js
const f = What.as(x => x + 1);
const g = What.as(x => x * 2);
const h = f.match(g);
console.log(h.what(3)); // -> [4, 6]
```

### ⧉ Snippet: `each()`

```js
const f = What.as(x => [x, x + 1]);
const g = What.as(y => [y, y * 2]);
const h = f.each(g);
console.log([...h.what(2)]); // -> [[2,2], [2,4], [3,2], [3,4]]
```

## 🛠️ Transformation via `self()`

The `self()` method transforms a `What` instance for use in context-sensitive or path-based computations.

- **Without arguments**, `self()` assumes each input is a `Path`. It applies the original function to the path’s last element and returns a multivalued result by appending each outcome to the input path—effectively expanding the search space.

- **With a pair `(i, value)`**, the method binds the `i`-th argument of the source function to the specified `value`, returning a new partially applied function.

- **With `(names, name)`**, it creates a function that operates on object inputs. It extracts the specified properties (`names`) from the object, applies the original `What` to these extracted values, and:
  - if `name` is provided, stores the result in the object under that key and returns the modified object;
  - otherwise, returns the computed result directly.

| Signature             | Description                                                                 |
|-----------------------|-----------------------------------------------------------------------------|
| `self()`              | Transforms the function into a path-expanding multivalued search space      |
| `self(i, value)`      | Binds the `i`-th argument to a fixed `value`, producing a partially applied function |
| `self(names, name)`   | Maps object fields to function arguments and stores (or returns) the result |


### ⧉ Snippet: `self()` (Paths)

```js
const f = What.as(x => [x + 1, x + 2]);
const h = f.self();
const paths = h.what([1]);
console.log([...paths]); // -> [[1,2], [1,3]]
```

### ⧉ Snippet: `self()` (Partial Application)

```js
// Original function: sums three numbers
const sum = (a, b, c) => a + b + c;
// Create a What instance with the second argument (index 1) fixed to 10
const partial = What.as(sum).self(1, 10);
// Call with remaining arguments: a and c
console.log(partial.what(2, 3)); // Outputs: 15 => 2 + 10 + 3
```

### ⧉ Snippet: `self()` (Nominal)

```js
const f = What.as(({ a }) => a * 2).self(['a'], 'b');
console.log(f.what({ a: 5 })); // -> { a: 5, b: 10 }
```