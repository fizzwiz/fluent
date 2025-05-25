# ⚡ Early vs. Late Restriction in Combinatorial Search

One of the core design strengths of `@fizzwiz/fluent` is its ability to optimize **combinatorial search** through **early restriction** of the search space — a subtle distinction that can have profound performance implications.

## 🚧 The Problem

Suppose you want to generate all paths of length 3 from the items `[0, 1]`, **without repetitions**.

In many libraries, you generate **all possible paths** and then **filter out** the bad ones. But `@fizzwiz/fluent` allows you to go one step better: filter the bad paths **before** they’re ever constructed.

---

## ⚙️ The Code

Here’s a side-by-side comparison of **early** and **late** restriction:

```js
const 
  // the static version of the `each()` method of the class `Each` provides a `What` of paths rather than an `Each` of arrays
  space = Each.each([0, 1], [0, 1], [0, 1]),

  // ✅ Early restriction: discarding intermediate paths like [0, 0] avoid generation of all its descendant paths like [0, 0, 0]
  earlier = new ArrayQueue()
    .let(new Path())
      .search(space.which(predicate)),

  // ❌ Late restriction: filter paths after they are generated
  latter = new ArrayQueue()
    .let(new Path())
      .search(space)
        .which(predicate);
```

In both versions, the predicate enforces that each path contains no repeated items.

## 🧪 Same Results, Different Cost

Both strategies produce the same final set of valid paths — but their performance is dramatically different:

    ⚡ Early restriction prevents the combinatorial explosion of invalid paths.

    🐌 Late restriction wastes time building and examining paths that are doomed from the start.

For deep or recursive searches, the difference isn’t just academic — it’s the difference between tractable and impossible.