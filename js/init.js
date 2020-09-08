import { STATS } from './stats.js';
import { UI } from './ui.js';
import { SETTINGS } from './settings.js';

$(document).ready(function () {
    UI.init();
    SETTINGS.init();
    STATS.init();
    console.warn('foo');
});