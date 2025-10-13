import { What } from "./main/core/What.js";
import { AsyncEach } from "./main/core/AsyncEach.js";
import { AsyncWhat } from "./main/core/AsyncWhat.js";
import { Path } from "./main/util/Path.js";
import assert from "assert";
import { Each } from "./main/core/Each.js";
import { EventEmitter } from "events";


let start = Date.now();

const slowFunction = async () => {
  console.log("Function called at:", Date.now() - start, "ms");
};

const retriable = AsyncWhat.retry(slowFunction, 3, 500, 2);

console.log("Before calling retriable()");

// Call it — should **not block thread**
const result = retriable();

console.log("After calling retriable() — should appear immediately");
