
import { AsyncEach } from "./main/core/AsyncEach.js";
import assert from "assert";
import { What } from "./main/core/What.js";

const f = What.as(i => [-i, +i]);
const g = f.which((arg, val) => val > 0);
console.log([...g.what(0)]); // -> [0]
console.log([...g.what(1)]); // -> [1]

