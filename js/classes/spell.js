import { step, rng, RESULT } from './utility.js';

export class Spell {
    constructor(player) {
        this.timer = 0;
        this.cost = 0;
        this.cooldown = 0;
        this.player = player;
        this.refund = true;
        this.canDodge = true;
        this.totaldmg = 0;
        this.data = [0, 0, 0, 0, 0];
        this.name = this.constructor.name;
        this.useonly = false;
        this.maxdelay = 100;
        this.weaponspell = true;
    }
    dmg() {
        return 0;
    }
    use() {
        this.player.timer = 1500;
        this.player.rage -= this.cost;
        this.timer = this.cooldown * 1000;
    }
    step(a) {
        if (this.timer <= a) {
            this.timer = 0;
            //if (log) this.player.log(`${this.name} off cooldown`);
        }
        else {
            this.timer -= a;
        }
        return this.timer;
    }
    canUse() {
        return this.timer == 0 && this.cost <= this.player.rage;
    }
}

export class Bloodthirst extends Spell {
    constructor(player, data) {
        super(player);
        this.cost = 30;
        this.cooldown = 6;
        this.threshold = parseInt(data.minrage);
        this.maxdelay = parseInt(data.reaction);
        this.weaponspell = false;
    }
    dmg() {
        return this.player.stats.ap * 0.45;
    }
    canUse() {
        return !this.timer && !this.player.timer && this.cost <= this.player.rage && this.player.rage >= this.threshold;
    }
}

export class Whirlwind extends Spell {
    constructor(player, data) {
        super(player);
        this.cost = 25;
        this.cooldown = 10;
        this.refund = false;
        this.threshold = parseInt(data.minrage);
        this.maincd = parseInt(data.maincd) * 1000;
        this.maxdelay = parseInt(data.reaction);
    }
    dmg() {
        let dmg;
        if (this.player.weaponrng) dmg = rng(this.player.mh.mindmg + this.player.mh.bonusdmg, this.player.mh.maxdmg + this.player.mh.bonusdmg);
        else dmg = avg(this.player.mh.mindmg + this.player.mh.bonusdmg, this.player.mh.maxdmg + this.player.mh.bonusdmg);
        return dmg + (this.player.stats.ap / 14) * this.player.mh.normSpeed;
    }
    canUse() {
        return !this.timer && !this.player.timer && this.cost <= this.player.rage && (this.player.rage >= this.threshold ||
            (this.player.spells.bloodthirst && this.player.spells.bloodthirst.timer >= this.maincd) ||
            (this.player.spells.mortalstrike && this.player.spells.mortalstrike.timer >= this.maincd));
    }
}

export class Overpower extends Spell {
    constructor(player, data) {
        super(player);
        this.cost = 5;
        this.cooldown = 5;
        this.canDodge = false;
        this.threshold = parseInt(data.maxrage);
        this.maincd = parseInt(data.maincd);
        this.maxdelay = parseInt(data.reaction);
    }
    dmg() {
        let dmg;
        if (this.player.weaponrng) dmg = 35 + rng(this.player.mh.mindmg + this.player.mh.bonusdmg, this.player.mh.maxdmg + this.player.mh.bonusdmg);
        else dmg = 35 + avg(this.player.mh.mindmg + this.player.mh.bonusdmg, this.player.mh.maxdmg + this.player.mh.bonusdmg);
        return dmg + (this.player.stats.ap / 14) * this.player.mh.normSpeed;
    }
    use() {
        this.player.timer = 1500;
        this.player.dodgetimer = 0;
        this.player.rage = Math.min(this.player.rage, this.player.talents.rageretained);
        this.player.rage -= this.cost;
        this.timer = this.cooldown * 1000;
        if (this.player.zerkstance)
            this.player.auras.battlestance.use();
    }
    canUse() {
        return !this.timer && !this.player.timer && this.cost <= this.player.rage && this.player.dodgetimer && this.player.rage <= this.threshold &&
            ((this.player.spells.bloodthirst && this.player.spells.bloodthirst.timer >= this.maincd) ||
            (this.player.spells.mortalstrike && this.player.spells.mortalstrike.timer >= this.maincd));
    }
}

