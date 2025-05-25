
# 🧠 The Search-and-Select Pattern

If you zoom out and look at the big picture, you'll notice a recurring theme throughout this library: a love for abstraction and a flair for formalism. But this isn’t just a clever trick or a stylistic quirk — it reflects a unified design philosophy at the heart of the whole library.

And that philosophy? Making programming *actually* easy — by embracing the kinds of patterns we already use in everyday reasoning.

Let’s rewind a bit.

When we introduced the `What` class, we focused on a special kind of function — **multivalued functions**, or functions that return iterables instead of single values.

There are two rich ways to interpret this:

1. **Uncertainty** — the function doesn’t yet know the answer, so it gives you a few possibilities to work with.
2. **Exploration** — when the return values are of the same type as the input, the function becomes a kind of map: starting at one point, it shows you all the directions you could go next.

That second view unlocks something powerful: multivalued functions as **search spaces**.

## 🧭 Step by Step Toward a Solution

Imagine solving a tough problem. You don’t leap straight to the answer — you make a guess, tweak it, explore a few variations, toss out the bad ones, and gradually zero in on something that works.

That’s what a **search space** gives you. You start with a rough idea and refine it step by step. Each time, you:

- Pull the most promising candidate from a queue
- Push in all the nearby options — the "neighbors"
- Discard the least promising ones if the queue gets full

You're both **searching** through possibilities and **selecting** what to keep. That’s the essence of the **Search-and-Select Pattern**.

## 🧰 What You Need

To make this pattern work, you just need three things:

- A class to define a **queue** of candidate solutions
- A class to define and compose a **space**
- A class to define, filter, and map a **search**

This setup should let you:

- Define all potential solutions without generating them all
- Find a valid solution early — as soon as one matches your criteria
- Restrict or transform the search however you like

Sound familiar? That’s exactly what the `Each` and `What` classes are built to do.

## 📦 Enter `@fizzwiz/sorted.js`

The companion library [`@fizzwiz/sorted.js`](https://sorted-js.blogspot.com) gives you a suite of flexible queues — each reflecting a different search strategy.

Every queue supports:

- `let()` — to kick off the search from an initial value
- `search()` — to return an `Each`, describing all the reachable candidates

## 💡 Snippet: Filtering, Mapping, and Resolving a Search

```javaScript
const 
    search = new ArrayQueue()
        .let(start)
            .search(space),
    result = search
        .which(predicate)
            .then(map)
                .what();
```

Here’s what’s going on:

- `ArrayQueue()` gives us a basic FIFO queue.
- `.let(start)` begins the search from a starting point.
- `.search(space)` defines a path of all reachable candidates — but doesn’t run it yet.
- `.which(predicate)` filters out unwanted paths.
- `.then(map)` transforms the survivors.
- `.what()` runs the search and returns the first good result.

✨ Clean. Composable. Easy to reason about.

## 🎯 Why this pattern matters

Because when code starts to feel messy or tangled, there’s a good chance it’s secretly a search-and-select problem in disguise. And once you *see it that way*, things click. You can untangle the mess with just a few well-chosen, expressive method calls — clean, focused, and easy to follow.