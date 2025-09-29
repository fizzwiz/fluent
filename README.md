# 👅 @fizzwiz/fluent

> Mirror the natural flow of thought in your code.

`@fizzwiz/fluent` is a **lightweight and expressive** JavaScript library that transforms complex logic into elegant, intuitive, and fluent syntax. It encourages code that reads like natural language while remaining concise and powerful.

---

## ✨ Features

* 🧠 **Thoughtful API** – Code reads the way you think.
* 🧩 **Modular Structure** – Clean separation by concept and responsibility.
* 🚀 **Dual Environment Support** – Works in both Node.js and browsers.
* ⚡ **Async Support** – Handle promises and async iterables seamlessly with `AsyncEach` and `AsyncWhat`.
* 📚 **Zero Learning Curve** – Instantly productive with familiar, fluent patterns.

---

## 🧠 Guides & Concepts

Learn how to apply fluent thinking in real-world code:
👉 [fluent.blog.fizzwiz.cloud](https://fluent.blog.fizzwiz.cloud)

---

## ➰ `Each` Class — Abstract Iteration

The `Each` class represents a composable, **lazy iterable**. It implements `[Symbol.iterator]()` and enables expressive operations for building and manipulating sequences without eager execution.

### Key Highlights

* **Fluent operations:** like Array `filter`, `map`, `reduce` available on any Iterable.
* **Supports infinite and recursive sequences** through lazy evaluation.
* **Declarative composition:** like `slice`, `zip`, `concat`, and compute Cartesian products.

---

## ⏳➰ `AsyncEach` Class — Asynchronous Iteration

`AsyncEach` complements `Each` by providing a fluent interface for **async iterables and promises**. It implements `[Symbol.asyncIterator]()` and allows the same composable operations as `Each`, but asynchronously.

### Key Highlights

* **Async resolution:** `.when()` converts iterables of promises into an `AsyncEach` of resolved values.
* **Fluent async transformations:** `sthen()`, `if()`, `else()`, etc., work with async functions or promises.
* **Seamless integration:** Combine synchronous `Each` and asynchronous `AsyncEach` pipelines.
* **Lazy async evaluation:** Promises are awaited only when iterated.

### Example

```js
// Working with Promises
const each = Each.of(
  Promise.resolve(1),
  Promise.resolve(2),
  Promise.resolve(3)
)
.sthen(p => p.then(n => n * 2));

// Converting an iterable of promises into an async iterable of resolved values
const asyncEach = each.when();

// Iterating the async iterable
for await (const value of asyncEach) {
  console.log(value); // 2, 4, 6
}

// Working with values through the AsyncEach interface
const transformed = asyncEach.sthen(n => n * 2);

// Actually generating the values
const values = await transformed.toArray(); // [4, 8, 12]

for (const value of values) {
  console.log(value); // 4, 8, 12
}
```

---

## ❓ `What` Class — Functional Abstraction

`What` provides a **declarative, functional abstraction**. Every `What` instance is **callable as a function** and provides a **fluent interface** to compose, restrict, and transform functions.

### Key Highlights

* Works seamlessly with `Each` and `AsyncEach`.
* Supports the **same 9 core semantic methods** shared across all classes.

### Example

```js
const double = What.as(x => x * 2);
console.log(double(5)); // 10
console.log(double.what(5) === double(5)); // true

const conditional = double.if(x => x >= 3).else(x => x);
console.log(conditional.what(3)); // 6
console.log(conditional.what(2)); // 2
```

---

## ⏳❓ `AsyncWhat` Class — Asynchronous Functional Abstraction

`AsyncWhat` extends `What` into the **asynchronous domain**, allowing fluent composition of async functions. Like `What`, it is **callable** and **chainable**, but always returns **Promises**.

### Key Highlights

* Fully asynchronous functional abstraction.
* Integrates seamlessly with `Each`, `AsyncEach`, and `What`.

### Example

```js
// A synchronous What
const double = What.as(x => x * 2);

// Create a conditional AsyncWhat using an asynchronous predicate
const conditional = double
  .when(async x => x >= 3) // async predicate converts What → AsyncWhat
  .else(x => x);           // chain fluency is preserved

// Use the conditional function
console.log(await conditional(2)); // 2
console.log(await conditional(4)); // 8
```

---

## ⚙️ Shared Semantic Across Classes

`Each`, `AsyncEach`, `What`, and `AsyncWhat` share **9 core fluent methods**:

| Method    | Purpose                                         |
| --------- | ----------------------------------------------- |
| `if()`    | Input filtering                                 |
| `sthen()` | Safe then, distinct from promise `.then`        |
| `else()`  | Fallback for undefined values or errors         |
| `which()` | Output filtering                                |
| `when()`  | Bridges sync & async                            |
| `match()` | Zip multiple sequences                          |
| `each()`  | Cartesian product or nested expansion           |
| `self()`  | Infinite repetition or argument/context binding |
| `what()`  | Reduce or retrieve a single value               |

This unified API allows **interchangeable use** between synchronous (`Each` / `What`) and asynchronous (`AsyncEach` / `AsyncWhat`) pipelines without breaking the natural flow of your code.

---

## 🧠 Philosophy

`@fizzwiz/fluent` is designed to encourage:

* **Lazy evaluation** — computations occur only when needed.
* **Fluent composition** — operations chain naturally.
* **Declarative problem solving** — express complex sequences and logic as readable statements, including infinite iterations and workflows distributed among several machines.

---

## 🔗 Links

* 📚 [In-depth guides on the blog](https://fluent-js.blogspot.com)
* 🌐 [Bundle version for browser execution (jsDelivr)](https://cdn.jsdelivr.net/gh/fizzwiz/fluent/dist/fluent.bundle.js)
* 💬 [GitHub Pages](https://fizzwiz.github.io/fluent/)
* 🐱 [GitHub Sources](https://github.com/fizzwiz/fluent)
