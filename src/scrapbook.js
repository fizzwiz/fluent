import { What } from "./main/core/What.js";
import { Path } from "./main/util/Path.js";
import assert from "assert";

const f = What.as(x => x);
const g = f.when(async x => x > 0);

assert.strictEqual(typeof f(0), 'number');
assert.ok(g(0) instanceof Promise);

(async () => {      
  let result = await g(0);
  assert.strictEqual(result, undefined);

  result = await g(1);
  assert.strictEqual(result, f(1));
})();

