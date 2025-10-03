import { describe, it } from 'mocha';
import assert from 'assert';
import { AsyncWhat } from '../../main/core/AsyncWhat.js';
import { Path } from '../../main/util/Path.js';
import { Each } from '../../main/core/Each.js';
import { EventEmitter } from 'events';
import { TimeoutError } from '../../main/util/Errors.js';  

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

  it('if - throws on falsy', async () => {
    const f = AsyncWhat.as(x => x).if(x => x > 0);
    await assert.rejects(async () => f(0), AsyncWhat.IF_ERROR);
    assert.equal(await f(1), 1);
  });  

  it('which - filters output', async () => {
    const source = AsyncWhat.as(x => x + 1);
    const filtered = source.which(y => y > 0);
    assert.rejects(async () => await filtered(-1), AsyncWhat.WHICH_ERROR);
    assert.equal(await filtered(0), await source(0));
  });

  it('sthen - sequential application', async () => {
    const composed = AsyncWhat.sthen(x => x + 1, x => x * 2);
    assert.equal(await composed.what(2), 6);
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

describe("AsyncWhat.self() overloads", function () {

  describe("timeout mode", () => {
    it("resolves if function finishes before timeout", async () => {
      const f = AsyncWhat.as(async () => {
        await new Promise(res => setTimeout(res, 50));
        return "ok";
      });

      const withTimeout = f.self(100); // timeout = 100ms
      const result = await withTimeout();
      assert.strictEqual(result, "ok");
    });

    it("rejects if function exceeds timeout", async () => {
      const f = AsyncWhat.as(async () => {
        await new Promise(res => setTimeout(res, 200));
        return "slow";
      });

      const withTimeout = f.self(100); // timeout = 100ms
      let error;
      try {
        await withTimeout();
      } catch (err) {
        error = err;
      }
      assert.ok(error, "Expected rejection due to timeout");
      assert.match(error.message, /timed out/i);
    });
  });

  describe("retry mode", () => {
    it("retries until success", async () => {
      let attempts = 0;
      const f = AsyncWhat.as(async () => {
        attempts++;
        if (attempts < 3) throw new Error("fail");
        return "success";
      });

      const retried = f.self(5, 10, 1); // up to 5 tries, delay=10ms
      const result = await retried();
      assert.strictEqual(result, "success");
      assert.strictEqual(attempts, 3);
    });

    it("rejects after max attempts", async () => {
      let attempts = 0;
      const f = AsyncWhat.as(async () => {
        attempts++;
        throw new Error("always fails");
      });

      const retried = f.self(3, 10, 1); // 3 attempts max
      let error;
      try {
        await retried();
      } catch (err) {
        error = err;
      }
      assert.ok(error, "Expected rejection after max attempts");
      assert.strictEqual(attempts, 3);
      assert.match(error.message, /always fails/);
    });

    it("stops retries when stopped flag is set", async () => {
      this.timeout(5000); // give enough time

      let attempts = 0;
      const f = AsyncWhat.as(async () => {
        attempts++;
        throw new Error("fail");
      });

      const retried = f.self(Infinity, 1, 1); // infinite retries
      const promise = retried();


      // Stop after ~20ms
      setTimeout(() => {
        retried.stopped = true;
      }, 20);

      let error;
      try {
        await promise;
      } catch (err) {
        error = err;
      }

      assert.ok(error, "Expected rejection due to manual stop");
      assert.match(error.message, /stopped/i);
      assert.ok(attempts >= 1);
    });
  });
});

  
  describe("AsyncWhat.when (event mode)", function () {
    it("resolves when predicate matches an event", async function () {
      const emitter = new EventEmitter();
      const asyncWhat = AsyncWhat.when(
        (msg) => msg === "hello",
        (msg) => `pong-${msg}`,
        emitter,
        "ping",
        500
      );
  
      setTimeout(() => emitter.emit("ping", "hello"), 50);
  
      const result = await asyncWhat();
      assert.equal(result, "pong-hello");
    });
  
    it("does not call handler if predicate fails", async function () {
      const emitter = new EventEmitter();
      const asyncWhat = AsyncWhat.when(
        (msg) => msg === "match-me",
        () => "pong",
        emitter,
        "ping",
        200
      );
  
      setTimeout(() => emitter.emit("ping", "nope"), 50);
  
      let timedOut = false;
      try {
        await asyncWhat();
      } catch (err) {
        timedOut = err.name === "TimeoutError";
      }
      assert.ok(timedOut, "Expected TimeoutError");
    });
  
    it("cleans up the listener after resolution", async function () {
      const emitter = new EventEmitter();
      let callCount = 0;
  
      const asyncWhat = AsyncWhat.when(
        () => true,
        () => {
          callCount++;
          return "pong";
        },
        emitter,
        "ping",
        500
      );
  
      setTimeout(() => emitter.emit("ping"), 50);
  
      const result = await asyncWhat();
      assert.equal(result, "pong");
  
      // Emit again; listener should already be removed
      emitter.emit("ping");
      emitter.emit("ping");
  
      assert.equal(callCount, 1, "Handler should run only once");
    });
  
    it("rejects if timeout is reached", async function () {
      const emitter = new EventEmitter();
      const asyncWhat = AsyncWhat.when(
        () => true,
        () => "pong",
        emitter,
        "ping",
        100
      );
  
      let rejected = false;
      try {
        await asyncWhat();
      } catch (err) {
        rejected = err.name === "TimeoutError";
      }
      assert.ok(rejected, "Expected TimeoutError");
    });
  
    it("works with DOM-style EventTarget", async function () {
      // Simple DOM EventTarget mock
      const emitter = {
        listeners: {},
        addEventListener(evt, cb) {
          this.listeners[evt] = this.listeners[evt] || [];
          this.listeners[evt].push(cb);
        },
        removeEventListener(evt, cb) {
          if (this.listeners[evt]) {
            this.listeners[evt] = this.listeners[evt].filter((fn) => fn !== cb);
          }
        },
        emit(evt, ...args) {
          (this.listeners[evt] || []).forEach((fn) => fn(...args));
        },
      };
  
      const asyncWhat = AsyncWhat.when(
        (msg) => msg === "hello",
        (msg) => `pong-${msg}`,
        emitter,
        "ping",
        500
      );
  
      setTimeout(() => emitter.emit("ping", "hello"), 50);
      const result = await asyncWhat();
      assert.equal(result, "pong-hello");
    });

  it('starts and stops a cyclic AsyncWhat based on events', async () => {
    const emitter = new EventEmitter();
    let counter = 0;

    // Define a cyclic AsyncWhat
    const cyclic = AsyncWhat.as(async () => {
      counter++;
      return counter;
    }).self(Infinity, 10, 1); // infinite retries every 10ms

    // Add start/stop triggers
    const bounded = cyclic
.when(
        evt => evt.type === 'startEvent',
        emitter,
        'start',
        500,
        true // start cyclic
      )    .when(
      evt => evt.type === 'stopEvent',
      emitter,
      'stop',
      500,
      false // stop cyclic
    );


    // Launch the bounded AsyncWhat
    const promise = bounded();

    // Fire start event
    emitter.emit('start', { type: 'startEvent' });

    // Wait a short time to allow some cycles
    await new Promise(res => setTimeout(res, 50));

    assert.ok(counter > 0, 'Expected counter to increment after start');

    // Fire stop event
    emitter.emit('stop', { type: 'stopEvent' });

    // Wait a bit to ensure cycles stop
    await new Promise(res => setTimeout(res, 50));

    const finalCount = counter;
    
    // Wait more to check counter does not increase
    await new Promise(res => setTimeout(res, 50));
    assert.strictEqual(counter, finalCount, 'Counter should not increment after stop');

  });


  });
  
  


});
