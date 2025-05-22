import { What } from "./main/core/What.js";
import assert from "assert";

const source = What.as(() => [1, 2, 3, 4]);
const filtered = source.which(n => n % 2 === 0);
console.log(filtered.what().toArray());


