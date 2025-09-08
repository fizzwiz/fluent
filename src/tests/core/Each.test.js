import {describe, it} from 'mocha';
import assert from 'assert';
import { Each } from '../../main/core/Each.js';
import { AsyncEach } from '../../main/core/AsyncEach.js';
describe('Each', () => {
    
    it('as', () => {
        const each = Each.as([0, 1]);
        assert(each.equals([0, 1]))
    });

    it('of', () => {
        const each = Each.of(0, 1);
        assert(each.equals([0, 1]))
    }); 
    
    it('if', () => {
        const each = Each.of(0, 1)
            .if(i => 0==i%2);
        assert(each.equals([0]))
    });  
    
    it('which', () => {
        const each = Each.of(0, 1)
            .which(i => 0==i%2);
        assert(each.equals([0]))
    });
    
    it('sthen', () => {
        const each = Each.of(0, 1, 2)
            .sthen(i => i%2);
        assert(each.equals([0, 1, 0]))
    }); 
    
    it('else', () => {
        const 
            aa = Each.of(0, 1)
                .else([2, 3]),
            bb = Each.of(Each.of(0, 1), Each.of(2, 3))
                .else();

        assert(aa.equals(bb));       
    });  

    it('match', () => {
        const 
            aa = Each.of(0, 1)
                .match(Each.of(2)),
            bb = [[0, 2]]

        assert(aa.equals(bb));
    }); 
    
    it('each', () => {
        // cannot be tested without a queue
    }); 
    
    it('when', () => {
        const each = Each.of(0, 1)
            .when(1);
        assert(each.equals([1]))
    }); 

    describe('Each.when() — Async Resolution', function () {

    it('should return an AsyncEach when called without arguments on promises', async function () {
        const asyncEach = Each.of(
        Promise.resolve(1),
        Promise.resolve(2),
        Promise.resolve(3)
        ).sthen(async n => (await n) * 2).when();

        // Ensure it is an AsyncEach instance
        assert(asyncEach instanceof AsyncEach, 'Result should be an AsyncEach');

        const results = [];
        for await (const value of asyncEach) {
            results.push(value);
        }

        assert.deepStrictEqual(results, [2, 4, 6], 'Values should be doubled after resolving promises');
    });

    it('should pass through non-promise values without modification', async function () {
        const asyncEach = Each.of(1, 2, 3).when(); // integers, not promises

        assert(asyncEach instanceof AsyncEach, 'Result should still be an AsyncEach');

        const results = [];
        for await (const value of asyncEach) {
        results.push(value);
        }

        assert.deepStrictEqual(results, [1, 2, 3], 'Values should be unchanged for non-promises');
    });

    it('should work with mixed promises and plain values', async function () {
        const asyncEach = Each.of(
        1,
        Promise.resolve(2),
        3,
        Promise.resolve(4)
        ).when();

        const results = [];
        for await (const value of asyncEach) {
        results.push(value);
        }

        assert.deepStrictEqual(results, [1, 2, 3, 4], 'Mixed promises and plain values should resolve correctly');
    });

    });

    
    it('self', () => {
        const each = Each.of(0, 1)
                .self()
                    .else()
                    .when(3, false, false);
        assert(each.equals([0, 1, 0]))
    }); 
    
    it('what', () => {
        const item = Each.of(0, 1)
            .what();
        assert.equal(item, 0)
    }); 

    it('NATURAL', () => {
        const each = Each.NATURAL
            .when((_, i) => i === 1)
                .when((_, i) => i === 3, false, false)
        assert(each.equals([1, 2, 3]))
    });    
})
/** */

