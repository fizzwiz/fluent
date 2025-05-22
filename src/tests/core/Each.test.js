import {describe, it} from 'mocha';
import assert from 'assert';
import { Each } from '../../main/core/Each.js';

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
    
    it('then', () => {
        const each = Each.of(0, 1, 2)
            .then(i => i%2);
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

