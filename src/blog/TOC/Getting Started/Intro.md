# Introduction to `@fizzwiz/fluent`

This library introduces two core classes — `Each` and `What` — which define **abstract representations of iteration** and **functional computation**, respectively. Both classes share a fluent, expressive set of operations:

`if()`, `then()`, `else()`, `which()`, `when()`, `match()`, `self()`, `each()`, `what()`

These operations enable a unified, elegant syntax for composing both iterations and functional logic.

## A Familiar Problem

If you program in JavaScript, you’ve likely used and appreciated array methods like `filter`, `map`, and `reduce` for their concise and expressive power. These tools allow you to model even complex operations in a few readable lines.

However, their main limitation is that they always return **fully evaluated arrays**. For example, when trying to find the first element of an array `aa` that satisfies a predicate:

```javascript
const got = aa.filter(predicate)[0];
```

This approach unnecessarily computes the **entire filtered array**, even if you only need the **first matching element**.

## The Power of `Each`

The `Each` class defines **iterations abstractly** — without immediately executing them. Each transformation returns a **new formal definition**, and the iteration is only resolved when you explicitly call `what()`.

Here’s how it works:

```javascript
const got = Each.as(aa).which(predicate).what();
```

- `Each.as(aa)` defines the iteration over the array `aa`.
- `.which(predicate)` restricts the iteration to values that satisfy the predicate.
- `.what()` resolves the first value in the filtered sequence.

Until `what()` is called, **nothing is executed** — all operations are **declarative**.

## Infinite Iterations? No Problem

With `Each`, even **infinite sequences** like the natural numbers (`Each.NATURAL`) can be defined and manipulated in the same way:

```javascript
const firstOdd = Each.NATURAL
  .which(n => n % 2 === 1)
  .what(); // => 1
```

The ability to handle infinite iterations **elegantly and lazily** was a major motivation for creating this library.

## The Search-and-Select Pattern

Infinite iterations naturally arise in a unifying concept I call the **Search-and-Select Pattern**, a powerful approach for solving a wide range of **optimization problems**.

In this pattern:

- A **search space** is modeled by the `What` class.
- A **search** is expressed as an iteration via the `Each` class.
- A **priority queue** (from the companion library `@fizzwiz/sorted`) is used to manage search order.

A quick introduction to the pattern is [here](p/Search-And-Select).
We'll explore this pattern more deeply in future articles.

## A Library That Matches Your Thinking

While this library was designed with a powerful patterns in mind, `Each` and `What` can be appreciated even outside that context. They offer a **fluent, natural syntax** that allows your code to mirror your thought process.

> _"Make your code align with your thoughts!"_ — that’s the motto of `@fizzwiz/fluent`.

## Documentation and More

- 📄 Auto-generated API documentation is available at: [GitHub Pages](https://fizzwiz.github.io/fluent)
- 📚 This blog provides a more conceptual, example-driven tour of the library.
