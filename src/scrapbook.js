import { What } from "./main/core/What.js";
import { AsyncWhat } from "./main/core/AsyncWhat.js";
import { Path } from "./main/util/Path.js";
import assert from "assert";
import { Each } from "./main/core/Each.js";
const f = AsyncWhat.as(async x => x * 2).self(['a'], 'b');
console.log(await f({ a: 5 })); // -> { a: 5, b: 10 }
