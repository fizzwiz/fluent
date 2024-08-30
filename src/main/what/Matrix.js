import { Each } from "../core/Each.js";
import { What } from "../core/What.js";
import { Path } from "../util/Path.js";
import { Table } from "./Table.js";

/**
 * Una matrice di items di qualunque tipo 
 * è un What i cui argomenti sono numeri naturali
 */
export class Matrix extends What {
    
    what(...ii) {        
        throw 'abstract method!'
    }

    constructor(...dims) {
        super();
        this._dims = dims
    }

    get dims() {
        return this._dims
    }

    get index() {
        return this._index
    }

    static as(f, ...dims) {
        const got = 
            new Matrix(...dims);
        got.what = (...ii) => What.what(f, ...ii);
        return got
    }

    static of(data, ...dims) {
        const got = 
            new Matrix(...dims),
            pp = Matrix.nn(dims);
        got.what = (...ii) => data[Matrix.i(ii, pp)];
        return got
    }

    toString(path=new Path()) {

        const nDims = this.dims.length;
       
        if(nDims === 0) {
            return '[]'
        } else if(nDims === 1) {
            return this.items().toArray().join('\t')
        } else if(nDims === 2) {
            
            let got = path.length > 0 ? "[" + path.toArray().join(', ') + "]\n:"
                    : '';
            got += ('\t' + Each.NATURAL.when(this.dims[1], false).then(i => `[${i}]`).toArray().join('\t'));
            for(let i = 0; i < this.dims[0]; i++) {
                got += `\n[${i}]\t` + this.getChild(0, i).toString() 
            }

            return got;

        } else {
            for(let i = 0; i < this.dims[0]; i++) {
                got += this.getChild(0, i).toString(path.add(i))
            }
        }
    }

    toTable(rowNames, colNames) {
        return new Table(this.entries(), rowNames, colNames)
    }

    static i(ii, nn) {
        const got = ii.map((i, k) => i * nn[k])
                .reduce((a, b) => a+b, 0)
        
        return got
    }

    static ii(i, nn) {
        
        const got = new Array(nn.length).fill(0);

        let k = 0;
        while(0 < i) {
            const p = nn[k];
            got[k] = Math.floor(i / p);
            i = i % p;
            k++
        }

        return got            
    }

    static nn(dims) {

        const got = new Array(dims.length).fill(1);

        let block = 1;

        for(let i = dims.length - 1; 0 <= i; i--) {
            got[i] = block;
            block = dims[i] * block;
        }

        return got
    }

    static n(dims) {
        return dims.length === 0? 0
            : dims.reduce((i, j) => i*j, 1)
    }

    static checkRange(ii, dims) {
        
        return ii.length === dims.length
            && ii.every((i, j) => 0 <= i && i < dims[j])
    }

    items() {
        const 
            nn = Matrix.nn(this.dims),
            n = this.n(),
            got = Each.NATURAL.when(n, false)
                .then(i => this.what(...Matrix.ii(i, nn)));
        return got
    }

    entries() {
        const 
            nn = Matrix.nn(this.dims),
            got = new Matrix(this.n(), this.dims.length + 1);
        got.what = (r, c) => c < this.dims.length? Matrix.ii(r, nn)[c]: this.what(...Matrix.ii(r));
        return got
    }

    compile() {
        return Matrix.of(this.items().toArray(), this.dims)
    }

    n() {
        return Matrix.n(this.dims)
    }

    static ofChildren(d, ...children) {
        if(1 === children[0].dims.length) {
            const got = new Matrix(children.length, children[0].dims[0]);
            got.what = (i, j) => children[i].what(j);
            return 0 === d? got: got.t(1, 0)
        } else {
            const
                got = new Matrix(...children[0].dims.splice(d, 0, children.length));
            got.what = (...ii) => children[ii[d]].what(...ii.filter((_, k) => k != d));
            return got
        }
    }

    children(d) {
        return Each.NATURAL.when(this.dims[d], false).then(i => this.getChild(d, i))
    }

    /**
     * Se la matrice è unidimensionale, il figlio è ancora una matrice unidimensionale
     * altriment il figlio ha una dimensione in meno
     * @param {*} d 
     * @param {*} i 
     * @returns {Matrix}
     */
    getChild(d, i) {
        if(1 === this.dims.length) {
            const got = Matrix.of([this.what(i)], 1);
            return got;
        } else {
            const got = new Matrix(...this.dims.filter((_, k) => k !== d));
            got.what = (...ii) => this.what( ... Each.NATURAL.when(ii.length, false, true)
                            .then(j => j < d? ii[j]: j===d? i: ii[j - 1]) );
            return got
        }
    }

