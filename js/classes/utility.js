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