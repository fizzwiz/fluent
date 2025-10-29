import assert from 'assert';
import { Each } from '../../main/core/Each.js';
import { AsyncEach } from '../../main/core/AsyncEach.js';
import { Path } from '../../main/util/Path.js';

describe('AsyncEach', function () {

  it('should filter async iterables using async predicates', async function () {
    const asyncEach = Each.of(
      Promise.resolve(1),
      Promise.resolve(2),
      Promise.resolve(3),
      Promise.resolve(4)
    )
    .when()
    .if(async n => (await n) % 2 === 0); // keep even numbers

    const results = [];
    for await (const value of asyncEach) {
      results.push(value);
    }

    assert.deepStrictEqual(results, [2, 4], 'Only even numbers should remain');
  });

  it('which() should behave the same as if()', async function () {
    const asyncEach = Each.of(1, 2, 3, 4)
      .when()
      .which(async n => n > 2);

    const results = [];
    for await (const value of asyncEach) {
      results.push(value);
    }

    assert.deepStrictEqual(results, [3, 4], 'which() should filter numbers > 2');
  });

  it('supports sync predicates as well', async function () {
    const asyncEach = Each.of(10, 15, 20)
      .when()
      .if(n => n >= 15);

    const results = [];
    for await (const value of asyncEach) {
      results.push(value);
    }

    assert.deepStrictEqual(results, [15, 20], 'Sync predicates should work too');
  });

describe('AsyncEach.sthen()', function () {

  it('should map values using an async function', async function () {
    const asyncEach = Each.of(1, 2, 3)
      .sthen(async n => n * 2)
      .when(); // convert to AsyncEach

    const results = [];
    for await (const value of asyncEach) {
      results.push(value);
    }

    assert.deepStrictEqual(results, [2, 4, 6], 'Async mapping should double values');
  });

  it('should map values using a synchronous function', async function () {
    const asyncEach = Each.of(1, 2, 3)
      .sthen(n => n + 1)
      .when();

    const results = [];
    for await (const value of asyncEach) {
      results.push(value);
    }

    assert.deepStrictEqual(results, [2, 3, 4], 'Sync mapping should increment values');
  });

  it('should maintain order and lazy iteration', async function () {
    const asyncEach = Each.of(10, 20, 30)
      .sthen(async n => {
        await new Promise(r => setTimeout(r, 10));
        return n / 10;
      })
      .when();

    const results = [];
    for await (const value of asyncEach) {
      results.push(value);
    }

    assert.deepStrictEqual(results, [1, 2, 3], 'Values should resolve in order');
  });

});

describe('AsyncEach.else()', function() {

  it('should flatten a single AsyncEach (instance method without argument)', async function() {
    const aaa = AsyncEach.as([AsyncEach.as([1, 2]), AsyncEach.as([3, 4])]);

    const flat = AsyncEach.else(aaa);
    const result = [];
    for await (const val of flat) result.push(val);

    assert.deepStrictEqual(result, [1, 2, 3, 4]);
  });

  it('should concatenate two AsyncEach instances (instance method with argument)', async function() {
    const first = AsyncEach.as([1, 2]);
    const second = AsyncEach.as([3, 4]);

    const flat = AsyncEach.else(AsyncEach.of(first, second));
    const result = [];
    for await (const val of flat) result.push(val);

    assert.deepStrictEqual(result, [1, 2, 3, 4]);
  });

  it('should flatten a single iterable (static method)', async function() {
    const iterable = [
      [1, 2],
      [3, 4]
    ];

    const flat = AsyncEach.else(iterable);
    const result = [];
    for await (const val of flat) result.push(val);

    assert.deepStrictEqual(result, [1, 2, 3, 4]);
  });

  it('should concatenate two iterables (static method)', async function() {
    const iter1 = [1, 2];
    const iter2 = [3, 4];

    const flat = AsyncEach.else([iter1, iter2]);
    const result = [];
    for await (const val of flat) result.push(val);

    assert.deepStrictEqual(result, [1, 2, 3, 4]);
  });

  it('should handle promises', async function() {
    const aaa = AsyncEach.as([Promise.resolve(1), Promise.resolve(2)]);

    const flat = AsyncEach.else(aaa);
    const result = [];
    for await (const val of flat) result.push(val);

    assert.deepStrictEqual(result, [1, 2]);
  });

  it('should handle mixed async iterables and promises', async function() {
    const aaa = [
      AsyncEach.as([1, 2]),
      Promise.resolve([3, 4])
    ];

    const flat = AsyncEach.else(aaa);
    const result = [];
    for await (const val of flat) result.push(val);

    assert.deepStrictEqual(result, [1, 2, 3, 4]);
  });

});

describe('AsyncEach.when()', function () {

  it('should resolve an iterable of promises when called without arguments', async function () {
    const result = Each.of(Promise.resolve(1), Promise.resolve(2), Promise.resolve(3))
      .when();

    const output = [];
    for await (const val of result) output.push(val);

    assert.deepStrictEqual(output, [1,2,3], 'Values should resolve in order');
  });

  it('should slice by predicate (start = true)', async function () {
    const result = AsyncEach.as(Each.of(1,2,3,4,5)).when(n => n > 2);

    const output = [];
    for await (const val of result) output.push(val);

    assert.deepStrictEqual(output, [3,4,5], 'Should slice starting from first > 2');
  });

  it('should slice by predicate (start = false)', async function () {
    const result = AsyncEach.as(Each.of(1,2,3,4)).when(n => n > 3, false);

    const output = [];
    for await (const val of result) output.push(val);

    assert.deepStrictEqual(output, [1,2,3], 'Should slice until first > 3');
  });

  it('should slice by index', async function () {
    const result = AsyncEach.as(Each.of('a','b','c','d')).when(2);

    const output = [];
    for await (const val of result) output.push(val);

    assert.deepStrictEqual(output, ['c','d'], 'Should slice starting at index 2');
  });

  it('should support async predicates', async function () {
    const result = AsyncEach.as(Each.of(1,2,3,4))
      .when(async n => n % 2 === 0);

    const output = [];
    for await (const val of result) output.push(val);

    assert.deepStrictEqual(output, [2,3,4], 'Should start at first even number');
  });

});


describe('AsyncEach.match()', function () {

  it('should zip two synchronous Each instances', async function () {
    const a = Each.of(1,2,3);
    const b = Each.of('a','b','c');
    const zipped = AsyncEach.match(a,b);

    const output = [];
    for await (const pair of zipped) output.push(pair);

    assert.deepStrictEqual(output, [
      [1,'a'],
      [2,'b'],
      [3,'c']
    ]);
  });

  it('should zip a synchronous and an async iterable', async function () {
    const a = Each.of(1,2,3);
    const b = AsyncEach.as(Each.of('x','y','z'));
    const zipped = AsyncEach.match(a,b);

    const output = [];
    for await (const pair of zipped) output.push(pair);

    assert.deepStrictEqual(output, [
      [1,'x'],
      [2,'y'],
      [3,'z']
    ]);
  });

  it('should zip iterables of promises', async function () {
    const a = Each.of(Promise.resolve(1), Promise.resolve(2));
    const b = Each.of(Promise.resolve('a'), Promise.resolve('b'));
    const zipped = AsyncEach.match(a,b);

    const output = [];
    for await (const pair of zipped) output.push(pair);

    assert.deepStrictEqual(output, [
      [1,'a'],
      [2,'b']
    ]);
  });

  it('should stop zipping when the shortest iterable ends', async function () {
    const a = Each.of(1,2,3,4);
    const b = Each.of('a','b');
    const zipped = AsyncEach.match(a,b);

    const output = [];
    for await (const pair of zipped) output.push(pair);

    assert.deepStrictEqual(output, [
      [1,'a'],
      [2,'b']
    ]);
  });

  it('should work with the instance match() method', async function () {
    const a = AsyncEach.as(Each.of(10,20,30));
    const b = Each.of('x','y','z');
    const zipped = a.match(b);

    const output = [];
    for await (const pair of zipped) output.push(pair);

    assert.deepStrictEqual(output, [
      [10,'x'],
      [20,'y'],
      [30,'z']
    ]);
  });

});


describe('AsyncEach.each()', function () {

  it('should compute Cartesian product of two AsyncEach instances', async function () {
    const a = AsyncEach.as(Each.of(1,2));
    const b = AsyncEach.as(Each.of('a','b'));
    const prod = a.each(b);

    const output = [];
    for await (const pair of prod) output.push(pair);

    assert.deepStrictEqual(output, [
      [1,'a'], [1,'b'], [2,'a'], [2,'b']
    ]);
  });

  it('should handle instance with a sync iterable', async function () {
    const a = AsyncEach.as([10,20]);
    const b = Each.of('x','y');
    const prod = a.each(b);

    const output = [];
    for await (const pair of prod) output.push(pair);

    assert.deepStrictEqual(output, [
      [10,'x'], [10,'y'], [20,'x'], [20,'y']
    ]);
  });

  it('should handle promises', async function () {
    const a = AsyncEach.as([Promise.resolve(1), Promise.resolve(2)]);
    const b = AsyncEach.as([Promise.resolve('a'), Promise.resolve('b')]);
    const prod = a.each(b);

    const output = [];
    for await (const pair of prod) output.push(pair);

    assert.deepStrictEqual(output, [
      [1,'a'], [1,'b'], [2,'a'], [2,'b']
    ]);
  });

  it('should work with static AsyncEach.each(...) returning a What', async function () {
    const w = AsyncEach.each(Each.of(1,2), ['x','y']);
    const path0 = new Path();
    const level1 = [];
    for await (const path of w.what(path0)) {
        level1.push(path.toArray());
    }
    assert.deepStrictEqual(level1, [
        [1], [2]
      ]);
    const level2 = [];
    for await (const path of w.what(Path.of(1))) {
        level2.push(path.toArray());
    }
    assert.deepStrictEqual(level2, [
        [1, 'x'], [1, 'y']
      ]);
  });
  
  describe('AsyncEach.self()', function () {
  
    it('should yield the same iterable repeatedly', async function () {
      const repeated = AsyncEach.self([1,2]);
      const output = [];
      let count = 0;
  
      for await (const batch of repeated) {
        for await (const item of batch) {
            output.push(item); // spread to materialize inner iterable
        }
        
        if (++count >= 3) break; // only take first 3 repetitions
      }
  
      assert.deepStrictEqual(output, [1,2, 1, 2, 1,2]);
    });
  
    it('should work with AsyncEach input', async function () {
      const input = AsyncEach.as([10,20]);
      const repeated = AsyncEach.self(input);
      const output = [];
      let count = 0;
  
      for await (const batch of repeated) {
        const arr = [];
        for await (const item of batch) arr.push(item);
        output.push(arr);
        if (++count >= 2) break;
      }
  
      assert.deepStrictEqual(output, [
        [10,20],
        [10,20]
      ]);
    });
  
    it('should work with promises', async function () {
      const repeated = AsyncEach.self([Promise.resolve(1), Promise.resolve(2)]);
      const output = [];
      let count = 0;
  
      for await (const batch of repeated) {
        const arr = [];
        for await (const item of batch) arr.push(item);
        output.push(arr);
        if (++count >= 2) break;
      }
  
      assert.deepStrictEqual(output, [
        [1,2],
        [1,2]
      ]);
    });
  
  });
  
  

});

describe('AsyncEach.what()', function () {

  it('should return the first value if no reducer is provided', async function () {
    const input = AsyncEach.as([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]);
    const first = await AsyncEach.what(input);
    assert.strictEqual(first, 1);
  });

  it('should reduce async iterable using a synchronous reducer', async function () {
    const input = AsyncEach.as([1,2,3,4]);
    const sum = await AsyncEach.what(input, (a,b) => a+b);
    assert.strictEqual(sum, 10);
  });

  it('should reduce async iterable using an async reducer', async function () {
    const input = AsyncEach.as([1,2,3]);
    const sum = await AsyncEach.what(input, async (a,b) => a+b);
    assert.strictEqual(sum, 6);
  });

  it('should accept an initial accumulator value', async function () {
    const input = AsyncEach.as([1,2,3]);
    const sum = await AsyncEach.what(input, (a,b) => a+b, 10);
    assert.strictEqual(sum, 16);
  });

  it('should work with mixed promises and values', async function () {
    const input = AsyncEach.as([Promise.resolve(1), 2, Promise.resolve(3)]);
    const sum = await AsyncEach.what(input, (a,b) => a+b);
    assert.strictEqual(sum, 6);
  });

});


describe('AsyncEach extended methods', function () {

  describe('toArray()', function () {
    it('should resolve all items into an array', async function () {
      const asyncIter = AsyncEach.as([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]);
      const arr = await asyncIter.toArray();
      assert.deepStrictEqual(arr, [1, 2, 3]);
    });
  });

  describe('equals()', function () {
    it('should return true for equal async iterables', async function () {
      const a = AsyncEach.as([1,2,3]);
      const b = AsyncEach.as([1,2,3]);
      const eq = await a.equals(b);
      assert.strictEqual(eq, true);
    });

    it('should return false for different async iterables', async function () {
      const a = AsyncEach.as([1,2,3]);
      const b = AsyncEach.as([1,2,4]);
      const eq = await a.equals(b);
      assert.strictEqual(eq, false);
    });

    it('should work with nested AsyncEach', async function () {
      const a = AsyncEach.as([AsyncEach.as([1,2]), AsyncEach.as([3])]);
      const b = AsyncEach.as([AsyncEach.as([1,2]), AsyncEach.as([3])]);
      const eq = await a.equals(b);
      assert.strictEqual(eq, true);
    });
  });

  describe('along()', function () {
    it('should generate an infinite async sequence', async function () {
      const seq = AsyncEach.along(1, n => n + 1);
      const arr = [];
      for await (const v of seq) {
        arr.push(v);
        if (arr.length >= 5) break;
      }
      assert.deepStrictEqual(arr, [1,2,3,4,5]);
    });

    it('should support async next function', async function () {
      const seq = AsyncEach.along(1, async n => n + 2);
      const arr = [];
      for await (const v of seq) {
        arr.push(v);
        if (arr.length >= 3) break;
      }
      assert.deepStrictEqual(arr, [1,3,5]);
    });
  });

  describe('isAsyncIterable()', function () {
    it('should detect async iterables', function () {
      const asyncIter = AsyncEach.as([1,2,3]);
      assert.strictEqual(AsyncEach.isAsyncIterable(asyncIter), true);
      assert.strictEqual(AsyncEach.isAsyncIterable([1,2,3]), false);
      assert.strictEqual(AsyncEach.isAsyncIterable(null), false);
      assert.strictEqual(AsyncEach.isAsyncIterable({}), false);
    });
  });

});

});
