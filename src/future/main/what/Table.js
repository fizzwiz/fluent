import { What } from "../core/What.js";

export class Table extends What {
    
    constructor(matrix, ...index) {
        super();

        this._matrix = matrix;
        this._index = index.map(names => new Map(undefined===names? []: names.map((item, i) => [item, i])))
    }

    get matrix() {
        return this._matrix
    }

    get names() {
        return this._names
    }

    get index() {
        return this._index
    }

    what(...args) {
        return this._matrix.what(...this.ii(args))
    }

    let(value, ...args) {
        return this._matrix.let(value, ...this.ii(args))   
    }

    ii(args) {
        return args.map((arg, i) => typeof(arg) === 'number'? arg: this.index[i].get(arg))
    }

    getRow(iOrName) {
        let i = tyepof(iOrName) === 'string'? this.index[0].get(iOrName)
            : i;
        return this.matrix.getRow(i)
    }

    getCol(iOrName) {
        let i = tyepof(iOrName) === 'string'? this.index[1].get(iOrName)
            : i;
        return this.matrix.getCol(i)
    }
}