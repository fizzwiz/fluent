import { What } from "../core/What.js";

export class Table extends What {
    
    constructor(matrix, ...index) {
        super();

        this._matrix = matrix;
        this._names = index;
        this._maps = index.map(array => new Map(array.map((item, i) => [item, i])))
    }

    get matrix() {
        return this._matrix
    }

    get names() {
        return this._names
    }

    get maps() {
        return this._maps
    }

    what(...args) {
        return this._matrix.what(...this.ii(args))
    }

    let(value, ...args) {
        return this._matrix.let(value, ...this.ii(args))   
    }

    ii(args) {
        return args.map((arg, i) => typeof(arg) === 'number' || this.names[i] === undefined? arg: this.maps[i].get(arg))
    }

}