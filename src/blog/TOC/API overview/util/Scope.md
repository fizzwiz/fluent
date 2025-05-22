# 🌲 `Scope` Class – Tree-Based Contextual Structure

The `Scope` class is a foundational utility in the `util` package. It defines a tree structure where each node (i.e., a `Scope`) can have a **parent** and a collection of **named children**. This design allows flexible construction and traversal of hierarchical data or computation contexts.

## 📦 Constructor and Properties

| Signature                             | Description                               |
|---------------------------------------|-------------------------------------------|
| `new Scope(parent = undefined, children = {})` | Creates a new Scope node with optional parent and child Scopes. |
| `parent`                              | The parent `Scope` of the current node.   |
| `children`                            | An object mapping names to child `Scope`s. |

Each `Scope` acts as a **named tree node**, where its `children` object stores child scopes keyed by name.

## 🔧 Mutating Methods

All mutating methods return the `Scope` instance itself to allow **method chaining**.

| Signature                  | Description                                  |
|----------------------------|----------------------------------------------|
| `letParent(parent)`        | Sets the parent of this `Scope`.             |
| `let(name, value)`         | Sets a property on this `Scope`.             |
| `letChild(name, child)`    | Adds a named child `Scope`.                  |

These methods make it possible to build complex hierarchical structures fluently:

```js
scope.letParent(parent).let('x', 10).letChild('sub', childScope);
```

## 🧭 Navigating Upward

`Scope` provides methods to **navigate upward** through the hierarchy:

| Signature     | Description                          |
|---------------|--------------------------------------|
| `root()`      | Returns the root of the Scope tree.  |
| `ancestors()` | Iterates through all ancestor Scopes.|

> 🔍 Note: **Downward navigation is intentionally omitted**, for reasons explained in the upcoming Use Cases section of the documentation.

## 💡 Summary

`Scope` is a flexible, tree-based structure ideal for representing nested environments, symbol tables, or computation contexts. Its method chaining and upward traversal capabilities make it a powerful building block for more advanced constructs like `Path` and `Thought`.
