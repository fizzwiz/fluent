import {describe, it} from 'mocha';
import assert from 'assert';
import { LiveSpace} from '../../main/what/LiveSpace.js';

    /** 
     * Un LiveSpace genera tutte le parole che si possono comporre con un array dato di caratteri.  
     * Ogni punto del LiveSpace è la classe di equivalenza di tutte le stringhe di stessa lunghezza
     * che terminano con lo stesso carattere. Il metodo conceive(word) genera tutte 
     * le stringhe che si possono ottenere prolungando di un carattere la parola data. Il metodo
     * mate(wordA, wordB) sceglie la maggiore, in ordine alfabetico, delle due parole. 
     * Si noti che attraverso questo approccio (Needleman-Wunsch) è possibile trovare la parola
     * migliore di qualunque lunghezza senza generare tutte le possibili disposizioni dei caratteri dati
     * ma utilizzando solo 3 classi, una per ogni carattere. Il LiveSpace consente di esplorare 
     * spazi complessi altrimenti non enumerabili completamente. In questo caso la soluzione ottenuta
     * è quella esatta ma, in generale, riducendo classi di punti ad un punti singolo si può utilizza
     * una qualche semplificazione ottenendo una soluzione approssimata di un problema complesso. 
     *  
    */
describe('LiveSpace', () => {
    const chars = ['A', 'B'];
    const space = new LiveSpace();
    space.repr = word => word.length;
    space.conceive = word => chars.map(char => word + char);
    space.mate = (a, b) => a < b? b: a;

    it('repr', () => {        
        assert.equal(space.repr('AB'), 2)
    })

    it('conceive', () => {        
        assert.deepEqual(space.conceive('AB'), ['ABA', 'ABB'])
    })

    it('mate', () => {        
        assert.equal(space.mate('AB', 'AC'), 'AC')
    })

    it('what', () => {  
        space.what('A');        
        assert(space.population.has(2));
        assert.equal(space.population.get(2), 'AB')
        
        space.what('B'); 
        assert.equal(space.population.get(2), 'BB')

        space.what('AB');
        assert(!space.population.has(2))
    })
})