export class Execute extends Spell {
    constructor(player, data) {
        super(player);
        this.cost = 15 - player.talents.executecost;
        this.usedrage = 0;
        this.maxdelay = parseInt(data.reaction);
        this.refund = false;
        this.weaponspell = false;
    }
    dmg() {
        return 600 + (15 * this.usedrage);
    }
    use() {
        this.player.timer = 1500;
        this.player.rage -= this.cost;
        this.usedrage = ~~this.player.rage;
        this.timer = 400 - (step % 400);
    }
    step(a) {
        if (this.timer <= a) {
            this.timer = 0;
            if (this.result != RESULT.MISS && this.result != RESULT.DODGE)
                this.player.rage = 0;
            //if (log) this.player.log(`Execute batch (${Object.keys(RESULT)[this.result]})`);
        }
        else {
            this.timer -= a;
        }
        return this.timer;
    }
    canUse() {
        return !this.player.timer && this.cost <= this.player.rage;
    }
}

export class Bloodrage extends Spell {
    constructor(player, data) {
        super(player);
        this.cost = 0;
        this.rage = 10 + player.talents.bloodragebonus;
        this.threshold = 80;
        this.cooldown = 60;
        this.useonly = true;
        this.maxdelay = parseInt(data.reaction);
    }
    use() {
        this.timer = this.cooldown * 1000;
        this.player.rage = Math.min(this.player.rage + this.rage, 100);
        this.player.auras.bloodrage.use();
    }
    canUse() {
        return this.timer == 0 && this.player.rage < this.threshold;
    }
}

export class HeroicStrike extends Spell {
    constructor(player, data) {
        super(player);
        this.cost = 15 - player.talents.impheroicstrike;
        this.threshold = parseInt(data.minrage);
        this.maincd = parseInt(data.maincd) * 1000;
        this.unqueue = parseInt(data.unqueue);
        this.unqueuetimer = parseInt(data.unqueuetimer);
        this.name = 'Heroic Strike';
        this.bonus = player.aqbooks ? 157 : 138;
        this.maxdelay = parseInt(data.reaction);
        this.useonly = true;
    }
    use() {
        this.player.nextswinghs = true;
    }
    canUse() {
        return !this.player.nextswinghs && this.cost <= this.player.rage && (this.player.rage >= this.threshold ||
            (this.player.spells.bloodthirst && this.player.spells.bloodthirst.timer >= this.maincd) ||
            (this.player.spells.mortalstrike && this.player.spells.mortalstrike.timer >= this.maincd))
            && (!this.unqueue || (this.player.mh.timer > this.unqueuetimer));
    }
}

export class HeroicStrikeExecute extends Spell {
    constructor(player, data) {
        super(player);
        this.cost = 15 - player.talents.impheroicstrike;
        this.threshold = parseInt(data.minrage);
        this.unqueue = parseInt(data.unqueue);
        this.unqueuetimer = parseInt(data.unqueuetimer);
        this.name = 'Heroic Strike (Execute Phase)';
        this.bonus = player.aqbooks ? 157 : 138;
        this.maxdelay = parseInt(data.reaction);
        this.useonly = true;
    }
    use() {
        this.player.nextswinghs = true;
    }
    canUse() {
        return !this.player.nextswinghs && this.cost <= this.player.rage && this.player.rage >= this.threshold
            && (!this.unqueue || (this.player.mh.timer > this.unqueuetimer));
    }
}

export class MortalStrike extends Spell {
    constructor(player, data) {
        super(player);
        this.cost = 30;
        this.cooldown = 6;
        this.name = 'Mortal Strike';
        this.threshold = parseInt(data.minrage);
        this.maxdelay = parseInt(data.reaction);
    }
    dmg() {
        let dmg;
        if (this.player.weaponrng) dmg = 160 + rng(this.player.mh.mindmg + this.player.mh.bonusdmg, this.player.mh.maxdmg + this.player.mh.bonusdmg);
        else dmg = 160 + avg(this.player.mh.mindmg + this.player.mh.bonusdmg, this.player.mh.maxdmg + this.player.mh.bonusdmg);
        return dmg + (this.player.stats.ap / 14) * this.player.mh.normSpeed;
    }
    canUse() {
        return !this.timer && !this.player.timer && this.cost <= this.player.rage && this.player.rage >= this.threshold;
    }
}

