import { Player } from '../js/classes/player.js';
import { Simulation } from '../js/classes/simulation.js';
import { gear, enchant } from '../js/data/gear.js';
import { buffs } from '../js/data/buffs.js';
import { talents } from '../js/data/talents.js';
import { spells } from '../js/data/spells.js';
import seedrandom from 'seedrandom';

test('system test', () => {
    seedrandom('testing', { global: true });

    gear.mainhand.filter(g => g.name == "Spineshatter")[0].selected = true;
    gear.offhand.filter(g => g.name == "Brutality Blade")[0].selected = true;
    gear.head.filter(g => g.name == "Lionheart Helm")[0].selected = true;
    gear.neck.filter(g => g.name == "Onyxia Tooth Pendant")[0].selected = true;
    gear.shoulder.filter(g => g.name == "Conqueror's Spaulders")[0].selected = true;
    gear.back.filter(g => g.name == "Drape of Unyielding Strength")[0].selected = true;
    gear.chest.filter(g => g.name == "R8 Plate Armor")[0].selected = true;
    gear.wrist.filter(g => g.name == "Hive Defiler Wristguards")[0].selected = true;
    gear.hands.filter(g => g.name == "Gauntlets of Annihilation")[0].selected = true;
    gear.waist.filter(g => g.name == "Zandalar Vindicator's Belt")[0].selected = true;
    gear.legs.filter(g => g.name == "R8 Plate Leggings")[0].selected = true;
    gear.feet.filter(g => g.name == "Boots of the Fallen Hero")[0].selected = true;
    gear.finger1.filter(g => g.name == "Don Julio's Band")[0].selected = true;
    gear.finger2.filter(g => g.name == "Master Dragonslayer's Ring")[0].selected = true;
    gear.trinket1.filter(g => g.name == "Diamond Flask (Used last 60 secs)")[0].selected = true;
    gear.trinket2.filter(g => g.name == "Blackhand's Breadth")[0].selected = true;
    gear.ranged.filter(g => g.name == "Blastershot Launcher")[0].selected = true;

    enchant.mainhand.filter(e => e.name == "Crusader")[0].selected = true;
    enchant.mainhand.filter(e => e.name == "Elemental Sharpening Stone")[0].selected = true;
    enchant.offhand.filter(e => e.name == "Crusader")[0].selected = true;
    enchant.offhand.filter(e => e.name == "Elemental Sharpening Stone")[0].selected = true;
    enchant.head.filter(e => e.name == "Lesser Arcanum of Voracity (Str)")[0].selected = true;
    enchant.shoulder.filter(e => e.name == "Zandalar Signet of Might")[0].selected = true;
    enchant.back.filter(e => e.name == "Subtlety")[0].selected = true;
    enchant.chest.filter(e => e.name == "Greater Stats")[0].selected = true;
    enchant.wrist.filter(e => e.name == "Superior Strength")[0].selected = true;
    enchant.hands.filter(e => e.name == "Superior Agility")[0].selected = true;
    enchant.legs.filter(e => e.name == "Lesser Arcanum of Voracity (Str)")[0].selected = true;
    enchant.feet.filter(e => e.name == "Minor Speed")[0].selected = true;

    talents.filter(t => t.n == "Arms")[0].t.filter(t => t.n == "Improved Heroic Strike")[0].c = 3;
    talents.filter(t => t.n == "Arms")[0].t.filter(t => t.n == "Improved Rend")[0].c = 3;
    talents.filter(t => t.n == "Arms")[0].t.filter(t => t.n == "Tactical Mastery")[0].c = 5;
    talents.filter(t => t.n == "Arms")[0].t.filter(t => t.n == "Anger Management")[0].c = 1;
    talents.filter(t => t.n == "Arms")[0].t.filter(t => t.n == "Deep Wounds")[0].c = 3;
    talents.filter(t => t.n == "Arms")[0].t.filter(t => t.n == "Impale")[0].c = 2;

    talents.filter(t => t.n == "Fury")[0].t.filter(t => t.n == "Cruelty")[0].c = 5;
    talents.filter(t => t.n == "Fury")[0].t.filter(t => t.n == "Unbridled Wrath")[0].c = 5;
    talents.filter(t => t.n == "Fury")[0].t.filter(t => t.n == "Improved Battle Shout")[0].c = 5;
    talents.filter(t => t.n == "Fury")[0].t.filter(t => t.n == "Dual Wield Specialization")[0].c = 5;
    talents.filter(t => t.n == "Fury")[0].t.filter(t => t.n == "Improved Execute")[0].c = 2;
    talents.filter(t => t.n == "Fury")[0].t.filter(t => t.n == "Enrage")[0].c = 5;
    talents.filter(t => t.n == "Fury")[0].t.filter(t => t.n == "Death Wish")[0].c = 1;
    talents.filter(t => t.n == "Fury")[0].t.filter(t => t.n == "Flurry")[0].c = 5;
    talents.filter(t => t.n == "Fury")[0].t.filter(t => t.n == "Bloodthirst")[0].c = 1;

    buffs.filter(b => b.name == "Berserker Stance")[0].active = true;
    buffs.filter(b => b.name == "Battle Shout")[0].active = true;
    buffs.filter(b => b.name == "Mark of the Wild")[0].active = true;
    buffs.filter(b => b.name == "Trueshot Aura")[0].active = true;
    buffs.filter(b => b.name == "Blessing of Kings")[0].active = true;
    buffs.filter(b => b.name == "Blessing of Might")[0].active = true;
    buffs.filter(b => b.name == "R.O.I.D.S.")[0].active = true;
    buffs.filter(b => b.name == "Elixir of the Mongoose")[0].active = true;
    buffs.filter(b => b.name == "Juju Power")[0].active = true;
    buffs.filter(b => b.name == "Juju Might")[0].active = true;
    buffs.filter(b => b.name == "Smoked Desert Dumplings")[0].active = true;

    spells.filter(s => s.name == "Bloodthirst")[0].active = true;
    spells.filter(s => s.name == "Whirlwind")[0].active = true;
    spells.filter(s => s.name == "Bloodrage")[0].active = true;
    spells.filter(s => s.name == "Sunder Armor")[0].active = true;
    spells.filter(s => s.name == "Heroic Strike")[0].active = true;
    spells.filter(s => s.name == "Execute")[0].active = true;
    spells.filter(s => s.name == "Death Wish")[0].active = true;
    spells.filter(s => s.name == "Mighty Rage Potion")[0].active = true;

    var p = new Player();

    expect(p.stats.ap).toBe(1928);
    expect(p.stats.str).toBe(491);
    expect(p.stats.agi).toBe(239);
    expect(p.stats.hit).toBe(9);
    expect(p.stats["skill_0"]).toBe(305);
    expect(p.stats["skill_1"]).toBe(305);
    expect(p.mh.miss).toBe(-3);
    expect(p.mh.dwmiss).toBe(15.8);
    expect((p.crit + p.mh.crit).toFixed(2)).toBe("34.15");
    expect((p.crit + p.oh.crit).toFixed(2)).toBe("34.15");
    expect((100 - p.mh.dwmiss - p.mh.dodge - p.mh.glanceChance).toFixed(2)).toBe("38.20");
    expect((100 - p.oh.dwmiss - p.oh.dodge - p.oh.glanceChance).toFixed(2)).toBe("38.20");
    expect((p.stats.dmgmod * p.mh.modifier * 100).toFixed(2)).toBe("100.00");
    expect((p.stats.dmgmod * p.oh.modifier * 100).toFixed(2)).toBe("62.50");
    expect((p.stats.haste * 100).toFixed(2)).toBe("100.00");

    var s = new Simulation(p);
    s.startSync();

    expect(s.totaldmg).toBe(5252758);
    expect(Math.round(s.totaldmg / s.totalduration)).toBe(977);
})