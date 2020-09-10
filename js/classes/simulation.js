import { spells } from '../data/spells.js';
import * as spellclasses from './spell.js';
import { step, rng, incrementStep, resetStep, enableLogging, disableLogging, log } from './utility.js';

export var version = 3;

export class Simulation {
    constructor(player, callback_finished, callback_update, options) {
        options = options || {};
        options.timesecsmin = options.timesecsmin || 50;
        options.timesecsmax = options.timesecsmax || 60;
        options.executeperc = options.executeperc || 20;
        options.startrage = options.startrage || 0;
        options.simulations = options.simulations || 100;

        this.player = player;
        this.timesecsmin = options.timesecsmin;
        this.timesecsmax = options.timesecsmax;
        this.executeperc = options.executeperc;
        this.startrage = options.startrage;
        this.iterations = options.simulations;
        this.idmg = 0;
        this.totaldmg = 0;
        this.totalduration = 0;
        this.mindps = 99999;
        this.maxdps = 0;
        this.maxcallstack = Math.min(Math.floor(this.iterations / 10), 1000);
        this.starttime = 0;
        this.endtime = 0;
        this.cb_update = callback_update;
        this.cb_finished = callback_finished;
        this.spread = [];
        this.priorityap = parseInt(spells[4].priorityap);

        if (this.iterations == 1) enableLogging()
        else disableLogging();
    }
    start() {
        this.run(1);
        this.starttime = new Date().getTime();
    }
    run(iteration) {
        resetStep();
        this.idmg = 0;
        let player = this.player;
        player.reset(this.startrage);
        this.maxsteps = rng(this.timesecsmin * 1000, this.timesecsmax * 1000);
        this.duration = this.maxsteps / 1000;
        this.executestep = this.maxsteps - parseInt(this.maxsteps * (this.executeperc / 100));
        let delayedspell, delayedheroic;
        let spellcheck = false;
        let next = 0;

        // item steps
        let itemdelay = 0;
        if (player.auras[spellclasses.Flask]) { this.flaskstep = Math.max(this.maxsteps - 60000, 0); itemdelay += 60000; }
        if (player.auras[spellclasses.Cloudkeeper]) { this.cloudstep = Math.max(this.maxsteps - itemdelay - 30000, 0); itemdelay += 30000; }
        if (player.auras[spellclasses.Slayer]) { this.slayerstep = Math.max(this.maxsteps - itemdelay - 20000, 0); itemdelay += 20000; }
        if (player.auras[spellclasses.Spider]) { this.spiderstep = Math.max(this.maxsteps - itemdelay - 15000, 0); itemdelay += 15000; }
        if (player.auras[spellclasses.Gabbar]) { this.gabbarstep = Math.max(this.maxsteps - itemdelay - 20000, 0); itemdelay += 20000; }
        if (player.auras[spellclasses.Earthstrike]) { this.earthstep = Math.max(this.maxsteps - itemdelay - 20000, 0); itemdelay += 20000; }
        if (player.auras[spellclasses.Pummeler]) { this.pummelstep = Math.max(this.maxsteps - itemdelay - 30000, 0); itemdelay += 30000; }
        if (player.auras[spellclasses.Zandalarian]) { this.zandalarstep = Math.max(this.maxsteps - itemdelay - 20000, 0); itemdelay += 20000; }

        if (player.auras[spellclasses.DeathWish]) { player.auras[spellclasses.DeathWish].usestep = Math.max(this.maxsteps - player.auras[spellclasses.DeathWish].timetoend, 0); }
        if (player.auras[spellclasses.Recklessness]) { player.auras[spellclasses.Recklessness].usestep = Math.max(this.maxsteps - player.auras[spellclasses.Recklessness].timetoend, 0); }
        if (player.auras[spellclasses.MightyRagePotion]) { player.auras[spellclasses.MightyRagePotion].usestep = Math.max(this.maxsteps - player.auras[spellclasses.MightyRagePotion].timetoend, 0); }
        if (player.auras[spellclasses.Berserking]) { player.auras[spellclasses.Berserking].usestep = Math.max(this.maxsteps - player.auras[spellclasses.Berserking].timetoend, 0); }
        if (player.auras[spellclasses.BloodFury]) { player.auras[spellclasses.BloodFury].usestep = Math.max(this.maxsteps - player.auras[spellclasses.BloodFury].timetoend, 0); }
        if (player.auras[spellclasses.Swarmguard]) { player.auras[spellclasses.Swarmguard].usestep = Math.max(this.maxsteps - player.auras[spellclasses.Swarmguard].timetoend, 0); }


        //if (log) console.log(' TIME |   RAGE | EVENT')

        while (step < this.maxsteps) {

            // Passive ticks
            if (next != 0 && step % 3000 == 0 && player.talents.angermanagement) {
                player.rage = player.rage >= 99 ? 100 : player.rage + 1;
                spellcheck = true;
                //if (log) player.log(`Anger Management tick`);
            }
            if (player.vaelbuff && next != 0 && step % 1000 == 0) {
                player.rage = player.rage >= 80 ? 100 : player.rage + 20;
                spellcheck = true;
                //if (log) player.log(`Vael Buff tick`);
            }

            // Attacks
            if (player.mh.timer <= 0) {
                this.idmg += player.attackmh(player.mh);
                spellcheck = true;
            }
            if (player.oh && player.oh.timer <= 0) {
                this.idmg += player.attackoh(player.oh);
                spellcheck = true;
            }

            // Spells
            if (spellcheck && !player.spelldelay) {
                // No GCD
                if (player.auras[spellclasses.Swarmguard] && player.auras[spellclasses.Swarmguard].canUse()) { player.spelldelay = 1; delayedspell = player.auras[spellclasses.Swarmguard]; }
                else if (player.auras[spellclasses.MightyRagePotion] && player.auras[spellclasses.MightyRagePotion].canUse()) { player.spelldelay = 1; delayedspell = player.auras[spellclasses.MightyRagePotion]; }
                else if (player.spells[spellclasses.Bloodrage] && player.spells[spellclasses.Bloodrage].canUse()) { player.spelldelay = 1; delayedspell = player.spells[spellclasses.Bloodrage]; }
                
                // GCD spells
                else if (player.timer) { }
                else if (player.auras[spellclasses.Flask] && player.auras[spellclasses.Flask].canUse() && step > this.flaskstep) { player.spelldelay = 1; delayedspell = player.auras[spellclasses.Flask]; }
                else if (player.auras[spellclasses.Cloudkeeper] && player.auras[spellclasses.Cloudkeeper].canUse() && step > this.cloudstep) { player.spelldelay = 1; delayedspell = player.auras[spellclasses.Cloudkeeper]; }
                else if (player.auras[spellclasses.Recklessness] && player.auras[spellclasses.Recklessness].canUse()) { player.spelldelay = 1; delayedspell = player.auras[spellclasses.Recklessness]; }
                else if (player.auras[spellclasses.DeathWish] && player.auras[spellclasses.DeathWish].canUse()) { player.spelldelay = 1; delayedspell = player.auras[spellclasses.DeathWish]; }
                else if (player.auras[spellclasses.BloodFury] && player.auras[spellclasses.BloodFury].canUse()) { player.spelldelay = 1; delayedspell = player.auras[spellclasses.BloodFury]; }
                else if (player.auras[spellclasses.Berserking] && player.auras[spellclasses.Berserking].canUse()) { player.spelldelay = 1; delayedspell = player.auras[spellclasses.Berserking]; }

                else if (player.auras[spellclasses.Slayer] && player.auras[spellclasses.Slayer].canUse() && step > this.slayerstep) { player.spelldelay = 1; delayedspell = player.auras[spellclasses.Slayer]; }
                else if (player.auras[spellclasses.Spider] && player.auras[spellclasses.Spider].canUse() && step > this.spiderstep) { player.spelldelay = 1; delayedspell = player.auras[spellclasses.Spider]; }
                else if (player.auras[spellclasses.Gabbar] && player.auras[spellclasses.Gabbar].canUse() && step > this.gabbarstep) { player.spelldelay = 1; delayedspell = player.auras[spellclasses.Gabbar]; }
                else if (player.auras[spellclasses.Earthstrike] && player.auras[spellclasses.Earthstrike].canUse() && step > this.earthstep) { player.spelldelay = 1; delayedspell = player.auras[spellclasses.Earthstrike]; }
                else if (player.auras[spellclasses.Pummeler] && player.auras[spellclasses.Pummeler].canUse() && step > this.pummelstep) { player.spelldelay = 1; delayedspell = player.auras[spellclasses.Pummeler]; }
                else if (player.auras[spellclasses.Zandalarian] && player.auras[spellclasses.Zandalarian].canUse() && step > this.zandalarstep) { player.spelldelay = 1; delayedspell = player.auras[spellclasses.Zandalarian]; }

                // Execute phase
                else if (player.spells[spellclasses.Execute] && step >= this.executestep) {
                    if (player.spells[spellclasses.Bloodthirst] && player.stats.ap >= this.priorityap && player.spells[spellclasses.Bloodthirst].canUse()) {
                        player.spelldelay = 1; delayedspell = player.spells[spellclasses.Bloodthirst];
                    }
                    else if (player.spells[spellclasses.MortalStrike] && player.stats.ap >= this.priorityap && player.spells[spellclasses.MortalStrike].canUse()) {
                        player.spelldelay = 1; delayedspell = player.spells[spellclasses.MortalStrike];
                    }
                    else if (player.spells[spellclasses.Execute].canUse()) {
                        player.spelldelay = 1; delayedspell = player.spells[spellclasses.Execute];
                    }
                }

                // Normal phase
                else if (player.spells[spellclasses.SunderArmor] && player.spells[spellclasses.SunderArmor].canUse()) { player.spelldelay = 1; delayedspell = player.spells[spellclasses.SunderArmor]; }
                else if (player.spells[spellclasses.Bloodthirst] && player.spells[spellclasses.Bloodthirst].canUse()) { player.spelldelay = 1; delayedspell = player.spells[spellclasses.Bloodthirst]; }
                else if (player.spells[spellclasses.MortalStrike] && player.spells[spellclasses.MortalStrike].canUse()) { player.spelldelay = 1; delayedspell = player.spells[spellclasses.MortalStrike]; }
                else if (player.spells[spellclasses.Whirlwind] && player.spells[spellclasses.Whirlwind].canUse()) { player.spelldelay = 1; delayedspell = player.spells[spellclasses.Whirlwind]; }
                else if (player.spells[spellclasses.Overpower] && player.spells[spellclasses.Overpower].canUse()) { player.spelldelay = 1; delayedspell = player.spells[spellclasses.Overpower]; }
                else if (player.spells[spellclasses.Hamstring] && player.spells[spellclasses.Hamstring].canUse()) { player.spelldelay = 1; delayedspell = player.spells[spellclasses.Hamstring]; }

                //if (log && player.spelldelay) player.log(`Preparing ${delayedspell.name}`);

                if (player.heroicdelay) spellcheck = false;
            }

            // Heroic Strike
            if (spellcheck && !player.heroicdelay) {
                if (!player.spells[spellclasses.Execute] || step < this.executestep) {
                    if (player.spells[spellclasses.HeroicStrike] && player.spells[spellclasses.HeroicStrike].canUse()) { player.heroicdelay = 1; delayedheroic = player.spells[spellclasses.HeroicStrike]; }
                }
                else {
                    if (player.spells[spellclasses.HeroicStrikeExecute] && player.spells[spellclasses.HeroicStrikeExecute].canUse()) { player.heroicdelay = 1; delayedheroic = player.spells[spellclasses.HeroicStrikeExecute]; }
                }

                //if (log && player.heroicdelay) player.log(`Preparing ${delayedheroic.name}`);

                spellcheck = false;
            }

            // Cast spells
            if (player.spelldelay && delayedspell && player.spelldelay > delayedspell.maxdelay) {

                // Prevent casting HS and other spells at the exact same time
                if (player.heroicdelay && delayedheroic && player.heroicdelay > delayedheroic.maxdelay)
                    player.heroicdelay = delayedheroic.maxdelay - 49;

                if (delayedspell.canUse()) {
                    this.idmg += player.cast(delayedspell);
                    player.spelldelay = 0;
                    spellcheck = true;
                }
                else {
                    player.spelldelay = 0;
                }
            }

            // Cast HS
            if (player.heroicdelay && delayedheroic && player.heroicdelay > delayedheroic.maxdelay) {
                if (delayedheroic.canUse()) {
                    player.cast(delayedheroic);
                    player.heroicdelay = 0;
                    spellcheck = true;
                }
                else {
                    player.heroicdelay = 0;
                }
            }

            if (player.spells[spellclasses.HeroicStrike] && player.spells[spellclasses.HeroicStrike].unqueue && player.nextswinghs &&
                player.rage < player.spells[spellclasses.HeroicStrike].unqueue && player.mh.timer <= player.spells[spellclasses.HeroicStrike].unqueuetimer) {
                this.player.nextswinghs = false;
                //if (log) player.log(`Heroic Strike unqueued`);
            }

            // Extra attacks
            if (player.extraattacks > 0) {
                player.mh.timer = 0;
                player.extraattacks--;
            }
            if (player.batchedextras > 0) {
                player.mh.timer = 400 - (step % 400);
                player.batchedextras--;
            }
            
            // Process next step
            if (!player.mh.timer || (!player.spelldelay && spellcheck) || (!player.heroicdelay && spellcheck)) { next = 0; continue; }
            next = Math.min(player.mh.timer, player.oh ? player.oh.timer : 9999);
            if (player.spelldelay && (delayedspell.maxdelay - player.spelldelay) < next) next = delayedspell.maxdelay - player.spelldelay + 1;
            if (player.heroicdelay && (delayedheroic.maxdelay - player.heroicdelay) < next) next = delayedheroic.maxdelay - player.heroicdelay + 1;
            if (player.timer && player.timer < next) next = player.timer;
            if (player.itemtimer && player.itemtimer < next) next = player.itemtimer;
            if (player.talents.angermanagement && (3000 - (step % 3000)) < next) next = 3000 - (step % 3000);
            if (player.vaelbuff && (1000 - (step % 1000)) < next) next = 1000 - (step % 1000);
            if (player.auras[spellclasses.Bloodrage] && player.auras[spellclasses.Bloodrage].timer && (1000 - ((step - player.auras[spellclasses.Bloodrage].starttimer) % 1000)) < next)
                next = 1000 - ((step - player.auras[spellclasses.Bloodrage].starttimer) % 1000);
            if (player.auras[spellclasses.Gabbar] && player.auras[spellclasses.Gabbar].timer && (2000 - ((step - player.auras[spellclasses.Gabbar].starttimer) % 2000)) < next)
                next = 2000 - ((step - player.auras[spellclasses.Gabbar].starttimer) % 2000);

            if (player.spells[spellclasses.Bloodthirst] && player.spells[spellclasses.Bloodthirst].timer && player.spells[spellclasses.Bloodthirst].timer < next) next = player.spells[spellclasses.Bloodthirst].timer;
            if (player.spells[spellclasses.MortalStrike] && player.spells[spellclasses.MortalStrike].timer && player.spells[spellclasses.MortalStrike].timer < next) next = player.spells[spellclasses.MortalStrike].timer;
            if (player.spells[spellclasses.Whirlwind] && player.spells[spellclasses.Whirlwind].timer && player.spells[spellclasses.Whirlwind].timer < next) next = player.spells[spellclasses.Whirlwind].timer;
            if (player.spells[spellclasses.Bloodrage] && player.spells[spellclasses.Bloodrage].timer && player.spells[spellclasses.Bloodrage].timer < next) next = player.spells[spellclasses.Bloodrage].timer;
            if (player.spells[spellclasses.Overpower] && player.spells[spellclasses.Overpower].timer && player.spells[spellclasses.Overpower].timer < next) next = player.spells[spellclasses.Overpower].timer;
            if (player.spells[spellclasses.Execute] && player.spells[spellclasses.Execute].timer && player.spells[spellclasses.Execute].timer < next) next = player.spells[spellclasses.Execute].timer;

            if (player.spells[spellclasses.HeroicStrike] && player.spells[spellclasses.HeroicStrike].unqueue) {
                let timeleft = Math.max(player.mh.timer - player.spells[spellclasses.HeroicStrike].unqueuetimer);
                if (timeleft > 0 && timeleft < next) next = timeleft;
            }

            // if (next == 0) { debugger; break; } // Something went wrong!
            incrementStep(next);
            player.mh.step(next);
            if (player.oh) player.oh.step(next);
            if (player.timer && player.steptimer(next) && !player.spelldelay) spellcheck = true;
            if (player.itemtimer && player.stepitemtimer(next) && !player.spelldelay) spellcheck = true;
            if (player.dodgetimer) player.stepdodgetimer(next);
            if (player.spelldelay) player.spelldelay += next;
            if (player.heroicdelay) player.heroicdelay += next;

            if (player.spells[spellclasses.Bloodthirst] && player.spells[spellclasses.Bloodthirst].timer && !player.spells[spellclasses.Bloodthirst].step(next) && !player.spelldelay) spellcheck = true;
            if (player.spells[spellclasses.MortalStrike] && player.spells[spellclasses.MortalStrike].timer && !player.spells[spellclasses.MortalStrike].step(next) && !player.spelldelay) spellcheck = true;
            if (player.spells[spellclasses.Whirlwind] && player.spells[spellclasses.Whirlwind].timer && !player.spells[spellclasses.Whirlwind].step(next) && !player.spelldelay) spellcheck = true;
            if (player.spells[spellclasses.Bloodrage] && player.spells[spellclasses.Bloodrage].timer && !player.spells[spellclasses.Bloodrage].step(next) && !player.spelldelay) spellcheck = true;
            if (player.spells[spellclasses.Overpower] && player.spells[spellclasses.Overpower].timer && !player.spells[spellclasses.Overpower].step(next) && !player.spelldelay) spellcheck = true;
            if (player.spells[spellclasses.Execute] && player.spells[spellclasses.Execute].timer && !player.spells[spellclasses.Execute].step(next) && !player.spelldelay) spellcheck = true;

            if (player.auras[spellclasses.Bloodrage] && player.auras[spellclasses.Bloodrage].timer && !player.auras[spellclasses.Bloodrage].step() && !player.spelldelay) spellcheck = true;
            if (player.auras[spellclasses.Gabbar] && player.auras[spellclasses.Gabbar].timer) player.auras[spellclasses.Gabbar].step();
        }

        // Fight done
        player.endauras();

        this.totaldmg += this.idmg;
        this.totalduration += this.duration;
        let dps = this.idmg / this.duration;
        if (dps < this.mindps) this.mindps = dps;
        if (dps > this.maxdps) this.maxdps = dps;
        dps = Math.round(dps);
        if (!this.spread[dps]) this.spread[dps] = 1;
        else this.spread[dps]++;

        if (iteration == this.iterations) {
            this.endtime = new Date().getTime();
            if (this.cb_finished)
                this.cb_finished();
        }
        else if (iteration % this.maxcallstack == 0) {
            let view = this;
            if (this.cb_update)
                this.cb_update(iteration);
            setTimeout(function () { view.run(iteration + 1); }, 0);
        }
        else {
            this.run(iteration + 1);
        }
    }
}


