import { updateGlobals, TYPE } from './globals.js';
import { Player } from './classes/player.js';
import { Simulation } from './classes/simulation.js';

onmessage = (event) => {
    const params = event.data;
    updateGlobals(params.globals);
    // console.log('starting sim-worker', params);
    const player = new Player(...params.player);
    const sim = new Simulation(player, (report) => {
        // Finished
        if (params.fullReport) {
            report.player = player.serializeStats();
            report.spread = sim.spread;
        }
        postMessage([TYPE.FINISHED, report]);
    }, (iteration, report) => {
        // Update
        postMessage([TYPE.UPDATE, iteration, report]);
    }, params.sim);
    sim.startSync();
};

// console.log('sim-worker loaded');
