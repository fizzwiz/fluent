# 🦶 Path Class

A potential solution to a given problem is often searched by generating sequences of choices. Representing the sequence as an array would require duplicating the entire sequence with each new step which, of course, is not efficient. A more efficient approach uses an immutable pair, consisting of a pointer to the previous sequence (`prev`) and the most recent step (`last`). This design allows for immediate extension by simply creating a new pair. This is precisely the purpose of the `Path` class.

Formally, the `Path` is a `Scope` whose `children` property is undefined. The property `prev` simply retrieves the parent `Path`.

## 📦 Constructor and Properties

| Signature                            | Description            |
|-------------------------------------|------------------------|
| `constructor(prev=undefined, last=undefined)` | Creates the Path       |
| `prev`                              | The parent Path        |
| `last`                              | The last step          |
| `length`                            | Length of this Path    |

The `Path` is an immutable pair composed of a previous Path and a final step. An additional property conveniently stores the path length. 

## 🔧 Static Creator

| Signature             | Description                             |
|-----------------------|-----------------------------------------|
| `of(...steps)`        | Instantiates a new Path from a sequence of steps |

Any sequence of steps can give a Path.

## 🧊 Immutability

Immutability is crucial as the same instance is shared among all extending paths. Consequently, none of the class methods can alter the instance.

## ➕ Methods for Extending the Path

| Signature             | Description                                                        |
|-----------------------|--------------------------------------------------------------------|
| `add(step)`           | Creates and returns a new instance by prolonging this Path         |
| `along(steps)`        | Adds, sequentially, all the steps and returns the last Path        |
| `across(steps)`       | Adds, in parallel, each step to this Path. Returns `Each` of Paths |

None of these methods modifies the `Path`. All of them create new paths. The method `across()` is especially useful for multiplying the `Path` across several parallel steps.

### ⧉ Snippet: `along()`

The steps are appended to the path. A single path is returned.

### ⧉ Snippet: `across()`

The steps multiply the path. An iteration of paths is returned.

## 🔁 Iteration and toArray

It’s important to emphasize that, as a `Scope`, the `Path` can only be iterated in reverse order, through the inherited `ancestors()` method. However, a custom `toArray()` method is provided, allowing iteration of the steps in their natural order from first to last. 

### 📋 The `toArray()` Method

| Signature                                 | Description                                                                     |
|-------------------------------------------|---------------------------------------------------------------------------------|
| `toArray(n=this.length, f=step => step)`  | Last `n` steps of this Path, in their natural order. A map function `f` can also be passed |

### ⧉ Snippet: `toArray()`
// Get the last two steps of a path, in natural order
```js
const path = Path.of('a', 'b', 'c', 'd');
const lastTwo = path.toArray(2); 
console.log(lastTwo);// => ['c', 'd']
```

## 📐 Use Case

As we will see, the concept of `Path` will be particularly useful in combinatorics calculations.