export class SunderArmor extends Spell {
    constructor(player, data) {
        super(player);
        this.cost = 15 - player.talents.impsunderarmor;
        this.globals = parseInt(data.globals);
        this.maxdelay = parseInt(data.reaction);
        this.stacks = 0;
        this.nocrit = true;
        this.name = 'Sunder Armor';
    }
    use() {
        this.player.timer = 1500;
        this.player.rage -= this.cost;
        this.stacks++;
    }
    canUse() {
        return !this.player.timer && this.stacks < this.globals && this.cost <= this.player.rage;
    }
}

export class Hamstring extends Spell {
    constructor(player, data) {
        super(player);
        this.cost = 10;
        this.threshold = parseInt(data.minrage);
        this.maxdelay = parseInt(data.reaction);
        if (player.items.includes(19577)) this.cost -= 2;
    }
    dmg() {
        return 45;
    }
    canUse() {
        return !this.player.timer && this.player.rage >= this.threshold && this.cost <= this.player.rage;
    }
}

export class Aura {
    constructor(player) {
        this.timer = 0;
        this.starttimer = 0;
        this.stats = {};
        this.mult_stats = {};
        this.player = player;
        this.firstuse = true;
        this.duration = 0;
        this.stacks = 0;
        this.uptime = 0;
        this.name = this.constructor.name;
        this.maxdelay = 100;
        this.useonly = true;
    }
    use() {
        if (this.timer) this.uptime += (step - this.starttimer);
        this.timer = step + this.duration * 1000;
        this.starttimer = step;
        this.player.updateAuras();
        //if (log) this.player.log(`${this.name} applied`);
    }
    step() {
        if (step >= this.timer) {
            this.uptime += (this.timer - this.starttimer);
            this.timer = 0;
            this.firstuse = false;
            this.player.updateAuras();
            //if (log) this.player.log(`${this.name} removed`);
        }
    }
    end() {
        this.uptime += (step - this.starttimer);
        this.timer = 0;
        this.stacks = 0;
    }
}

export class Recklessness extends Aura {
    constructor(player, data) {
        super(player);
        this.duration = 15;
        this.stats = { crit: 100 };
        this.maxdelay = parseInt(data.reaction);
        this.timetoend = parseInt(data.timetoend) * 1000;
    }
    use() {
        if (this.timer) this.uptime += (step - this.starttimer);
        this.timer = step + this.duration * 1000;
        this.player.timer = 1500;
        this.starttimer = step;
        this.player.updateAuras();
        //if (log) this.player.log(`${this.name} applied`);
    }
    canUse() {
        return this.firstuse && !this.timer && !this.player.timer && step >= this.usestep;
    }
}

export class Flurry extends Aura {
    constructor(player) {
        super(player);
        this.duration = 12;
        this.mult_stats = { haste: player.talents.flurry };
    }
    proc() {
        this.stacks--;
        if (!this.stacks) {
            this.uptime += step - this.starttimer;
            this.timer = 0;
            this.player.updateHaste();
            //if (log) this.player.log(`${this.name} removed`);
        }
    }
    use() {
        this.timer = 1;
        if (!this.stacks) {
            this.starttimer = step;
            this.player.updateHaste();
        }
        this.stacks = 3;
        //if (log) this.player.log(`${this.name} applied`);
    }
}

