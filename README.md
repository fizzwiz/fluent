The `@ut8pia-cloud/fluent` library is designed to mirror the natural flow of your thoughts in code. It brings syntactic sugar that simplifies the expression of complex concepts, making your code more concise, readable and intuitive. Thanks to its intuitive design, the library requires no learning curve.

The library is organized into four main packages: `core`, `each`, `what`, and `util`. Each package corresponds to a directory containing multiple files, with each file defining a specific class. The `core` package includes abstract definitions for `Each` and `What`, the foundational concepts of the entire library. Classes derived from these concepts are found in the `each` and `what` packages, respectively.

If you’re working on a `Node.js` project, you can easily import and use any class. Here’s an example with the `Each` class:

```javascript
import { Each } from '@ut8pia-cloud/fluent/core/Each.js';
const each = Each.of('a', 'b');
```

Using the library in an HTML page is just as straightforward:

```html
<script src="fluent.bundle.js"></script>
<script type="text/javascript">
    const each = Each.of('a', 'b');
</script>
```

The `fluent.bundle.js` script is available on the `jsdelivr` CDN at [this URL](https://cdn.jsdelivr.net/gh/@ut8pia-cloud/fluent@dist/fluent.bundle.js). When included, this script creates a global `fluent` variable in your browser’s environment, giving you hierarchical access to all the library’s features.

For the latest and most comprehensive documentation, visit the library’s [documentation pages](https://ut8pia-cloud.github.io/fluent).

To explore the concepts behind the library in detail, along with tutorials and example code, refer to the web-site: [www.ut8pia.cloud](www.ut8pia.cloud)

