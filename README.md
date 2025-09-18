# @fizzwiz/fluent

> Mirror the natural flow of thought in your code.

`@fizzwiz/fluent` is a **lightweight and expressive** JavaScript library that simplifies complex logic
into elegant, intuitive, and fluent syntax. It encourages code that reads like natural language,
while remaining concise and powerful.

---

## ✨ Features

* 🧠 **Thoughtful API** – Code reads like how you think.
* 🧩 **Modular Structure** – Clean separation by concept and responsibility.
* 🚀 **Dual Environment Support** – Works in both Node.js and browsers.
* ⚡ **Async Support** – Seamlessly handle promises and async iterables with `AsyncEach`.
* 📚 **Zero Learning Curve** – Familiar, fluent, and instantly productive.

---

## 🧠 Guides & Concepts

Learn how to apply fluent thinking in real-world code:
👉 [fluent.blog.fizzwiz.cloud](https://fluent.blog.fizzwiz.cloud)

---

## ➰ `Each` Class — Abstract Iteration

The `Each` class represents a composable, lazy iterable. It defines an `[Symbol.iterator]()` method and enables expressive operations for building and manipulating iterations without eagerly executing them.

### Key Highlights

* **Fluent operations:** filter, map, reduce, combine, and traverse sequences.
* **Supports infinite and recursive sequences** with lazy evaluation.
* **Declarative composition:** slice, zip, concatenate, and compute Cartesian products.

---

## 🌀 `AsyncEach` Class — Asynchronous Iteration

The `AsyncEach` class complements `Each` by providing a fluent interface for **async iterables and promises**. It allows the same composable operations as `Each`, but asynchronously.

### Key Highlights

* **Async resolution:** `.when()` without arguments converts iterables of promises into an `AsyncEach`.
* **Fluent async transformations:** `sthen()`, `if()`, `else()`, `match()`, and `each()` work with async iterables.
* **Seamless integration:** Combine synchronous `Each` and asynchronous `AsyncEach` pipelines.
* **Lazy async evaluation:** No promises are awaited until iteration occurs.

### Example

```js
const results = Each.of(
  Promise.resolve(1),
  Promise.resolve(2),
  Promise.resolve(3)
)
.sthen(async n => n * 2);

for await (const value of results.when()) {  // await when() the promised results are available
  console.log(value); // 2, 4, 6
}
```

---

## ❓ `What` Class — Functional Abstraction

The `What` class provides a functional abstraction for **declarative, functional logic**. Every `What` returned by its methods is **callable as a function** and, at the same time, provides a **fluent semantic** to restrict, compose, and transform functions.

### Key Highlights

* Works seamlessly with `Each` and `AsyncEach`.
* Supports the **same 9 core semantic methods** shared across all three classes.

### Example

```js
const double = What.as(x => x * 2);
const result = double.what(5);
console.log(result); // 10
console.log(double.what(5) === double(5)); // true

const conditional = double.if(x => x >= 3).else(x => x);
console.log(conditional.what(2)); // 2
console.log(conditional.what(4)); // 8
```

---

## ⚙️ Shared Semantic Across Classes

`Each`, `AsyncEach`, and `What` share a **common fluent API** composed of 9 methods:

| Method    | Purpose                                           |
| --------- | ------------------------------------------------- |
| `if()`    | Conditional filtering                             |
| `sthen()` | A safe then, distinguishable from thenable `then` |
| `else()`  | Fallback for undefined or missing values          |
| `which()` | Filter sequences by predicate                     |
| `when()`  | Slice sequences or resolve async iterables        |
| `match()` | Zip or match multiple sequences                   |
| `each()`  | Cartesian product or nested expansion             |
| `self()`  | Infinite repetition or functional path expansion  |
| `what()`  | Reduce or retrieve single value                   |

This unified interface allows **seamless interchange** between synchronous iteration (`Each`), asynchronous iteration (`AsyncEach`), and functional abstraction (`What`) without breaking the natural flow of your code.

---

## 🧠 Philosophy

The design of `@fizzwiz/fluent` encourages:

* **Lazy evaluation** — computations occur only when needed.
* **Fluent composition** — operations chain naturally.
* **Clear distinction from native promises** — `sthen()` avoids ambiguity with thenable Promises in built-in constructs (`then`/`await`).
* **Declarative problem solving** — express complex sequences and logic as readable statements which can even handle infinite iterations.
