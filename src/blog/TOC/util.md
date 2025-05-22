# 📦 The `util` Package

The `util` package provides the three structural classes of the library: `Scope`, and its two derived classes: `Path` and `Thought`.

Unlike the abstract core classes `Each` and `What`, these utility classes do not represent iterations or functions directly. Instead, they serve as contextual and structural tools that enable advanced capabilities in:

- 🧠 Functional programming — through the `Thought` class.
- 🌲 Combinatorial exploration — through the `Path` class.

## 🔧 Classes Overview

| Class   | Description                                                                 |
|---------|-----------------------------------------------------------------------------|
| `Scope` | Base class for contextual data storage and manipulation.                   |
| `Path`  | Extends `Scope` to represent branching sequences, useful in search spaces. |
| `Thought` | Extends `Scope` for functional composition and contextual reasoning.     |

These utility classes empower the `core` classes by carrying state, history, and contextual bindings, making them essential to the expressive power of the library.

They are designed to integrate seamlessly with the `Each` and `What` abstractions without extending them — enabling a clean separation between control logic and data transformation semantics.
