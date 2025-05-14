import {describe, it} from 'mocha';
import assert from 'assert';
/** 
describe('what', () => {
    
    it('as', () => {
        const what = What.as(arg => arg + 1);
        assert.equal(what.what(0), 1)
    });

    it('of', () => {
        const what = What.of([0, 1], [1, 2]);
        assert.equal(what.what(1), 2)
    });

    it('if', () => {
        const what = What.of([0, 1], [1, 2])
            .if(i => i < 2);
        assert.equal(what.what(2), undefined)
    });

    it('then', () => {
        const what = What.of([0, 1], [1, 2])
            .then(i => i-1);
        assert.equal(what.what(0), 0)
    }); 
    
    it('else', () => {
        const what = What.of([0, 1], [1, 2])
            .else(i => i-1);
        assert.equal(what.what(2), 1)
    }); 
    
    it('each', () => {
        const what = What.as(i => [i, i+1])
            .each(i => [i, i+1]);
        assert.deepEqual(what.what(0).toArray(), [0, 1, 1, 2])
    }); 

    it('match', () => {
        const 
            inc = i => i + 1,
            what = What.as(inc);
                
        assert.deepEqual(what.match(inc).what(0), [1, 1])
        assert.deepEqual(what.match(inc, true).what([0, 0]), [1, 1])
    }); 

    it('which', () => {
        const what = What.as(i => [i, i+1])
            .which(i => 0 < i);

        assert.deepEqual(what.what(0).toArray(), [1])
    }); 

    it('when', () => {
        const what = What.as(i => i+1)
            .when(i => 0 < i);

        assert.equal(what.what(0), 1)
        assert.equal(what.what(-1), undefined)
    }); 

    it('self', () => {
        const what = What.as(i => i+1)
            .self()
                .then(each => each.when(2, false, false));

        assert.deepEqual(what.what(0).toArray(), [1, 2]);
    }); 

    it('let', () => {
        const what = What.as(i => i+1)
            .let(0, -1);

        assert.equal(what.what(0), -1);
    });

})

*/
