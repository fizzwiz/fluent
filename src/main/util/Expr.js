import { What } from "../core/What.js";
import { Scope } from "./Scope.js";

/**
 * A Scope, with 4 further properties: 'result', 'deployer', 'solver' and 'queue'
 * Il deployer è una funzione che, eseguita, produce una iterazione di espressioni opzionali
 * Il risultato è qualunque oggetto
 * Il solver tenta di calcolare result. Ogni volta che cambia il child di una espressione, 
 * la espressione è ricalcolata. Ogni volta che cambia il risultato di una espressione, è ricalcolata
 * la espressione parent ed è emesso un PropertyChangedEvent
 * La queue serve a statibile l'ordine di valutazione delle espressioni. E' popolata dal metodo letChild().
 * Ogni volta che ad una espress è aggiunto un figlio, questo è aggiunto anche alla queue della espressione
 * root.
 * 
 * Il metodo eval() della espressione root sviluppa tutte le espressioni in coda.
 * 
 * Sia deployer che solver possono essere asincrone cioè possono ritornare una Promise
 * In questo modo, la valutazione di una espressione può essere distribuita su diversi server
 * La espressione si rivaluta continuamente da sé. Quando il risultato della root è calcolato, ogni
 * valutazione delle expr discendenti (che potrebbero essere aggiunte in modo asincrono successivamente) si ferma.
 * 
 * Ogni esp
 */
export class Expr extends Scope {
    
    constructor(parent=undefined, deployer, solver, result=undefined, children={}) {
        super(parent, children);
        this._deployer = deployer;
        this._solver = solver;
        this._result = result;

        this._queue = [];
        this._intervalId = undefined
    }

    get deployer() {
        return this._deployer
    }

    get solver() {
        return this._solver
    }

    get result() {
        return this._result
    }

    set result(value) {
        this._result = value;
        clearInterval(this._intervalId);
        if(!this.isRoot() && !this.parent.isSolved()) {
            this.parent.update()
        }
    }

    get queue() {
        return this._queue
    }

    set queue(array) {
        this._queue = array
    }

    isSolved() {
        return undefined != this.result
    }

    letChild(name, child) {
        super.letChild(name, child);

        if(child.isSolved()) {
            this.update()
        } else if(this.root().isSolved()) { // stop deploying if the root expr is calculated
            clearInterval(this._intervalId)
        } else {
            this.root().queue.add(child)
        }
    }

    update() {
        if(undefined === this.result && this.solver) {
            const 
                got = What.what(this.solver, ...Object.values(this.children).map(child => child.result)),
                setter = result => {
                    if(undefined != result) {
                        this.result = result
                    }
                };

            if(got instanceof Promise) {
                got.then(setter)
            } else {
                setter(got)
            }            
        }
    }

    /**
     * Esegue il deployer di questa espressione 
     * Se questa espressione ha parent, allora trasforma in loco il parent in una espressione parallela
     * I suoi figli si ottentono dal suo stesso clone sostituendo questa espressione con ciascuna delle espressioni ritornate
     * dal deployer 
     */
    deploy() {
        const 
            got = What.what(this.deployer, this),
            multiplier = (opts) => {
                if(this.parent) {
                    this.parent.deployer = undefined;
                    this.parent.solver = Expr.PARALLEL_SOLVER;
        
                    const name = this.name;
                    let i = 0;
                    for(let next of Each.as(opts)) {
                        const child = this.parent.clone().letChild(name, next);
                        this.parent.letChild('child_' + i, child);
                        i++
                    }
                }
            }

        if(got instanceof Promise) {
            got.then(multiplier)
        } else {
            multiplier(got)
        }

    }

    clone() {
        const got = new Expr(this.parent, this.deployer, this.solver, this.result);
        for(let [name, child] of Object.entries(this.children? this.children: {})) {
            got.letChild(name, child)
        }
    }

    /**
     * Un passo nella valutazione di una espressione consiste nello sviluppo di tutte le sue foglie
     * 
     */
    step() {
        
        const leaves = this.queue;
        this.queue = [];
        leaves.forEach(expr => {
            expr.update();
            expr.deploy()
        });
    
        return this
    }

    /**
     * Il calcolo di una espressione può essere sia sincrono che asincrono
     * Nella valutazione sincrona, la expr esegue step() fino a quando la queue non diventa vuota
     * Nella valutazione asincrona è un timer a determinare il prossimo passo
     * Il timer è cancellato automaticamente quando la espressione root è calcolata 
     * 
     * La valutazione asincrona è necessaria se deployer e solver delle espressioni sono asincroni, cioè,
     * producono Promises
     * 
     * Il callback è eseguito nel caso di valutazione asincrona quando la expressione è risolta
     * Se si verifica un errore è eseguito lo errHandler
     * @param {*} sync 
     */
    eval(millis=undefined, callback, errHandler=undefined) {
        
        if(millis) {    // async
            clearInterval(this._intervalId);
            this._intervalId = setInterval(() => {
                try {
                    this.step();
                    if(this.isSolved() && callback) callback.call(this);  // l'intervallo è già stato cancellato dal setter di result
                } catch(err) {
                    clearInterval(this._intervalId);
                    if(errHandler) errHandler.call(this, err)
                }                
            }, millis)
        } else {
            do {
                this.step()
            } while(this.queue.length)
        }
    }

}

Expr.PARALLEL_SOLVER = expr => {
    for(let child of Object.values(this.children)) {
        if(undefined !== child.result) {
            expr.result = child.result
        }
    }
}