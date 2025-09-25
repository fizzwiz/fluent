import { describe, it } from 'mocha';
import assert from 'assert';
import { AsyncWhat } from '../../main/core/AsyncWhat.js';
import { Path } from '../../main/util/Path.js';
import { Each } from '../../main/core/Each.js';

describe('AsyncWhat', () => {

  it('as - function, value, AsyncWhat instance', async () => {
    assert.equal(await AsyncWhat.as(x => x + 1).what(2), 3);
    assert.equal(await AsyncWhat.as(5).what(5), 5);
    assert.equal(await AsyncWhat.as(5).what(3), 5);

    const w = AsyncWhat.as(x => x);
    assert.equal(AsyncWhat.as(w), w);
  });

  it('of - value-based match', async () => {
    const one = AsyncWhat.of("one", 1);
    assert.equal(await one.what("one"), 1);
    assert.equal(await one.what("two"), undefined);
  });

  it('if - filters undefined or falsy', async () => {
    const f = AsyncWhat.as(x => x).if(x => x > 0);
    assert.equal(await f(0), undefined);
    assert.equal(await f(1), 1);
  });

  it('which - filters output from multivalued source', async () => {
    const source = AsyncWhat.as(x => x + 1);
    const filtered = source.which(y => y > 0);
    assert.equal(await filtered(-1), undefined);
    assert.equal(await filtered(0), await source(0));
  });

  it('when - asynchronous if', async () => {
    const f = AsyncWhat.as(x => x);
    const g = f.when(async x => x > 0);
    assert.strictEqual(typeof await f(0), 'number');
    assert.ok(g(0) instanceof Promise);
    let result = await g(0);
    assert.strictEqual(result, undefined);
    result = await g(1);
    assert.strictEqual(result, await f(1));
  });

  it('sthen - sequential application', async () => {
    const composed = AsyncWhat.sthen(x => x + 1, x => x * 2);
    assert.equal(await composed.what(2), 6);
  });

  it('else - fallback on undefined', async () => {
    const f = AsyncWhat.else(
      x => (x === 1 ? undefined : x),
      x => x * 10
    );
    assert.equal(await f.what(1), 10);
    assert.equal(await f.what(2), 2);
  });

  describe('AsyncWhat.else (dynamic)', () => {

    it('applies fallback if the original function returns undefined', async () => {
      const fn = AsyncWhat.as(x => undefined).else(x => x * 2);
      assert.strictEqual(await fn(3), 6);
    });

    it('does not call fallback if the original function returns a value', async () => {
      const fn = AsyncWhat.as(x => x + 1).else(x => x * 2);
      assert.strictEqual(await fn(3), 4);
    });

    it('catches error with matching message and applies fallback', async () => {
      const fn = AsyncWhat.as(x => {
        if (x < 0) throw new Error("negative");
        return x;
      }).else(x => Math.abs(x), /negative/);

      assert.strictEqual(await fn(-5), 5);
      assert.strictEqual(await fn(10), 10);
    });

    it('catches error matching regex and applies fallback', async () => {
      const fn = AsyncWhat.as(x => {
        if (x === 0) throw new Error("zero value");
        return x;
      }).else(x => 1, /zero/);

      assert.strictEqual(await fn(0), 1);
      assert.strictEqual(await fn(5), 5);
    });

    it('re-throws errors that do not match string or regex', async () => {
      const fn = AsyncWhat.as(x => {
        if (x < 0) throw new Error("negative");
        return x;
      }).else(x => 0, /other/);

      await assert.rejects(async () => fn(-1), /negative/);
    });

  });

  it('match - applies all and returns results', async () => {
    const m = AsyncWhat.match(x => x + 1, x => x * 2);
    assert.deepEqual(await m.what(3), [4, 6]);
  });

  describe("AsyncWhat.each()", function () {

    describe("Dynamic each()", function () {
      it("should generate flattened results applying f to each value", async function () {
        const f = AsyncWhat.as(x => [x, x + 1]);
        const g = AsyncWhat.as(y => [y * 2]);

        const h = f.each(g);
        const result = await h(2);

        const values = [];
        for await (let v of result) values.push(v);

        assert(values.includes(4));
        assert(values.includes(6));
        assert.strictEqual(values.length, 2);
      });

      it("should skip undefined values", async function () {
        const f = AsyncWhat.as(x => [x, x + 1]);
        const g = AsyncWhat.as(y => y < 4 ? undefined : y * 2);

        const h = f.each(g);
        const result = [];
        for await (let v of await h(3)) result.push(v);

        assert.deepStrictEqual(result, [8]);
      });
    });

    describe("Static each()", function () {
      it("should generate extended paths from Path input", async function () {
        const a = AsyncWhat.as(x => x + 1);
        const b = AsyncWhat.as(x => x * 2);

        const staticEach = AsyncWhat.each(a, b);
        const path = Path.of(1);

        const product = await staticEach(path);
        assert(product instanceof Each);
      });

      it("should handle empty path correctly", async function () {
        const a = AsyncWhat.as(x => x + 1);
        const staticEach = AsyncWhat.each(a);
        const path = Path.of();

        const product = [];
        for await (let v of await staticEach(path)) product.push(v);
        assert.strictEqual(product.length, 0);
      });
    });

  });

  it('self() - default path-expanding mode', async () => {
    const f = AsyncWhat.as(x => [x + 1, x + 2]).self();
    const result = [];
    for await (let p of await f(Path.of(3))) result.push(p.toArray());
    assert.deepEqual(result, [
      [3, 4],
      [3, 5]
    ]);
  });

  it('self(names, name) - object field extraction and set', async () => {
    const f = AsyncWhat.as(val => val + 1).self('val', 'res');
    const obj = { val: 5 };
    assert.deepEqual(await f(obj), { val: 5, res: 6 });
  });

  it('self(names) - object field extraction only', async () => {
    const f = AsyncWhat.as((a, b) => a + b).self(['a', 'b']);
    assert.equal(await f({ a: 4, b: 1 }), 5);
  });

  it('self(_, name) - wraps return value in object', async () => {
    const f = AsyncWhat.as(x => x * 3).self(undefined, 'triple');
    assert.deepEqual(await f(2), { triple: 6 });
  });

});