    /**
     * Se questa matrice è unidimensionale, m può essere o una matrice unidimensionale oppure un valore semplice
     * @param {*} d 
     * @param {*} i 
     * @param {*} m 
     * @returns {Matrix} this Matrix
     */
    letChild(d, i, m) {
        if(1 === this.dims.length) {
            const got = new Matrix(...this.dims);
            got.what = j => j === i? m instanceof Matrix? m.what(...ii): m
                    : this.what(j)
            return got
        } else {
            if( Each.equal(this.dims.filter((_, k) => k !== d), m.dims) ) {
                const got = new Matrix(...this.dims);
                got.what = (...ii) => ii[d] === i? m.what(...ii.filter((_, k) => k !== d))
                        : this.what(...ii)
                return got
            } else {
                throw "unexpected dims!"
            }
        }

    }

    /**
     * Se questa matrice è unidimensionale, m può essere o una matrice unidimensionale oppure un valore semplice
     * @param {*} d 
     * @param {*} i 
     * @param {*} m 
     * @returns {Matrix} this Matrix
     */
    addChild(d, i, m) {
        if(1 === this.dims.length) {
            const got = new Matrix(this.dims[0] + 1);
            got.what = j => j < i? this.what(j)
                    : j === i? m instanceof Matrix? m.what(j): m
                        : this.what(j - 1)
            return got
        } else {
            if( Each.equal(this.dims.filter((_, k) => k !== d), m.dims) ) {
                const got = new Matrix(...this.dims.map((j, k) => k===d? j + 1: j));
                got.what = (...ii) => ii[d] < i? this.what(...ii)
                        : ii[d] === i? m.what(...ii.filter((_, k) => k !== d))
                            : this.what(...ii.map((j, k) => k===d? j - 1: j));
                return got
            } else {
                throw "unexpected dims!"
            }
        }
    }

    removeChild(d, i) {
        if(1 === this.dims.length) {
            const got = new Matrix(this.dims[0] - 1);
            got.what = j => j < i? this.what(j)
                : this.what(j - 1);
                        
            return got
        } else {
            const got = new Matrix(...this.dims.map((j, k) => k===d? j - 1: j));
            got.what = (...ii) => ii[d] < i? this.what(...ii): this.what(...ii.map((j, k) => k === d? j-1: j));
            return got            
        }
    }

    removeChildren(d, ...ii) {
        ArrayForm(ii).sort((i, j) => -i + j)    // descending order
            .forEach(i => this.removeChild(d, i)); 
    }

    t(...dd) {
        
        if(!dd.length) {
            dd = [1, 0]
        }

        const got = new Matrix(...dd.map(d => this.dims[d]));
        got.what = (...ii) => {
            const jj = new Array(dd.length).fill(undefined);
            ii.forEach((j, k) => jj[dd[k]] = j);
            return this.what(...jj)
        }
        
        return got  
    }  

    /**
     * Overrides the What method.
     * This method returns a Matrix instead of a generic What.
     * @param {*} f una funzione(item, ii, matrix) di tre argomenti 
     * @returns {Matrix}
     */
    then(f) {
        const got = new Matrix(...this.dims);
        got.what = (...ii) => f(this.what(...ii), ii, this);
        return got
    }

    /**
     * Selects only the given dimensions from this Matrix 
     * Each item of the returned Matrix is a Matrix spanning over the remaining dimensions
     * 
     * @param {Array<Number>} dd dims of the resulting Matrix
     * @returns {Matrix} 
     */
    marginal(...dd) {
        const got = new Matrix(...dd.map(d => this.dims[d]));
        got.what = (...ii) => this.conditional(dd, ii);
        return got
    }

    conditional(dd, ii) {
        const 
            descending = dd.map((d, i) => [d, ii[i]]).sort(([a, _], [b, __]) => b - a),
            got = new Matrix(...dd.map(d => this.dims[d]));
        got.what = (...ii) => {
            for(let [d, i] of descending) {
                ii.splice(d, 0, i);
            }
            return this.what(...ii)
        }
        
        return got
    }
    /**
     * Selects only the dimension which are not included among the given dd.
     * Each item of the returned Matrix is a Matrix spanning upon the given dimensions
     * 
     * @param {*} dd 
     * @param {*} ii 
     * @returns {Matrix}
     */
    complemental(...dd) {

        const
            dset = new Set(dd),
            DD = this.dims.filter(d => !dset.has(d));

        return this.marginal(...DD)
    }

    get nrows() {
        return this._dims[0]
    }

    get ncols() {
        return this._dims[1]
    }

    static ofRows(...rows) {
        return Matrix.as((r, c) => rows[r][c], rows.length, rows[0].length)
    }

    getRow(i) {
        return this.getChild(0, i).items().toArray()
    }

    addRow(data, i=this.ncols) {
        const m = Matrix.of(data, data.length);
        return this.addChild(0, i, m)
    }

    rows() {
        return this.children(0).then(c => c.items().toArray())
    }

    static ofCols(...cols) {
        return Matrix.as((r, c) => cols[c][r], cols[0].length, cols.length)
    }

    getCol(i) {
        return this.getChild(1, i).items().toArray()
    }

    addCol(data, i=this.nrows) {

        const m = Matrix.of(data, data.length);
        return this.addChild(1, i, m)      
    }

    cols() {
        return this.children(1).then(c => c.items().toArray())
    }
  
}
