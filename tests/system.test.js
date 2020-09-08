import { Player } from '../js/classes/player';
import { Simulation } from '../js/classes/simulation';
import { gear } from '../js/data/gear';
import seedrandom from 'seedrandom';

test('system test', () => {
    seedrandom('testing', { global: true });

    gear.mainhand[0].selected = true;
    var p = new Player();
    var s = new Simulation(p);

    s.start();

    expect(s.totaldmg).toBe(31346);
})