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

    it('match - applies all and returns results', () => {
        const m = What.match(x => x + 1, x => x * 2);
        assert.deepEqual(m.what(3), [4, 6]);
    });

    it('each - combinatorial expansion with path growth', () => {
        const f1 = x => [x + 1, x + 2];
        const f2 = x => [x * 10, x * 100];

        const composed = What.each(f1, f2);

        // Start from a Path with one item (0)
        let start = Path.of(0);
        let result = [...composed.what(start)].map(p => p.toArray());

        assert.deepEqual(result, [
            [0, 1],
            [0, 2]
        ]);

        // Apply again to [0,1] to simulate step 2 of the expansion
        start = Path.of(0, 1);
        result = [...composed.what(start)].map(p => p.toArray());

        assert.deepEqual(result, [
            [0, 1, 10],
            [0, 1, 100]
        ]);
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
    
      it("each(f) should return a callable What", () => {
        const numbers = What.as(() => [1, 2, 3]);
        const squareEach = numbers.each(x => [x, x * x]);
    
        const e = squareEach();
        assert.ok(e instanceof Each);
    
        const result = [...e];
        assert.deepEqual(result, [1, 1, 2, 4, 3, 9]); // cartesian product style
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
