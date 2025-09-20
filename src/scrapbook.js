import { What } from "./main/core/What.js";
import { Path } from "./main/util/Path.js";
import assert from "assert";
import { Each } from "./main/core/Each.js";

// Working with Promises
const each = Each.of(
  Promise.resolve(1),
  Promise.resolve(2),
  Promise.resolve(3)
)
.sthen(p => p.then(n => n * 2)); 

// Converting an iterable of promises into an async iterable of (non-resolved-yet) values
const asyncEach = each.when();

// Iterating the async iterable
for await (const value of asyncEach) { 
  console.log(value); // 2, 4, 6
}

// Working with values through the AsyncEach interface
const transformed = asyncEach.sthen(async n => n * 2); 

// Actually generating the values
const values = await transformed.toArray(); // [4, 8, 12]

for (const value of values) {
  console.log(value); // 4, 8, 12
}

