import { Matrix } from "./Matrix.js";

export class ArrayMatrix extends Matrix {
    
    constructor(data, ...dims) {
        super(...dims);
        this._data = data
    }

    static of(item, ...dims) {
        return new ArrayMatrix(new Array(Matrix.n(dims)).fill(item), ...dims)
    }

    get data() {
        return this._data
    }

    get nn() {
        return this._nn
    }

    what(...ii) {
        const 
            nn = Matrix.nn(this.dims),
            i = Matrix.i(ii, nn);
        return this.data[i]
    }

    let(value, ...ii) {
        const 
            nn = Matrix.nn(this.dims),
            i = Matrix.i(ii, nn);
       this.data[i] = value;
       return this
    }
}