export class DeepWounds extends Aura {
    constructor(player) {
        super(player);
        this.duration = 12;
        this.name = 'Deep Wounds';
        this.totaldmg = 0;
    }
    step(simulation) {
        this.uptime += this.timer < 200 ? this.timer : 200;
        this.timer = this.timer < 200 ? 0 : this.timer - 200;
        if (this.timer == 0 || this.timer % 3000 == 0 || this.timer % 6000 == 0 || this.timer % 9000 == 0) {
            let min = this.player.mh.mindmg + this.player.mh.bonusdmg + (this.player.stats.ap / 14) * this.player.mh.speed;
            let max = this.player.mh.maxdmg + this.player.mh.bonusdmg + (this.player.stats.ap / 14) * this.player.mh.speed;
            let dmg = (min + max) / 2;
            dmg *= this.player.mh.modifier * this.player.stats.dmgmod * this.player.talents.deepwounds;
            simulation.idmg += ~~(dmg / 4);
            this.totaldmg += ~~(dmg / 4);
        }
    }
    use() {
        this.timer = this.duration * 1000;
    }
}

export class Crusader extends Aura {
    constructor(player) {
        super(player);
        this.duration = 15;
        this.stats = { str: 100 };
    }
    use() {
        if (this.timer) this.uptime += (step - this.starttimer);
        this.timer = step + this.duration * 1000;
        this.starttimer = step;
        this.player.updateStrength();
        //if (log) this.player.log(`${this.name} applied`);
    }
    step() {
        if (step >= this.timer) {
            this.uptime += (this.timer - this.starttimer);
            this.timer = 0;
            this.player.updateStrength();
            //if (log) this.player.log(`${this.name} removed`);
        }
    }
}

export class Cloudkeeper extends Aura {
    constructor(player) {
        super(player);
        this.duration = 30;
        this.stats = { ap: 100 };
    }
    use() {
        this.player.timer = 1500;
        this.player.itemtimer = this.duration * 1000;
        this.timer = step + this.duration * 1000;
        this.starttimer = step;
        this.player.updateAuras();
        //if (log) this.player.log(`${this.name} applied`);
    }
    canUse() {
        return this.firstuse && !this.player.itemtimer && !this.timer && !this.player.timer;
    }
}

export class Felstriker extends Aura {
    constructor(player) {
        super(player);
        this.duration = 3;
        this.stats = { crit: 100, hit: 100 };
    }
    use() {
        if (this.timer) this.uptime += (step - this.starttimer);
        this.timer = step + this.duration * 1000;
        this.starttimer = step;
        this.player.update();
        //if (log) this.player.log(`${this.name} applied`);
    }
    step() {
        if (step >= this.timer) {
            this.uptime += (this.timer - this.starttimer);
            this.timer = 0;
            this.firstuse = false;
            this.player.update();
            //if (log) this.player.log(`${this.name} removed`);
        }
    }
}

export class DeathWish extends Aura {
    constructor(player, data) {
        super(player);
        this.duration = 30;
        this.mult_stats = { dmgmod: 20 };
        this.name = 'Death Wish';
        this.crusaders = parseInt(data.crusaders);
        this.timetoend = parseInt(data.timetoend) * 1000;
        this.maxdelay = parseInt(data.reaction);
    }
    use() {
        if (this.timer) this.uptime += (step - this.starttimer);
        this.timer = step + this.duration * 1000;
        this.player.rage -= 10;
        this.player.timer = 1500;
        this.starttimer = step;
        this.player.updateDmgMod();
        //if (log) this.player.log(`${this.name} applied`);
    }
    canUse() {
        return this.firstuse && !this.timer && !this.player.timer && this.player.rage >= 10 && (step >= this.usestep ||
            (this.crusaders == 1 && ((this.player.auras.crusader1 && this.player.auras.crusader1.timer) || (this.player.auras.crusader2 && this.player.auras.crusader2.timer))) ||
            (this.crusaders == 2 && this.player.auras.crusader1 && this.player.auras.crusader1.timer && this.player.auras.crusader2 && this.player.auras.crusader2.timer));
    }
    step() {
        if (step >= this.timer) {
            this.uptime += (this.timer - this.starttimer);
            this.timer = 0;
            this.firstuse = false;
            this.player.updateDmgMod();
            //if (log) this.player.log(`${this.name} removed`);
        }
    }
}

