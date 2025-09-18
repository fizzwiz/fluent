import { What } from "./main/core/What.js";
import { Path } from "./main/util/Path.js";

const f = What.as(x => [x, x + 1]);
const g = y => [y, y * 2];
const h = f.each(g);

// Applies g on each result returned by f
const results = h(2);  // -> [2, 4, 3, 6]   
console.log(results.toArray());
