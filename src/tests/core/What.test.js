import { describe, it } from 'mocha';
import assert from 'assert';
import { What } from '../../main/core/What.js';
import {Path } from '../../main/util/Path.js';
import { Each } from '../../main/core/Each.js';

describe('What', () => {

    it('as - function, value, What instance', () => {
        assert.equal(What.as(x => x + 1).what(2), 3);
        assert.equal(What.as(5).what(5), true);
        assert.equal(What.as(5).what(3), false);

        const w = What.as(x => x);
        assert.equal(What.as(w), w); // should return same instance
    });
 
    it('of - value-based match', () => {
        const one = What.of("one", 1);
        assert.equal(one.what("one"), 1);
        assert.equal(one.what("two"), undefined);
    });

    it('if - filters undefined or falsy', () => {
        const f = What.if(What.as(x => x), x => x > 5);
        assert.equal(f.what(4), undefined);
        assert.equal(f.what(6), 6);
    });

    it('which - filters values from multivalued source', () => {
        const source = What.as(() => [1, 2, 3, 4]);
        const filtered = source.which(n => n % 2 === 0);
        assert.deepEqual([...filtered.what()], [2, 4]);
    });

    it('when - slices based on predicate', () => {
        const f = What.as(() => [1, 2, 3, 4, 5]);
        const sliced = f.when(n => n >= 3);
        assert.deepEqual([...sliced.what()], [3, 4, 5]);
    });

    it('sthen - sequential application', () => {
        const composed = What.sthen(x => x + 1, x => x * 2);
        assert.equal(composed.what(2), 6); // (2 + 1) * 2
    });

    it('else - fallback on undefined', () => {
        const f = What.else(
            x => (x === 1 ? undefined : x),
            x => x * 10
        );
        assert.equal(f.what(1), 10); // fallback triggered
        assert.equal(f.what(2), 2);  // no fallback
    });
    
    describe('What.else (dynamic)', () => {
    
      it('applies fallback if the original function returns undefined', () => {
        const fn = What.as(x => undefined).else(x => x * 2);
        assert.strictEqual(fn(3), 6);
      });
    
      it('does not call fallback if the original function returns a value', () => {
        const fn = What.as(x => x + 1).else(x => x * 2);
        assert.strictEqual(fn(3), 4);
      });
    
      it('catches error with matching message and applies fallback', () => {
        const fn = What.as(x => {
          if (x < 0) throw new Error("negative");
          return x;
        }).else(x => Math.abs(x), "negative");
    
        assert.strictEqual(fn(-5), 5);
        assert.strictEqual(fn(10), 10);
      });
    
      it('catches error matching regex and applies fallback', () => {
        const fn = What.as(x => {
          if (x === 0) throw new Error("zero value");
          return x;
        }).else(x => 1, /zero/);
    
        assert.strictEqual(fn(0), 1);
        assert.strictEqual(fn(5), 5);
      });
    
      it('re-throws errors that do not match string or regex', () => {
        const fn = What.as(x => { 
          if (x < 0) throw new Error("negative"); 
          return x; 
        }).else(x => 0, /other/);
    
        assert.throws(() => fn(-1), /negative/);
      });
    
    });
    
    it('match - applies all and returns results', () => {
        const m = What.match(x => x + 1, x => x * 2);
        assert.deepEqual(m.what(3), [4, 6]);
    });
    
    describe("What.each()", function () {
    
      describe("Dynamic each()", function () {
        it("should generate flattened results applying f to each value", function () {
          const f = What.as(x => [x, x + 1]);
          const g = What.as(y => [y * 2]);
    
          const h = f.each(g);
          const result = h(2);
    
          const values = [...result];
          assert(values.includes(4), "Expected result to include 4");
          assert(values.includes(6), "Expected result to include 6");
          assert.strictEqual(values.length, 2, "Expected exactly 2 results");
        });
    
        it("should skip undefined values", function () {
          const f = What.as(x => [x, x + 1]);
          const g = What.as(y => y < 4? undefined: y * 2);
    
          const h = f.each(g);
          const result = [...h(3)];
    
          assert.deepStrictEqual(result, [8], "Undefined results should be filtered");
        });
      });
    
      describe("Static each()", function () {
        it("should generate extended paths from Path input", function () {
          const a = What.as(x => x + 1);
          const b = What.as(x => x * 2);
    
          const staticEach = What.each(a, b);
          const path = Path.of(1);
    
          const product = staticEach(path);
          assert(product instanceof Each, "Static each should return an Each instance");
    
          const items = [...product];
          assert(items.length > 0, "Static each should generate at least one path");
          items.forEach(p => {
            assert(p instanceof Array || p instanceof Path, "Each element should be a Path or array");
          });
        });
    
        it("should handle empty path correctly", function () {
          const a = What.as(x => x + 1);
          const staticEach = What.each(a);
          const path = Path.of();
    
          const product = [...staticEach(path)];
          assert.strictEqual(product.length, 0, "Empty path should return empty result");
        });
      });
    
    });
    


    it('self() - default path-expanding mode', () => {
        const f = What.as(x => [x + 1, x + 2]).self();
        const result = [...f.what(Path.of(3))].map(p => p.toArray());
        assert.deepEqual(result, [
            [3, 4],
            [3, 5]
        ]);
    });

    it('self(names, name) - object field extraction and set', () => {
        const f = What.as((a, b) => a + b);
        const s = f.self(['x', 'y'], 'sum');
        const obj = { x: 2, y: 3 };
        assert.deepEqual(s.what(obj), { x: 2, y: 3, sum: 5 });
    });

    it('self(names) - object field extraction only', () => {
        const f = What.as((a, b) => a + b);
        const s = f.self(['a', 'b']);
        assert.equal(s.what({ a: 4, b: 1 }), 5);
    });

    it('self(_, name) - wraps return value in object', () => {
        const f = What.as(x => x * 3);
        const s = f.self(undefined, 'triple');
        assert.deepEqual(s.what(2), { triple: 6 });
    });

    it('self(f as string) - resolves function via property', () => {
        const obj = {
            a: 2,
            b: 3,
            sum: function (x, y) { return x + y; }
        };
        const s = What.self('sum', ['a', 'b'], 'z');
        assert.deepEqual(s.what(obj), { a: 2, b: 3, sum: obj.sum, z: 5 });
    });

    it('what - general dispatcher', () => {
        const f = (x, y) => x + y;
        assert.equal(What.what(f, 2, 3), 5);
        assert.equal(What.what(7), 7);
    });
    
    describe("What callable", () => {
      it("should behave like a function when created from a function", () => {
        const double = What.as(x => x * 2);
        assert.equal(double(5), 10);   // direct call
        assert.equal(double.what(5), 10); // explicit .what()
      });
    
      it("should behave like a function when created from a constant", () => {
        const five = What.as(5);
        assert.equal(five(5), true);
        assert.equal(five(3), false);
      });
    
      it("instance methods should return callable What", () => {
        const double = What.as(x => x * 2);
        const plusOne = double.sthen(x => x + 1);
    
        assert.equal(plusOne(3), 7); // (3 * 2) + 1
      });
    
      it("static methods should return callable What", () => {
        const double = What.as(x => x * 2);
        const square = What.as(x => x * x);
        const both = What.match(double, square);
    
        const result = both(3);
        assert.deepEqual(result, [6, 9]); // double(3)=6, square(3)=9
      });
    
      it("nested callable chain should work", () => {
        const w = What.as(x => x + 1)
          .sthen(x => x * 2)
          .if(x => x < 10);
    
        assert.equal(w(3), 8);   // (3+1)*2 = 8
        assert.equal(w(20), undefined); // filtered out
      });
    });
    
});