export class BattleStance extends Aura {
    constructor(player) {
        super(player);
        this.duration = 2;
        this.stats = { crit: -3 };
        this.name = 'Battle Stance';
    }
    step() {
        if (step >= this.timer) {
            this.uptime += (this.timer - this.starttimer);
            this.timer = 0;
            this.firstuse = false;
            this.player.updateAuras();
            this.player.rage = Math.min(this.player.rage, this.player.talents.rageretained);
            //if (log) this.player.log(`${this.name} removed`);
        }
    }
}

export class MightyRagePotion extends Aura {
    constructor(player, data) {
        super(player);
        this.stats = { str: 60 };
        this.duration = 20;
        this.crusaders = parseInt(data.crusaders);
        this.timetoend = parseInt(data.timetoend) * 1000;
        this.maxdelay = parseInt(data.reaction);
        this.name = 'Mighty Rage Potion';
    }
    use() {
        if (this.timer) this.uptime += (step - this.starttimer);
        this.player.rage = Math.min(this.player.rage + ~~rng(45, 75), 100);
        this.timer = step + this.duration * 1000;
        this.starttimer = step;
        this.player.updateStrength();
        //if (log) this.player.log(`${this.name} applied`);
    }
    canUse() {
        return this.firstuse && !this.timer && (step >= this.usestep ||
            (this.crusaders == 1 && ((this.player.auras.crusader1 && this.player.auras.crusader1.timer) || (this.player.auras.crusader2 && this.player.auras.crusader2.timer))) ||
            (this.crusaders == 2 && this.player.auras.crusader1 && this.player.auras.crusader1.timer && this.player.auras.crusader2 && this.player.auras.crusader2.timer));
    }
    step() {
        if (step >= this.timer) {
            this.uptime += (this.timer - this.starttimer);
            this.timer = 0;
            this.firstuse = false;
            this.player.updateStrength();
            //if (log) this.player.log(`${this.name} removed`);
        }
    }
}

export class BloodFury extends Aura {
    constructor(player, data) {
        super(player);
        this.duration = 15;
        this.mult_stats = { apmod: 25 };
        this.name = 'Blood Fury';
        this.maxdelay = parseInt(data.reaction);
        this.timetoend = parseInt(data.timetoend) * 1000;
    }
    use() {
        if (this.timer) this.uptime += (step - this.starttimer);
        this.timer = step + this.duration * 1000;
        this.starttimer = step;
        this.player.timer = 1500;
        this.player.updateAuras();
        //if (log) this.player.log(`${this.name} applied`);
    }
    step() {
        if (step >= this.timer) {
            this.uptime += (this.timer - this.starttimer);
            this.timer = 0;
            this.firstuse = false;
            this.player.updateAuras();
            //if (log) this.player.log(`${this.name} removed`);
        }
    }
    canUse() {
        return this.firstuse && !this.timer && !this.player.timer && step >= this.usestep;
    }
}

export class Berserking extends Aura {
    constructor(player, data) {
        super(player);
        this.duration = 10;
        this.mult_stats = { haste: parseInt(data.haste) };
        this.maxdelay = parseInt(data.reaction);
        this.timetoend = parseInt(data.timetoend) * 1000;
    }
    use() {
        if (this.timer) this.uptime += (step - this.starttimer);
        this.timer = step + this.duration * 1000;
        this.starttimer = step;
        this.player.rage -= 5;
        this.player.timer = 1500;
        this.player.updateHaste();
        //if (log) this.player.log(`${this.name} applied`);
    }
    step() {
        if (step >= this.timer) {
            this.uptime += (this.timer - this.starttimer);
            this.timer = 0;
            this.firstuse = false;
            this.player.updateHaste();
            //if (log) this.player.log(`${this.name} removed`);
        }
    }
    canUse() {
        return this.firstuse && !this.timer && !this.player.timer && this.player.rage >= 5 && step >= this.usestep;
    }
}

