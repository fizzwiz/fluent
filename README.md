# @fizzwiz/fluent

> Mirror the natural flow of thought in your code.

`@fizzwiz/fluent` is a modern JavaScript library designed to bring elegant syntactic sugar to your code. It simplifies the expression of complex logic and promotes intuitive, readable, and concise development — with zero learning curve.

---

## ✨ Features

- 🧠 **Thoughtful API** – Code reads like natural language.
- 🧩 **Modular Structure** – Organized into logical packages.
- 🚀 **Dual Environment Support** – Use in Node.js or directly in the browser.
- 📚 **Zero Learning Curve** – Intuitive by design.

---

## 📦 Package Structure

The library is organized into four main packages:

| Package  | Description                                       |
|----------|---------------------------------------------------|
| `core`   | Base abstractions: defines `Each` and `What`      |
| `each`   | Classes that extend the `Each` concept            |
| `what`   | Classes that extend the `What` concept            |
| `util`   | Utility functions and general-purpose helpers     |

Each package corresponds to a directory, and each file within defines a single class.

---

## 🛠️ Usage

### ✅ Node.js (ES Modules)

Install via npm:

```bash
npm install @fizzwiz/fluent
```

Then use:

```javascript
import { Each } from '@fizzwiz/fluent/core/Each.js';

const each = Each.of('a', 'b');
```

### ✅ Browser (via CDN)

Include the bundle in your HTML:

```html
<script src="https://cdn.jsdelivr.net/gh/fizzwiz/fluent@v0.0.0-dev.1/dist/fluent.bundle.js">
</script>
<script>
  const each = fluent.Each.of('a', 'b');
</script>
```

This will expose a global fluent object with access to all features.

## 📄 Documentation

### Full API jsDocs:
👉 https://fizzwiz.github.io/fluent

### 📝 Blog & Tutorials

Explore concepts, tutorials, and deep dives:
👉 https://fluent-js.blogspot.com
