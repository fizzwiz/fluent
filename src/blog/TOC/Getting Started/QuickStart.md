# 🚀 Quick Start Guide: @fizzwiz/fluent

Welcome to `@fizzwiz/fluent`, a library for abstract and composable iteration and functional logic in JavaScript.

This guide will help you get up and running in minutes.

---

## 📦 Installation

Using **npm**:

```bash
npm install @fizzwiz/fluent
```

Using **yarn**:

```bash
yarn add @fizzwiz/fluent
```

## 🔁 Basic Iteration with `Each`

The `Each` class lets you define and manipulate iterations.

```javaScript
import { Each } from '@fizzwiz/fluent';

const firstEven = Each
  .of(1, 2, 3)
  .which(n => n % 2 === 0)
  .what(); // → 2
```

## 🧠 Functional Programming with `What`

The `What` class lets you define and manipulate functions.

```javaScript
import { What } from '@fizzwiz/fluent';

const f = What.as(x => Math.sqrt(x))
  .if(x => x >= 0)
  .else(x => 0); // fallback for negative inputs

console.log(f.what(9));   // → 3
console.log(f.what(-4));  // → 0
```

## 🧪 Composable Logic

Both `Each` and `What` support a shared, fluent syntax for building complex logic through chained transformations:

```javaScript
const customSequence = Each.of(1, 2)
    .else(Each.of(3, 4)); // -> 1, 2, 3, 4
```

## 📚 Explore More

### ✨ Introduction to the Library
A broader overview of the design and philosophy at: [Intro](https://fluent-js.blogspot/p/Intro.html)

### 📄 Full API Reference
Auto-generated API documentation is available at: [GitHub Pages](https://fizzwiz.github.io/fluent)

### 🧾 GitHub Repository
View source, open issues, or contribute at: [GitHub](https://github.com/fizzwiz/fluent)

## 💬 Need Help?

Feel free to leave a comment on the blog.

  “Make your code align with your thoughts!”  
— `@fizzwiz ✨`