export class Empyrean extends Aura {
    constructor(player) {
        super(player);
        this.duration = 10;
        this.mult_stats = { haste: 20 };
        this.name = 'Empyrean Haste';
    }
    use() {
        if (this.timer) this.uptime += (step - this.starttimer);
        this.timer = step + this.duration * 1000;
        this.starttimer = step;
        this.player.updateHaste();
        //if (log) this.player.log(`${this.name} applied`);
    }
    step() {
        if (step >= this.timer) {
            this.uptime += (this.timer - this.starttimer);
            this.timer = 0;
            this.firstuse = false;
            this.player.updateHaste();
            //if (log) this.player.log(`${this.name} removed`);
        }
    }
}

export class Eskhandar extends Aura {
    constructor(player) {
        super(player);
        this.duration = 5;
        this.mult_stats = { haste: 30 };
        this.name = 'Eskhandar Haste';
    }
    use() {
        if (this.timer) this.uptime += (step - this.starttimer);
        this.timer = step + this.duration * 1000;
        this.starttimer = step;
        this.player.updateHaste();
        //if (log) this.player.log(`${this.name} applied`);
    }
    step() {
        if (step >= this.timer) {
            this.uptime += (this.timer - this.starttimer);
            this.timer = 0;
            this.firstuse = false;
            this.player.updateHaste();
            //if (log) this.player.log(`${this.name} removed`);
        }
    }
}

export class Zeal extends Aura {
    constructor(player) {
        super(player);
        this.duration = 15;
        this.stats = { bonusdmg: 10 };
    }
    use() {
        if (this.timer) this.uptime += (step - this.starttimer);
        this.timer = step + this.duration * 1000;
        this.starttimer = step;
        this.player.updateBonusDmg();
        //if (log) this.player.log(`${this.name} applied`);
    }
    step() {
        if (step >= this.timer) {
            this.uptime += (this.timer - this.starttimer);
            this.timer = 0;
            this.firstuse = false;
            this.player.updateBonusDmg();
            //if (log) this.player.log(`${this.name} removed`);
        }
    }
}

export class Annihilator extends Aura {
    constructor(player) {
        super(player);
        this.duration = 45;
        this.armor = 200;
        this.stacks = 0;
    }
    use() {
        if (rng10k() < this.player.target.binaryresist) return;
        if (this.timer) this.uptime += (step - this.starttimer);
        this.timer = step + this.duration * 1000;
        this.starttimer = step;
        this.stacks = this.stacks > 2 ? 3 : this.stacks + 1;
        this.player.updateArmorReduction();
        //if (log) this.player.log(`${this.name} applied`);
    }
    step() {
        if (step >= this.timer) {
            this.uptime += (this.timer - this.starttimer);
            this.timer = 0;
            this.firstuse = false;
            this.player.updateArmorReduction();
            //if (log) this.player.log(`${this.name} removed`);
        }
    }
}

export class Bonereaver extends Aura {
    constructor(player) {
        super(player);
        this.duration = 10;
        this.armor = 700;
        this.stacks = 0;
    }
    use() {
        if (this.timer) this.uptime += (step - this.starttimer);
        this.timer = step + this.duration * 1000;
        this.starttimer = step;
        this.stacks = this.stacks > 2 ? 3 : this.stacks + 1;
        this.player.updateArmorReduction();
        //if (log) this.player.log(`${this.name} applied`);
    }
    step() {
        if (step >= this.timer) {
            this.uptime += (this.timer - this.starttimer);
            this.timer = 0;
            this.firstuse = false;
            this.player.updateArmorReduction();
            //if (log) this.player.log(`${this.name} removed`);
        }
    }
}

export class Destiny extends Aura {
    constructor(player) {
        super(player);
        this.duration = 10;
        this.stats = { str: 200 };
    }
}

export class Untamed extends Aura {
    constructor(player) {
        super(player);
        this.duration = 8;
        this.stats = { str: 300 };
        this.name = 'The Untamed Blade';
    }
}

