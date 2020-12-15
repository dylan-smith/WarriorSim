import { races } from '../data/races.js';
import { talents } from '../data/talents.js';
import { gear, enchant, sets } from '../data/gear.js';
import { Weapon } from './weapon.js';
import { buffs } from '../data/buffs.js';
import { spells, SpellFactory } from '../data/spells.js';
import { rng, rng10k, avg, RESULT, step } from './utility.js';
import * as spellclasses from './spell.js';

export class Player {
    constructor(testItem, testType, enchtype, options) {
        options = options || {};
        options.aqbooks = options.aqbooks || true;
        options.weaponrng = options.weaponrng || true;
        options.targetlevel = options.targetlevel || 63;
        options.targetarmor = options.targetarmor || 336;
        options.targetresistance = options.targetresistance || 24;
        options.racename = options.racename || 'Human';

        this.rage = 0;
        this.level = 60;
        this.timer = 0;
        this.itemtimer = 0;
        this.dodgetimer = 0;
        this.extraattacks = 0;
        this.batchedextras = 0;
        this.nextswinghs = false;
        this.nextswingcl = false;
        this.aqbooks = options.aqbooks;
        this.weaponrng = options.weaponrng;
        this.spelldamage = options.spelldamage;
        if (enchtype == 1) {
            this.testEnch = testItem;
            this.testEnchType = testType;
        }
        else if (enchtype == 2) {
            this.testTempEnch = testItem;
            this.testTempEnchType = testType;
        }
        else {
            this.testItem = testItem;
            this.testItemType = testType;
        }
        this.target = {
            level: options.targetlevel,
            basearmor: options.targetarmor,
            armor: options.targetarmor,
            defense: (options.targetlevel || 63) * 5,
            mitigation: 1 - 15 * (options.targetresistance / 6000),
            binaryresist: parseInt(10000 - (8300 * (1 - (options.targetresistance * 0.15 / 60))))
        };
        this.base = {
            ap: 0,
            agi: 0,
            str: 0,
            hit: 0,
            crit: 0,
            spellcrit: 0,
            skill_0: this.level * 5,
            skill_1: this.level * 5,
            skill_2: this.level * 5,
            skill_3: this.level * 5,
            skill_4: this.level * 5,
            skill_5: this.level * 5,
            haste: 1,
            strmod: 1,
            agimod: 1,
            dmgmod: 1,
            apmod: 1
        };
        this.stats = {};
        this.auras = {};
        this.spells = {};
        this.items = [];
        this.addRace(options.racename);
        this.addTalents();
        this.addGear();
        if (!this.mh) return;
        this.addSets();
        this.addEnchants();
        this.addTempEnchants();
        this.addBuffs();
        this.addSpells();

        if (this.talents.flurry) this.auras[spellclasses.Flurry] = SpellFactory(this, spellclasses.Flurry);
        if (this.spells[spellclasses.Overpower]) this.auras[spellclasses.BattleStance] = SpellFactory(this, spellclasses.BattleStance);
        if (this.spells[spellclasses.Bloodrage]) this.auras[spellclasses.Bloodrage] = SpellFactory(this, spellclasses.BloodrageAura);
        if (this.items.includes(9449)) this.auras[spellclasses.Pummeler] = SpellFactory(this, spellclasses.Pummeler);
        if (this.items.includes(14554)) this.auras[spellclasses.Cloudkeeper] = SpellFactory(this, spellclasses.Cloudkeeper);
        if (this.items.includes(20130)) this.auras[spellclasses.Flask] = SpellFactory(this, spellclasses.Flask);
        if (this.items.includes(23041)) this.auras[spellclasses.Slayer] = SpellFactory(this, spellclasses.Slayer);
        if (this.items.includes(22954)) this.auras[spellclasses.Spider] = SpellFactory(this, spellclasses.Spider);
        if (this.items.includes(23570)) this.auras[spellclasses.Gabbar] = SpellFactory(this, spellclasses.Gabbar);
        if (this.items.includes(21180)) this.auras[spellclasses.Earthstrike] = SpellFactory(this, spellclasses.Earthstrike);
        if (this.items.includes(21670)) this.auras[spellclasses.Swarmguard] = SpellFactory(this, spellclasses.Swarmguard);
        if (this.items.includes(19949)) this.auras[spellclasses.Zandalarian] = SpellFactory(this, spellclasses.Zandalarian);

        this.update();
        if (this.oh)
            this.oh.timer = Math.round(this.oh.speed * 1000 / this.stats.haste / 2);
    }
    addRace(racename) {
        for (let race of races) {
            if (race.name == racename) {
                this.base.aprace = race.ap;
                this.base.ap += race.ap;
                this.base.str += race.str;
                this.base.agi += race.agi;
                this.base.skill_0 += race.skill_0;
                this.base.skill_1 += race.skill_1;
                this.base.skill_2 += race.skill_2;
                this.base.skill_3 += race.skill_3;
            }
        }
    }
    addTalents() {
        this.talents = {};
        for (let tree in talents) {
            for (let talent of talents[tree].t) {
                this.talents = Object.assign(this.talents, talent.aura(talent.c));
            }
        }
    }
    addGear() {
        for (let type in gear) {
            for (let item of gear[type]) {
                if ((this.testItemType == type && this.testItem == item.id) ||
                    (this.testItemType != type && item.selected)) {
                    for (let prop in this.base)
                        this.base[prop] += item[prop] || 0;
                    if (item.skill && item.skill > 0) {
                        if (item.type == 'Varied') {
                            this.base['skill_1'] += item.skill;
                            this.base['skill_2'] += item.skill;
                            this.base['skill_3'] += item.skill;
                        }
                        else {
                            let sk = WEAPONTYPE[item.type.toUpperCase()];
                            this.base['skill_' + sk] += item.skill;
                        }
                    }

                    if (type == "mainhand" || type == "offhand" || type == "twohand")
                        this.addWeapon(item, type);

                    // Blazefury Medallion
                    if (item.id == 17111) {
                        this.attackproc = {};
                        this.attackproc.chance = item.procchance * 100;
                        this.attackproc.magicdmg = item.magicdmg;
                    }
                    
                    if (item.procchance && (type == "trinket1" || type == "trinket2")) {
                        let proc = {};
                        proc.chance = item.procchance * 100;
                        proc.extra = item.procextra;
                        proc.magicdmg = item.magicdmg;
                        if (item.procspell) {
                            this.auras[item.procspell] = SpellFactory(this, item.procspell);
                            proc.spell = this.auras[item.procspell];
                        }
                        this["trinketproc" + (this.trinketproc1 ? 2 : 1)] = proc;
                    }

                    this.items.push(item.id);
                }
            }
        }

        if (this.mh && this.mh.twohand) {
            for (let type in gear) {
                for (let item of gear[type]) {
                    if (type != "hands" && type != "head") continue;
                    if ((this.testItemType == type && this.testItem == item.id) ||
                        (this.testItemType != type && item.selected)) {
                        if (item.skill && item.skill > 0) {
                            if (item.type == 'Varied') {
                                this.base['skill_1'] -= item.skill;
                                this.base['skill_2'] -= item.skill;
                                this.base['skill_3'] -= item.skill;
                            }
                            else {
                                let sk = WEAPONTYPE[item.type.toUpperCase()];
                                this.base['skill_' + sk] -= item.skill;
                            }
                        }
                    }
                }
            }
        }
    }
    addWeapon(item, type) {

        let ench, tempench;
        for (let item of enchant[type]) {
            if (item.temp) continue;
            if (this.testEnchType == type && this.testEnch == item.id) ench = item;
            else if (this.testEnchType != type && item.selected) ench = item;
        }
        for (let item of enchant[type]) {
            if (!item.temp) continue;
            if (this.testTempEnchType == type && this.testTempEnch == item.id) tempench = item;
            else if (this.testTempEnchType != type && item.selected) tempench = item;
        }

        if (type == "mainhand")
            this.mh = new Weapon(this, item, ench, tempench, false, false);

        if (type == "offhand")
            this.oh = new Weapon(this, item, ench, tempench, true, false);

        if (type == "twohand")
            this.mh = new Weapon(this, item, ench, tempench, false, true);

    }
    addEnchants() {
        for (let type in enchant) {
            for (let item of enchant[type]) {
                if (item.temp) continue;
                if ((this.testEnchType == type && this.testEnch == item.id) ||
                    (this.testEnchType != type && item.selected)) {

                    for (let prop in this.base) {
                        if (prop == 'haste')
                            this.base.haste *= (1 + item.haste / 100) || 1;
                        else
                            this.base[prop] += item[prop] || 0;
                    }
                }
            }
        }
    }
    addTempEnchants() {
        for (let type in enchant) {
            for (let item of enchant[type]) {
                if (!item.temp) continue;
                if (type == "mainhand" && this.mh.windfury) continue;
                if ((this.testTempEnchType == type && this.testTempEnch == item.id) ||
                    (this.testTempEnchType != type && item.selected)) {

                    for (let prop in this.base) {
                        if (prop == 'haste')
                            this.base.haste *= (1 + item.haste / 100) || 1;
                        else
                            this.base[prop] += item[prop] || 0;
                    }
                }
            }
        }
    }
    addSets() {
        for (let set of sets) {
            let counter = 0;
            for (let item of set.items)
                if (this.items.includes(item))
                    counter++;
            if (counter == 0)
                continue;
            for (let bonus of set.bonus) {
                if (counter >= bonus.count) {
                    for (let prop in bonus.stats)
                        this.base[prop] += bonus.stats[prop] || 0;
                    if (bonus.stats.procspell) {
                        this.attackproc = {};
                        this.attackproc.chance = bonus.stats.procchance * 100;
                        this.auras[bonus.stats.procspell.name.toLowerCase()] = SpellFactory(this, bonus.stats.procspell);
                        this.attackproc.spell = this.auras[bonus.stats.procspell];
                    }
                    if (bonus.stats.enhancedbs) {
                        this.enhancedbs = true;
                    }
                }
            }
        }
    }
    addBuffs() {
        for (let buff of buffs) {
            if (buff.active) {
                let apbonus = 0;
                if (buff.group == "battleshout") {
                    let shoutap = this.aqbooks ? buff.ap + 39 : buff.ap;
                    if (buff.id == 27578 && this.enhancedbs) shoutap += 30;
                    shoutap = ~~(shoutap * (1 + this.talents.impbattleshout));
                    apbonus = shoutap - buff.ap;
                }
                if (buff.group == "zerkstance")
                    this.zerkstance = true;
                if (buff.group == "vaelbuff")
                    this.vaelbuff = true;
                if (buff.group == "dragonbreath")
                    this.dragonbreath = true;

                this.base.ap += (buff.ap || 0) + apbonus;
                this.base.agi += buff.agi || 0;
                this.base.str += buff.str || 0;
                this.base.crit += buff.crit || 0;
                this.base.hit += buff.hit || 0;
                this.base.spellcrit += buff.spellcrit || 0;
                this.base.agimod *= (1 + buff.agimod / 100) || 1;
                this.base.strmod *= (1 + buff.strmod / 100) || 1;
                this.base.dmgmod *= (1 + buff.dmgmod / 100) || 1;
                this.base.haste *= (1 + buff.haste / 100) || 1;

                if (buff.group == "blessingmight" && this.aqbooks)
                    this.base.ap += 36;
                if (buff.group == "graceair" && this.aqbooks)
                    this.base.agi += 10;
                if (buff.group == "strengthearth" && this.aqbooks)
                    this.base.str += 16;
            }
        }
    }
    addSpells() {
        for (let spell of spells) {
            if (spell.active) {
                if (spell.aura) this.auras[spell.classname] = SpellFactory(this, spell.classname);
                else this.spells[spell.classname] = SpellFactory(this, spell.classname);
            }
        }
    }
    reset(rage) {
        this.rage = rage;
        this.timer = 0;
        this.itemtimer = 0;
        this.dodgetimer = 0;
        this.spelldelay = 0;
        this.heroicdelay = 0;
        this.mh.timer = 0;
        if (this.oh)
            this.oh.timer = Math.round(this.oh.speed * 1000 / this.stats.haste / 2);
        this.extraattacks = 0;
        this.batchedextras = 0;
        this.nextswinghs = false;
        this.nextswingcl = false;
        for (let s in this.spells) {
            this.spells[s].timer = 0;
            this.spells[s].stacks = 0;
        }
        for (let s in this.auras) {
            this.auras[s].timer = 0;
            this.auras[s].firstuse = true;
            this.auras[s].stacks = 0;
        }
        this.update();
    }
    update() {
        this.updateAuras();
        this.updateArmorReduction();
        this.mh.glanceChance = this.getGlanceChance(this.mh);
        this.mh.miss = this.getMissChance(this.mh);
        this.mh.dwmiss = this.mh.miss;
        this.mh.dodge = this.getDodgeChance(this.mh);

        if (this.oh) {
            this.mh.dwmiss = this.getDWMissChance(this.mh);
            this.oh.glanceChance = this.getGlanceChance(this.oh);
            this.oh.miss = this.getMissChance(this.oh);
            this.oh.dwmiss = this.getDWMissChance(this.oh);
            this.oh.dodge = this.getDodgeChance(this.oh);
        }
    }
    updateAuras() {
        for (let prop in this.base)
            this.stats[prop] = this.base[prop];
        for (let name in this.auras) {
            if (this.auras[name].timer) {
                for (let prop in this.auras[name].stats)
                    this.stats[prop] += this.auras[name].stats[prop];
                for (let prop in this.auras[name].mult_stats)
                    this.stats[prop] *= (1 + this.auras[name].mult_stats[prop] / 100);
            }
        }
        this.stats.str = ~~(this.stats.str * this.stats.strmod);
        this.stats.agi = ~~(this.stats.agi * this.stats.agimod);
        this.stats.ap += this.stats.str * 2;
        this.stats.crit += this.stats.agi / 20;
        this.crit = this.getCritChance();

        if (this.stats.apmod != 1)
            this.stats.ap += ~~((this.base.aprace + this.stats.str * 2) * (this.stats.apmod - 1));
    }
    updateStrength() {
        this.stats.str = this.base.str;
        this.stats.ap = this.base.ap;
        
        for (let name in this.auras) {
            if (this.auras[name].timer) {
                if (this.auras[name].stats.str)
                    this.stats.str += this.auras[name].stats.str;
                if (this.auras[name].stats.ap)
                    this.stats.ap += this.auras[name].stats.ap;
            }
        }
        this.stats.str = ~~(this.stats.str * this.stats.strmod);
        this.stats.ap += this.stats.str * 2;

        if (this.stats.apmod != 1)
            this.stats.ap += ~~((this.base.aprace + this.stats.str * 2) * (this.stats.apmod - 1));
    }
    updateAP() {
        this.stats.ap = this.base.ap;
        for (let name in this.auras) {
            if (this.auras[name].timer && this.auras[name].stats.ap)
                this.stats.ap += this.auras[name].stats.ap;
        }
        this.stats.ap += this.stats.str * 2;

        if (this.stats.apmod != 1)
            this.stats.ap += ~~((this.base.aprace + this.stats.str * 2) * (this.stats.apmod - 1));
    }
    updateHaste() {
        this.stats.haste = this.base.haste;
        if (this.auras[spellclasses.Flurry] && this.auras[spellclasses.Flurry].timer)
            this.stats.haste *= (1 + this.auras[spellclasses.Flurry].mult_stats.haste / 100);
        if (this.auras[spellclasses.Berserking] && this.auras[spellclasses.Berserking].timer)
            this.stats.haste *= (1 + this.auras[spellclasses.Berserking].mult_stats.haste / 100);
        if (this.auras[spellclasses.Empyrean] && this.auras[spellclasses.Empyrean].timer)
            this.stats.haste *= (1 + this.auras[spellclasses.Empyrean].mult_stats.haste / 100);
        if (this.auras[spellclasses.Eskhandar] && this.auras[spellclasses.Eskhandar].timer)
            this.stats.haste *= (1 + this.auras[spellclasses.Eskhandar].mult_stats.haste / 100);
        if (this.auras[spellclasses.Pummeler] && this.auras[spellclasses.Pummeler].timer)
            this.stats.haste *= (1 + this.auras[spellclasses.Pummeler].mult_stats.haste / 100);
        if (this.auras[spellclasses.Spider] && this.auras[spellclasses.Spider].timer)
            this.stats.haste *= (1 + this.auras[spellclasses.Spider].mult_stats.haste / 100);
    }
    updateBonusDmg() {
        let bonus = 0;
        if (this.auras[spellclasses.Zeal] && this.auras[spellclasses.Zeal].timer)
            bonus += this.auras[spellclasses.Zeal].stats.bonusdmg;
        if (this.auras[spellclasses.Zandalarian] && this.auras[spellclasses.Zandalarian].timer)
            bonus += this.auras[spellclasses.Zandalarian].stats.bonusdmg;
        this.mh.bonusdmg = this.mh.basebonusdmg + bonus;
        if (this.oh)
            this.oh.bonusdmg = this.oh.basebonusdmg + bonus;
    }
    updateArmorReduction() {
        this.target.armor = this.target.basearmor;
        if (this.auras[spellclasses.Annihilator] && this.auras[spellclasses.Annihilator].timer)
            this.target.armor = Math.max(this.target.armor - (this.auras[spellclasses.Annihilator].stacks * this.auras[spellclasses.Annihilator].armor), 0);
        if (this.auras[spellclasses.Rivenspike] && this.auras[spellclasses.Rivenspike].timer)
            this.target.armor = Math.max(this.target.armor - (this.auras[spellclasses.Rivenspike].stacks * this.auras[spellclasses.Rivenspike].armor), 0);
        if (this.auras[spellclasses.Bonereaver] && this.auras[spellclasses.Bonereaver].timer)
            this.target.armor = Math.max(this.target.armor - (this.auras[spellclasses.Bonereaver].stacks * this.auras[spellclasses.Bonereaver].armor), 0);
        if (this.auras[spellclasses.Swarmguard] && this.auras[spellclasses.Swarmguard].timer)
            this.target.armor = Math.max(this.target.armor - (this.auras[spellclasses.Swarmguard].stacks * this.auras[spellclasses.Swarmguard].armor), 0);
        this.armorReduction = this.getArmorReduction();
    }
    updateDmgMod() {
        this.stats.dmgmod = this.base.dmgmod;
        for (let name in this.auras) {
            if (this.auras[name].timer && this.auras[name].mult_stats.dmgmod)
                this.stats.dmgmod *= (1 + this.auras[name].mult_stats.dmgmod / 100);
        }
    }
    getGlanceReduction(weapon) {
        let diff = this.target.defense - this.stats['skill_' + weapon.type];
        let low = 1.3 - 0.05 * diff;
        let high = 1.2 - 0.03 * diff;
        if (this.weaponrng) return rng(Math.min(low, 0.91)*1000,Math.min(high, 0.99)*1000) / 1000;
        else return avg(Math.min(low, 0.91)*1000,Math.min(high, 0.99)*1000) / 1000;  
    }
    getGlanceChance(weapon) {
        return 10 + (this.target.defense - Math.min(this.level * 5, this.stats['skill_' + weapon.type])) * 2;
    }
    getMissChance(weapon) {
        let diff = this.target.defense - this.stats['skill_' + weapon.type];
        let miss = 5 + (diff > 10 ? diff * 0.2 : diff * 0.1);
        miss -= (diff > 10 ? this.stats.hit - 1 : this.stats.hit);
        return miss;
    }
    getDWMissChance(weapon) {
        let diff = this.target.defense - this.stats['skill_' + weapon.type];
        let miss = 5 + (diff > 10 ? diff * 0.2 : diff * 0.1);
        miss = miss * 0.8 + 20; //v1
        //miss += 19; // v2
        miss -= (diff > 10 ? this.stats.hit - 1 : this.stats.hit);
        return miss;
    }
    getCritChance() {
        let crit = this.stats.crit + (this.talents.crit || 0) + (this.level - this.target.level) * 1 + (this.level - this.target.level) * 0.6;
        return Math.max(crit, 0);
    }
    getDodgeChance(weapon) {
        return 5 + (this.target.defense - this.stats['skill_' + weapon.type]) * 0.1;
    }
    getArmorReduction() {
        let r = this.target.armor / (this.target.armor + 400 + 85 * this.level);
        return r > 0.75 ? 0.75 : r;
    }
    addRage(dmg, result, weapon, spell) {
        if (!spell || spell instanceof spellclasses.HeroicStrike || spell instanceof spellclasses.HeroicStrikeExecute) {
            if (result != RESULT.MISS && result != RESULT.DODGE && this.talents.umbridledwrath && rng10k() < this.talents.umbridledwrath * 100) {
                this.rage += 1;
                //if (log) this.log('Unbridled Wrath proc');
            }
        }
        if (spell) {
            if (spell instanceof spellclasses.Execute) spell.result = result;
            if (result == RESULT.MISS || result == RESULT.DODGE)
                this.rage += spell.refund ? spell.cost * 0.8 : 0;
        }
        else {
            if (result == RESULT.DODGE)
                this.rage += (weapon.avgdmg() / 230.6) * 7.5 * 0.75;
            else if (result != RESULT.MISS)
                this.rage += (dmg / 230.6) * 7.5;
        }
        if (this.rage > 100) this.rage = 100;
    }
    steptimer(a) {
        if (this.timer <= a) {
            this.timer = 0;
            //if (log) this.log('Global CD off');
            return true;
        }
        else {
            this.timer -= a;
            return false;
        }
    }
    stepitemtimer(a) {
        if (this.itemtimer <= a) {
            this.itemtimer = 0;
            //if (log) this.log('Item CD off');
            return true;
        }
        else {
            this.itemtimer -= a;
            return false;
        }
    }
    stepdodgetimer(a) {
        if (this.dodgetimer <= a) {
            this.dodgetimer = 0;
        }
        else {
            this.dodgetimer -= a;
        }
    }
    stepauras() {

        if (this.mh.proc1 && this.mh.proc1.spell && this.mh.proc1.spell.timer) this.mh.proc1.spell.step();
        if (this.mh.proc2 && this.mh.proc2.spell && this.mh.proc2.spell.timer) this.mh.proc2.spell.step();
        if (this.oh && this.oh.proc1 && this.oh.proc1.spell && this.oh.proc1.spell.timer) this.oh.proc1.spell.step();
        if (this.oh && this.oh.proc2 && this.oh.proc2.spell && this.oh.proc2.spell.timer) this.oh.proc2.spell.step();

        if (this.auras[spellclasses.MightyRagePotion] && this.auras[spellclasses.MightyRagePotion].firstuse && this.auras[spellclasses.MightyRagePotion].timer) this.auras[spellclasses.MightyRagePotion].step();
        if (this.auras[spellclasses.Recklessness] && this.auras[spellclasses.Recklessness].firstuse && this.auras[spellclasses.Recklessness].timer) this.auras[spellclasses.Recklessness].step();
        if (this.auras[spellclasses.DeathWish] && this.auras[spellclasses.DeathWish].firstuse && this.auras[spellclasses.DeathWish].timer) this.auras[spellclasses.DeathWish].step();
        if (this.auras[spellclasses.Cloudkeeper] && this.auras[spellclasses.Cloudkeeper].firstuse && this.auras[spellclasses.Cloudkeeper].timer) this.auras[spellclasses.Cloudkeeper].step();
        if (this.auras[spellclasses.Flask] && this.auras[spellclasses.Flask].firstuse && this.auras[spellclasses.Flask].timer) this.auras[spellclasses.Flask].step();
        if (this.auras[spellclasses.BattleStance] && this.auras[spellclasses.BattleStance].timer) this.auras[spellclasses.BattleStance].step();
        if (this.auras[spellclasses.BloodFury] && this.auras[spellclasses.BloodFury].firstuse && this.auras[spellclasses.BloodFury].timer) this.auras[spellclasses.BloodFury].step();
        if (this.auras[spellclasses.Berserking] && this.auras[spellclasses.Berserking].firstuse && this.auras[spellclasses.Berserking].timer) this.auras[spellclasses.Berserking].step();
        if (this.auras[spellclasses.Slayer] && this.auras[spellclasses.Slayer].firstuse && this.auras[spellclasses.Slayer].timer) this.auras[spellclasses.Slayer].step();
        if (this.auras[spellclasses.Spider] && this.auras[spellclasses.Spider].firstuse && this.auras[spellclasses.Spider].timer) this.auras[spellclasses.Spider].step();
        if (this.auras[spellclasses.Earthstrike] && this.auras[spellclasses.Earthstrike].firstuse && this.auras[spellclasses.Earthstrike].timer) this.auras[spellclasses.Earthstrike].step();
        if (this.auras[spellclasses.Pummeler] && this.auras[spellclasses.Pummeler].firstuse && this.auras[spellclasses.Pummeler].timer) this.auras[spellclasses.Pummeler].step();
        if (this.auras[spellclasses.Swarmguard] && this.auras[spellclasses.Swarmguard].firstuse && this.auras[spellclasses.Swarmguard].timer) this.auras[spellclasses.Swarmguard].step();
        if (this.auras[spellclasses.Zandalarian] && this.auras[spellclasses.Zandalarian].firstuse && this.auras[spellclasses.Zandalarian].timer) this.auras[spellclasses.Zandalarian].step();

        if (this.mh.windfury && this.mh.windfury.timer) this.mh.windfury.step();
        if (this.trinketproc1 && this.trinketproc1.spell && this.trinketproc1.spell.timer) this.trinketproc1.spell.step();
        if (this.trinketproc2 && this.trinketproc2.spell && this.trinketproc2.spell.timer) this.trinketproc2.spell.step();
        if (this.attackproc && this.attackproc.spell && this.attackproc.spell.timer) this.attackproc.spell.step();

    }
    endauras() {

        if (this.mh.proc1 && this.mh.proc1.spell && this.mh.proc1.spell.timer) this.mh.proc1.spell.end();
        if (this.mh.proc2 && this.mh.proc2.spell && this.mh.proc2.spell.timer) this.mh.proc2.spell.end();
        if (this.oh && this.oh.proc1 && this.oh.proc1.spell && this.oh.proc1.spell.timer) this.oh.proc1.spell.end();
        if (this.oh && this.oh.proc2 && this.oh.proc2.spell && this.oh.proc2.spell.timer) this.oh.proc2.spell.end();

        if (this.auras[spellclasses.MightyRagePotion] && this.auras[spellclasses.MightyRagePotion].firstuse && this.auras[spellclasses.MightyRagePotion].timer) this.auras[spellclasses.MightyRagePotion].end();
        if (this.auras[spellclasses.Recklessness] && this.auras[spellclasses.Recklessness].firstuse && this.auras[spellclasses.Recklessness].timer) this.auras[spellclasses.Recklessness].end();
        if (this.auras[spellclasses.DeathWish] && this.auras[spellclasses.DeathWish].firstuse && this.auras[spellclasses.DeathWish].timer) this.auras[spellclasses.DeathWish].end();
        if (this.auras[spellclasses.Cloudkeeper] && this.auras[spellclasses.Cloudkeeper].firstuse && this.auras[spellclasses.Cloudkeeper].timer) this.auras[spellclasses.Cloudkeeper].end();
        if (this.auras[spellclasses.Flask] && this.auras[spellclasses.Flask].firstuse && this.auras[spellclasses.Flask].timer) this.auras[spellclasses.Flask].end();
        if (this.auras[spellclasses.BattleStance] && this.auras[spellclasses.BattleStance].timer) this.auras[spellclasses.BattleStance].end();
        if (this.auras[spellclasses.BloodFury] && this.auras[spellclasses.BloodFury].firstuse && this.auras[spellclasses.BloodFury].timer) this.auras[spellclasses.BloodFury].end();
        if (this.auras[spellclasses.Berserking] && this.auras[spellclasses.Berserking].firstuse && this.auras[spellclasses.Berserking].timer) this.auras[spellclasses.Berserking].end();
        if (this.auras[spellclasses.Slayer] && this.auras[spellclasses.Slayer].firstuse && this.auras[spellclasses.Slayer].timer) this.auras[spellclasses.Slayer].end();
        if (this.auras[spellclasses.Spider] && this.auras[spellclasses.Spider].firstuse && this.auras[spellclasses.Spider].timer) this.auras[spellclasses.Spider].end();
        if (this.auras[spellclasses.Gabbar] && this.auras[spellclasses.Gabbar].firstuse && this.auras[spellclasses.Gabbar].timer) this.auras[spellclasses.Gabbar].end();
        if (this.auras[spellclasses.Earthstrike] && this.auras[spellclasses.Earthstrike].firstuse && this.auras[spellclasses.Earthstrike].timer) this.auras[spellclasses.Earthstrike].end();
        if (this.auras[spellclasses.Pummeler] && this.auras[spellclasses.Pummeler].firstuse && this.auras[spellclasses.Pummeler].timer) this.auras[spellclasses.Pummeler].end();
        if (this.auras[spellclasses.Swarmguard] && this.auras[spellclasses.Swarmguard].firstuse && this.auras[spellclasses.Swarmguard].timer) this.auras[spellclasses.Swarmguard].end();
        if (this.auras[spellclasses.Zandalarian] && this.auras[spellclasses.Zandalarian].firstuse && this.auras[spellclasses.Zandalarian].timer) this.auras[spellclasses.Zandalarian].end();

        if (this.mh.windfury && this.mh.windfury.timer) this.mh.windfury.end();
        if (this.trinketproc1 && this.trinketproc1.spell && this.trinketproc1.spell.timer) this.trinketproc1.spell.end();
        if (this.trinketproc2 && this.trinketproc2.spell && this.trinketproc2.spell.timer) this.trinketproc2.spell.end();
        if (this.attackproc && this.attackproc.spell && this.attackproc.spell.timer) this.attackproc.spell.end();

        if (this.auras[spellclasses.Flurry] && this.auras[spellclasses.Flurry].timer) this.auras[spellclasses.Flurry].end();

    }
    rollweapon(weapon) {
        let tmp = 0;
        let roll = rng10k();
        tmp += Math.max(this.nextswinghs ? weapon.miss : weapon.dwmiss, 0) * 100;
        if (roll < tmp) return RESULT.MISS;
        tmp += weapon.dodge * 100;
        if (roll < tmp) return RESULT.DODGE;
        tmp += weapon.glanceChance * 100;
        if (roll < tmp) return RESULT.GLANCE;
        tmp += (this.crit + weapon.crit) * 100;
        if (roll < tmp) return RESULT.CRIT;
        return RESULT.HIT;
    }
    rollspell(spell) {
        let tmp = 0;
        let roll = rng10k();
        tmp += Math.max(this.mh.miss, 0) * 100;
        if (roll < tmp) return RESULT.MISS;
        if (spell.canDodge) {
            tmp += this.mh.dodge * 100;
            if (roll < tmp) return RESULT.DODGE;
        }
        if (!spell.weaponspell) {
            roll = rng10k();
            tmp = 0;
        }
        let crit = this.crit + this.mh.crit;
        if (spell instanceof spellclasses.Overpower)
            crit += this.talents.overpowercrit;
        tmp += crit * 100;
        if (roll < tmp && !spell.nocrit) return RESULT.CRIT;
        return RESULT.HIT;
    }
    attackmh(weapon) {
        this.stepauras();

        let spell = null;
        let procdmg = 0;
        let result;

        if (this.nextswinghs) {
            this.nextswinghs = false;
            if (this.spells[spellclasses.HeroicStrike] && this.spells[spellclasses.HeroicStrike].cost <= this.rage) {
                result = this.rollspell(this.spells[spellclasses.HeroicStrike]);
                spell = this.spells[spellclasses.HeroicStrike];
                this.rage -= spell.cost;
            }
            else if (this.spells[spellclasses.HeroicStrikeExecute] && this.spells[spellclasses.HeroicStrikeExecute].cost <= this.rage) {
                result = this.rollspell(this.spells[spellclasses.HeroicStrikeExecute]);
                spell = this.spells[spellclasses.HeroicStrikeExecute];
                this.rage -= spell.cost;
            }
            else {
                result = this.rollweapon(weapon);
            }
        }
        else {
            result = this.rollweapon(weapon);
        }

        let dmg = weapon.dmg(spell);
        procdmg = this.procattack(spell, weapon, result);

        if (result == RESULT.DODGE) {
            this.dodgetimer = 5000;
        }
        if (result == RESULT.GLANCE) {
            dmg *= this.getGlanceReduction(weapon);
        }
        if (result == RESULT.CRIT) {
            dmg *= 2 + (spell ? this.talents.abilitiescrit : 0);
            this.proccrit();
        }

        weapon.use();
        let done = this.dealdamage(dmg, result, weapon, spell);
        if (spell) {
            spell.totaldmg += done;
            spell.data[result]++;
        }
        else {
            weapon.totaldmg += done;
            weapon.data[result]++;
        }
        weapon.totalprocdmg += procdmg;
        //if (log) this.log(`${spell ? spell.name + ' for' : 'Main hand attack for'} ${done + procdmg} (${Object.keys(RESULT)[result]})`);
        return done + procdmg;
    }
    attackoh(weapon) {
        this.stepauras();

        let procdmg = 0;
        let result;
        result = this.rollweapon(weapon);

        let dmg = weapon.dmg();
        procdmg = this.procattack(null, weapon, result);

        if (result == RESULT.DODGE) {
            this.dodgetimer = 5000;
        }
        if (result == RESULT.GLANCE) {
            dmg *= this.getGlanceReduction(weapon);
        }
        if (result == RESULT.CRIT) {
            dmg *= 2;
            this.proccrit();
        }

        weapon.use();
        let done = this.dealdamage(dmg, result, weapon);
        weapon.data[result]++;
        weapon.totaldmg += done;
        weapon.totalprocdmg += procdmg;
        //if (log) this.log(`Off hand attack for ${done + procdmg} (${Object.keys(RESULT)[result]})${this.nextswinghs ? ' (HS queued)' : ''}`);
        return done + procdmg;
    }
    cast(spell) {
        this.stepauras();
        spell.use();
        if (spell.useonly) { 
            //if (log) this.log(`${spell.name} used`);
            return 0; 
        }
        let procdmg = 0;
        let dmg = spell.dmg() * this.mh.modifier;
        let result = this.rollspell(spell);
        procdmg = this.procattack(spell, this.mh, result);

        if (result == RESULT.DODGE) {
            this.dodgetimer = 5000;
        }
        if (result == RESULT.CRIT) {
            dmg *= 2 + this.talents.abilitiescrit;
            this.proccrit();
        }

        let done = this.dealdamage(dmg, result, this.mh, spell);
        spell.data[result]++;
        spell.totaldmg += done;
        this.mh.totalprocdmg += procdmg;
        //if (log) this.log(`${spell.name} for ${done + procdmg} (${Object.keys(RESULT)[result]}).`);
        return done + procdmg;
    }
    dealdamage(dmg, result, weapon, spell) {
        if (result != RESULT.MISS && result != RESULT.DODGE) {
            dmg *= this.stats.dmgmod;
            dmg *= (1 - this.armorReduction);
            this.addRage(dmg, result, weapon, spell);
            return ~~dmg;
        }
        else {
            this.addRage(dmg, result, weapon, spell);
            return 0;
        }
    }
    proccrit() {
        if (this.auras[spellclasses.Flurry]) this.auras[spellclasses.Flurry].use();
        if (this.auras[spellclasses.DeepWounds]) this.auras[spellclasses.DeepWounds].use();
    }
    procattack(spell, weapon, result) {
        let procdmg = 0;
        if (result != RESULT.MISS && result != RESULT.DODGE) {
            if (weapon.proc1 && rng10k() < weapon.proc1.chance) {
                //if (log) this.log(`${weapon.name} proc`);
                if (weapon.proc1.spell) weapon.proc1.spell.use();
                if (weapon.proc1.magicdmg) procdmg += this.magicproc(weapon.proc1);
                if (weapon.proc1.physdmg) procdmg += this.physproc(weapon.proc1.physdmg);
                if (weapon.proc1.extra) this.extraattacks += weapon.proc1.extra;
            }
            if (weapon.proc2 && rng10k() < weapon.proc2.chance) {
                if (weapon.proc2.spell) weapon.proc2.spell.use();
                if (weapon.proc2.magicdmg) procdmg += this.magicproc(weapon.proc2);
            }
            if (weapon.windfury && !this.auras[spellclasses.Windfury].timer && rng10k() < 2000) {
                weapon.windfury.use();
            }
            if (this.trinketproc1 && rng10k() < this.trinketproc1.chance) {
                //if (log) this.log(`Trinket 1 proc`);
                if (this.trinketproc1.extra)
                    this.batchedextras += this.trinketproc1.extra;
                if (this.trinketproc1.magicdmg) procdmg += this.magicproc(this.trinketproc1);
                if (this.trinketproc1.spell) this.trinketproc1.spell.use();
            }
            if (this.trinketproc2 && rng10k() < this.trinketproc2.chance) {
                //if (log) this.log(`Trinket 2 proc`);
                if (this.trinketproc2.extra)
                    this.batchedextras += this.trinketproc2.extra;
                if (this.trinketproc2.magicdmg) procdmg += this.magicproc(this.trinketproc2);
                if (this.trinketproc2.spell) this.trinketproc2.spell.use();
            }
            if (this.attackproc && rng10k() < this.attackproc.chance) {
                if (this.attackproc.magicdmg) procdmg += this.magicproc(this.attackproc);
                if (this.attackproc.spell) this.attackproc.spell.use();
                //if (log) this.log(`Misc proc`);
            }
            if (this.talents.swordproc && weapon.type == WEAPONTYPE.SWORD) {
                if (rng10k() < this.talents.swordproc * 100){
                    this.extraattacks++;
                    //if (log) this.log(`Sword talent proc`);
                }
            }
            if (this.auras[spellclasses.Swarmguard] && this.auras[spellclasses.Swarmguard].timer && rng10k() < this.auras[spellclasses.Swarmguard].chance) {
                this.auras[spellclasses.Swarmguard].proc();
            }
            if (this.auras[spellclasses.Zandalarian] && this.auras[spellclasses.Zandalarian].timer) {
                this.auras[spellclasses.Zandalarian].proc();
            }
            if (this.dragonbreath && rng10k() < 400) {
                procdmg += this.magicproc({ magicdmg: 60, coeff: 1 });
            }
        }
        if (!spell || spell instanceof spellclasses.HeroicStrike || spell instanceof spellclasses.HeroicStrikeExecute) {
            if (this.auras[spellclasses.Flurry] && this.auras[spellclasses.Flurry].stacks)
                this.auras[spellclasses.Flurry].proc();
            if (this.mh.windfury && this.mh.windfury.stacks)
                this.mh.windfury.proc();
        }
        return procdmg;
    }
    magicproc(proc) {
        let mod = 1;
        let miss = 1700;
        let dmg = proc.magicdmg;
        if (proc.gcd && this.timer && this.timer < 1500) return 0;
        if (proc.binaryspell) miss = this.target.binaryresist;
        else mod *= this.target.mitigation;
        if (rng10k() < miss) return 0;
        if (rng10k() < (this.stats.spellcrit * 100)) mod *= 1.5;
        if (proc.coeff) dmg += this.spelldamage * proc.coeff;
        return ~~(dmg * mod);
    }
    physproc(dmg) {
        let tmp = 0;
        let roll = rng10k();
        tmp += Math.max(this.mh.miss, 0) * 100;
        if (roll < tmp) dmg = 0;
        tmp += this.mh.dodge * 100;
        if (roll < tmp) { this.dodgetimer = 5000; dmg = 0; }
        roll = rng10k();
        let crit = this.crit + this.mh.crit;
        if (roll < (crit * 100)) dmg *= 2;
        return dmg * this.stats.dmgmod * this.mh.modifier;
    }
    serializeStats() {
        return {
            auras: this.auras,
            spells: this.spells,
            mh: this.mh,
            oh: this.oh,
        };
    }
    log(msg) {
        console.log(`${step.toString().padStart(5,' ')} | ${this.rage.toFixed(2).padStart(6,' ')} | ${msg}`);
    }
}