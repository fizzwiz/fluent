# 📦 The `core` Package

The `core` package provides the foundational abstractions of the library, centered around two abstract classes: `Each` and `What`.

## ✨ Core Concepts

- **`Each`** represents an abstract iterable. Its central method:
  ```js
  iterator()
  ```
  is expected to be implemented by subclasses or instances. This method should yield a sequence of values.

- **`What`** represents an abstract function. Its main method:
  ```js
  what(...args)
  ```
  defines how the function maps inputs to outputs. Like `Each`, this is an abstract method that must be implemented.

By default, calling these methods without overriding them will raise an `"abstract method!"` error.

## 🧰 Shared Operations

Despite targeting different concepts—iteration and computation—`Each` and `What` expose a **shared interface** for:
- **Restriction**: Filtering results using predicates (`which`, `if`, `when`)
- **Composition**: Chaining and combining behaviors (`then`, `else`, `match`)
- **Transformation**: Rewriting behavior or structure (`self`, `each`, `what`)

This design makes the two classes interoperable and composable, forming the backbone for building expressive data transformations and functional pipelines.

## 🔄 Design Philosophy

Rather than isolating iteration and computation, the `core` package unifies them under a consistent API. Whether you're dealing with sequences (`Each`) or mappings (`What`), you use the same verbs to transform and compose behavior.

This symmetry makes the library intuitive and powerful—turning abstract patterns into concise, reusable logic.