export class Pummeler extends Aura {
    constructor(player) {
        super(player);
        this.duration = 30;
        this.mult_stats = { haste: 50 };
        this.name = 'Manual Crowd Pummeler';
    }
    use() {
        this.player.timer = 1500;
        if (this.timer) this.uptime += (step - this.starttimer);
        this.timer = step + this.duration * 1000;
        this.starttimer = step;
        this.player.updateHaste();
        //if (log) this.player.log(`${this.name} applied`);
    }
    step() {
        if (step >= this.timer) {
            this.uptime += (this.timer - this.starttimer);
            this.timer = 0;
            this.firstuse = false;
            this.player.updateHaste();
            //if (log) this.player.log(`${this.name} removed`);
        }
    }
    canUse() {
        return this.firstuse && !this.timer && !this.player.timer && !this.player.itemtimer;
    }
}

export class Windfury extends Aura {
    constructor(player) {
        super(player);
        this.stats = { ap: 315 };
    }
    use() {
        if (this.timer) this.uptime += (step - this.starttimer);
        this.timer = step + 1500;
        this.starttimer = step;
        this.mintime = step % 400;
        this.stacks = 2;
        this.player.updateAP();
        this.player.extraattacks++;
        //if (log) this.player.log(`${this.name} applied`);
    }
    proc() {
        if (this.stacks < 2) {
            if (step < this.mintime)
                this.timer = this.mintime;
            else
                this.step();
            this.stacks = 0;
        }
        else {
            this.stacks--;
        }
    }
    step() {
        if (step >= this.timer) {
            this.uptime += (this.timer - this.starttimer);
            this.timer = 0;
            this.stacks = 0;
            this.firstuse = false;
            this.player.updateAP();
            //if (log) this.player.log(`${this.name} removed`);
        }
    }
}

export class Swarmguard extends Aura {
    constructor(player) {
        super(player);
        this.duration = 30;
        this.armor = 200;
        this.stacks = 0;
        this.chance = 5000;
        this.timetoend = 30000;
    }
    use() {
        this.timer = step + this.duration * 1000;
        this.starttimer = step;
        this.stacks = 0;
        //if (log) this.player.log(`${this.name} applied`);
    }
    canUse() {
        return this.firstuse && !this.timer && step >= this.usestep;
    }
    proc() {
        this.stacks = Math.min(this.stacks + 1, 6);
        this.player.updateArmorReduction();
        //if (log) this.player.log(`${this.name} proc`);
    }
    step() {
        if (step >= this.timer) {
            this.uptime += (this.timer - this.starttimer);
            this.timer = 0;
            this.stacks = 0;
            this.firstuse = false;
            this.player.updateArmorReduction();
            //if (log) this.player.log(`${this.name} removed`);
        }
    }
}

export class Flask extends Aura {
    constructor(player) {
        super(player);
        this.duration = 60;
        this.stats = { str: 75 };
        this.name = 'Diamond Flask';
    }
    use() {
        this.player.timer = 1500;
        this.player.itemtimer = this.duration * 1000;
        this.timer = step + this.duration * 1000;
        this.starttimer = step;
        this.player.updateAuras();
        //if (log) this.player.log(`${this.name} applied`);
    }
    canUse() {
        return this.firstuse && !this.timer && !this.player.timer && !this.player.itemtimer;
    }
}

export class Slayer extends Aura {
    constructor(player) {
        super(player);
        this.duration = 20;
        this.stats = { ap: 260 };
        this.name = 'Slayer\'s Crest';
    }
    use() {
        this.player.timer = 1500;
        this.player.itemtimer = this.duration * 1000;
        this.timer = step + this.duration * 1000;
        this.starttimer = step;
        this.player.updateAP();
        //if (log) this.player.log(`${this.name} applied`);
    }
    canUse() {
        return this.firstuse && !this.timer && !this.player.timer && !this.player.itemtimer;
    }
}

export class Spider extends Aura {
    constructor(player) {
        super(player);
        this.duration = 15;
        this.mult_stats = { haste: 20 };
        this.name = 'Kiss of the Spider';
    }
    use() {
        this.player.timer = 1500;
        this.player.itemtimer = this.duration * 1000;
        this.timer = step + this.duration * 1000;
        this.starttimer = step;
        this.player.updateHaste();
        //if (log) this.player.log(`${this.name} applied`);
    }
    canUse() {
        return this.firstuse && !this.timer && !this.player.timer && !this.player.itemtimer;
    }
}

