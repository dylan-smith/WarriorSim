export function rng(min, max) {
    return ~~(Math.random() * (max - min + 1) + min);
}

export function rng10k() {
    return ~~(Math.random() * 10000);
}

export function avg(min, max) {
    return (min + max) / 2;
}

export var step = 0;

export function incrementStep(count) {
    step += count;
}

export function resetStep() {
    step = 0;
}

export var RESULT = {
    HIT: 0,
    MISS: 1,
    DODGE: 2,
    CRIT: 3,
    GLANCE: 4
}