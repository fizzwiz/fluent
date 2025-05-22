# 📘 `Each` Class — Abstract Iteration with @fizzwiz/fluent

The Each class represents an abstract, composable, and lazy iterable. It defines an `iterator()` method and enables expressive operations for building and manipulating iterations — without eagerly executing them.

    💡 The core idea is formality: Each transformation defines a new iterable, but nothing is executed until `what()` is called.

The class methods can be organized within 5 abstract cathegories: 

| Method Cathegory      | Description                       |
| --------------------  | --------------------------------  |
| `Instantiation`       | Creates an Each instance          |
| `Comparison`          | Compares two instances            |
| `Restriction`         | Filters items within an instance  |
| `Composition`         | Composes two instances            | 
| `Transformation`      | Transforms an instance            | 

## 🔧 Instantiating an `Each

You can create an Each instance either by implementing your own iterator() or by converting an existing iterable. These are the primary static constructors:

| Signature           | Description                                                 |
| ------------------- | ----------------------------------------------------------- |
| `Each.NATURAL`      | Infinite series of natural numbers: `0, 1, 2, 3, ...`       |
| `Each.of(...items)` | Explicitly enumerates the given items                       |
| `Each.as(items)`    | Converts any iterable (like arrays) into an `Each` instance |

These methods enable you to represent both finite and infinite sequences.

## ⚖️ Comparing Iterations by equality

You can compare two iterations for deep equality — even recursively:
| Signature            | Description                                        |
| -------------------- | -------------------------------------------------- |
| `Each.equal(aa, bb)` | Checks deep equality between two iterations        |
| `each.equals(that)`  | Equivalent to `Each.equal(this, that)`             |

Nested iterations are also compared item by item.

## 🎯 Restricting Iterations

Filtering is a common operation in iteration. Each provides several methods for restriction:

| Signature                                  | Description                                                      |
| ------------------------------------------ | ---------------------------------------------------------------- |
| `if(predicate)`                            | Filters items based on a predicate                               |
| `which(predicate)`                         | Alias for `if()` — interchangeable in `Each`, distinct in `What` |
| `when(predicateOrIndex, start, inclusive)` | Begins/ends iteration when condition or index is met             |

### ⧉ Snippet: `which()`

```js
const evens = Each.NATURAL.which(n => n % 2 === 0); // -> Infinite even numbers
```
### ⧉ Snippet: `when()`
```js
Each.NATURAL
  .when(1, true)
  .when(n => n > 10, false); // -> First 10 naturals, starting from 1
```

## 🧩 Composing Iterations

You can combine iterations in multiple ways:
| Signature     | Description                                                |
| ------------- | ---------------------------------------------------------- |
| `else(that)`  | Appends `that` iteration to `this`                         |
| `match(that)` | Zips two iterations into pairs `[a, b]`                    |
| `each(that)`  | Cartesian product: generates `[a, b]` from both iterations |
| `self()`      | Creates an `Each` of infinite recycled copies of `this`    |


### ⧉ Snippet: `else()`
```js
Each.of(0, 1).else(2); // → 0, 1, 2
```
### ⧉ Snippet: `match()`
```js
Each.of(0, 1).match(Each.of("a", "b")); // → [0, "a"], [1, "b"]
```

## 🧩 Static Composition

Static versions of composition methods support multiple inputs:
| Signature              | Description                                                                  |
| ---------------------- | ---------------------------------------------------------------------------- |
| `Each.else(...those)`  | Appends all iterations sequentially                                          |
| `Each.match(...those)` | Matches corresponding items from all iterations                              |
| `Each.each(...those)`  | Cartesian product: returns a `What` space of paths over all input iterations |


### ⧉ Snippet: `else()` (static)
```js
Each.else(Each.of(0), Each.of(1), Each.of(2));
```
### ⧉ Snippet: `each()` (static)
```js
Each.each(Each.of(0, 1), 2); // → What to generate the cartesian product [0,1] × [2]
```

    💡 Note: Each.each(...aaa) returns a `What`, not an `Each`. This `What` generates Paths of items 
    within the cartesian products of the given factors `...aaa`. Providing a What for generating paths rather than the paths themselves supports early restriction of the search space — a key optimization for combinatorics.

🧠 Early vs. Late Restriction

When solving problems like “generate all paths of length ≤ n without duplicates”:

    Early restriction: apply .which() on the What — prevents generation of bad paths.

    Late restriction: apply .which() on the Each — filters paths after they’re generated.

Both yield the same result, but early restriction is far more efficient.

## 🛠️ Transforming Iterations

Transformation methods let you apply functions or reduce the entire iteration:
| Signature          | Description                                                                 |
| ------------------ | --------------------------------------------------------------------------- |
| `then(f)`          | Applies a function `f` to each item                                         |
| `what(op, start?)` | Reduces items with a binary operation `op`, like `Array.prototype.reduce()` |
| `what()` (no args) | Returns the **first item** — useful for resolving a search                  |


Examples:

```js
Each.NATURAL
  .then(n => 2 * n)
  .which(n => n % 4 === 0)
  .what(); // → First even multiple of 4

Each.of(1, 2, 3).what((a, b) => a + b); // → 6

Each.NATURAL
  .which(n => n > 100)
  .what(); // → 101
```

## 🧠 Summary

The Each class brings formality, fluency, and power to iteration in JavaScript:

    Create lazy, abstract iterations.

    Restrict, transform, and compose them declaratively.

    Seamlessly combine infinite, recursive, or combinatorial logic.

With Each, your iteration logic can match the way you think — clear, composable, and powerful.


---

For further examples and use-cases, see [my blog post](https://yourblog.example.com/what-class-usage-guide).