export class Earthstrike extends Aura {
    constructor(player) {
        super(player);
        this.duration = 20;
        this.stats = { ap: 280 };
    }
    use() {
        this.player.timer = 1500;
        this.player.itemtimer = this.duration * 1000;
        this.timer = step + this.duration * 1000;
        this.starttimer = step;
        this.player.updateAP();
        //if (log) this.player.log(`${this.name} applied`);
    }
    canUse() {
        return this.firstuse && !this.timer && !this.player.timer && !this.player.itemtimer;
    }
}

export class Gabbar extends Aura {
    constructor(player) {
        super(player);
        this.duration = 20;
        this.stats = { ap: 65 };
        this.name = 'Jom Gabbar';
    }
    use() {
        this.stats.ap = 65;
        this.player.timer = 1500;
        this.player.itemtimer = this.duration * 1000;
        this.timer = step + this.duration * 1000;
        this.starttimer = step;
        this.player.updateAP();
        //if (log) this.player.log(`${this.name} applied`);
    }
    canUse() {
        return this.firstuse && !this.timer && !this.player.timer && !this.player.itemtimer;
    }
    step() {
        if ((step - this.starttimer) % 2000 == 0) {
            this.stats.ap += 65;
            this.player.updateAP();
            //if (log) this.player.log(`${this.name} tick`);
        }
        if (step >= this.timer) {
            this.uptime += (this.timer - this.starttimer);
            this.timer = 0;
            this.firstuse = false;
            this.player.updateAP();
            //if (log) this.player.log(`${this.name} removed`);
        }
    }
}

export class PrimalBlessing extends Aura {
    constructor(player) {
        super(player);
        this.duration = 12;
        this.stats = { ap: 300 };
        this.name = 'Primal Blessing';
    }
}

export class BloodrageAura extends Aura {
    constructor(player) {
        super(player);
        this.duration = 10;
        this.name = 'Bloodrage';
    }
    use() {
        if (this.timer) this.uptime += (step - this.starttimer);
        this.timer = step + this.duration * 1000;
        this.starttimer = step;
        //if (log) this.player.log(`${this.name} applied`);
    }
    step() {
        if ((step - this.starttimer) % 1000 == 0) {
            this.player.rage = Math.min(this.player.rage + 1, 100);
            //if (log) this.player.log(`${this.name} tick`);
        }
        if (step >= this.timer) {
            this.uptime += (this.timer - this.starttimer);
            this.timer = 0;
            //if (log) this.player.log(`${this.name} removed`);
        }
        return this.timer;
    }
}

export class Zandalarian extends Aura {
    constructor(player) {
        super(player);
        this.duration = 20;
        this.stats = { bonusdmg: 40 };
    }
    use() {
        this.player.timer = 1500;
        this.player.itemtimer = this.duration * 1000;
        this.timer = step + this.duration * 1000;
        this.starttimer = step;
        this.stats.bonusdmg = 40;
        this.player.updateBonusDmg();
        //if (log) this.player.log(`${this.name} applied`);
    }
    proc() {
        this.stats.bonusdmg -= 2;
        this.player.updateBonusDmg();
        if (this.stats.bonusdmg <= 0) {
            this.timer = step;
            this.step();
        }
        //this.player.log(`${this.name} proc ${this.stats.bonusdmg} `);
    }
    canUse() {
        return this.firstuse && !this.timer && !this.player.timer && !this.player.itemtimer;
    }
    step() {
        if (step >= this.timer) {
            this.uptime += (this.timer - this.starttimer);
            this.timer = 0;
            this.firstuse = false;
            this.player.updateBonusDmg();
            //if (log) this.player.log(`${this.name} removed`);
        }
    }
}

export class Avenger extends Aura {
    constructor(player) {
        super(player);
        this.duration = 10;
        this.stats = { ap: 200 };
        this.name = 'Argent Avenger';
    }
}
