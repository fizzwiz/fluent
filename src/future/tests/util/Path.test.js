import { describe, it } from "mocha";
import assert from "assert";
import { Path } from "../../main/util/Path.js";

describe('Path', () => {

    it('ancestors', () => {        
        const 
            path = Path.of('a', 'b'),
            back = Array.from(path.ancestors()).map(path => path.last);

        assert.deepEqual(back, path.toArray().reverse())
    })

})