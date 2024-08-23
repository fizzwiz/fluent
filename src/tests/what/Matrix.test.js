import {describe, it} from 'mocha';
import assert from 'assert';
import { Matrix } from '../../main/what/Matrix.js';

describe('Matrix', () => {
    
    it('ofRows', () => {
        const got = Matrix.ofRows([0, 1], [2, 3]);
        assert.deepEqual(got.items().toArray(), [0, 1, 2, 3])
    })

    it('ofCols', () => {
        const got = Matrix.ofCols([0, 1], [2, 3]);
        assert.deepEqual(got.items().toArray(), [0, 2, 1, 3])
    })
})




