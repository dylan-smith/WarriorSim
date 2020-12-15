import { getGlobalsDelta, TYPE } from '../globals.js';

export class SimulationWorker {
    constructor(callback_finished, callback_update, callback_error) {
        this.worker = new Worker('../sim-worker.js', { type: 'module' });
        this.worker.onerror = callback_error;
        this.worker.onmessage = (event) => {
            const [type, ...args] = event.data;
            switch (type) {
                case TYPE.UPDATE:
                    callback_update(...args);
                    break;
                case TYPE.FINISHED:
                    callback_finished(...args);
                    break;
                default:
                    callback_error(`Unexpected type: ${type}`);
            }
        };
    }

    start(params) {
        params.globals = getGlobalsDelta();
        var obj = JSON.parse(JSON.stringify(params));
        console.info(JSON.stringify(params));
        this.worker.postMessage(obj);
    }
}