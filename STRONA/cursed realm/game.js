// Game State
const state = {
    turn: 1,
    nextAttack: 4,
    resources: {
        gold: 50,
        souls: 20,
        bones: 30,
        blood: 15
    },
    fortress: {
        hp: 100,
        maxHp: 100,
        def: 5
    },
    buildings: {
        'gold-mine': { level: 1, name: 'Kopalnia Złota' },
        'crypt': { level: 1, name: 'Mroczna Krypta' },
        'altar': { level: 1, name: 'Ołtarz Krwi' },
        'tower': { level: 1, name: 'Wieża Śmierci' },
        'forge': { level: 1, name: 'Kuźnia Klątw' },
        'gate': { level: 0, name: 'Brama Piekieł' }
    },
    army: {
        skeleton: 0,
        zombie: 0,
        lich: 0,
        wraith: 0
    },
    wave: 1
};

// Configs
const units = {
    skeleton: { name: 'Szkielet', cost: { bones: 15, souls: 10 }, power: 5, upkeep: 1 },
    zombie: { name: 'Zombie', cost: { souls: 20, gold: 15 }, power: 10, upkeep: 2 },
    lich: { name: 'Lich', cost: { souls: 40, gold: 30, blood: 10 }, power: 25, upkeep: 5 },
    wraith: { name: 'Upiór', cost: { souls: 30, gold: 25, bones: 20 }, power: 40, upkeep: 8 }
};

const upgradeCosts = {
    'gold-mine': (lvl) => ({ gold: 40 * lvl, bones: 20 * lvl }),
    'crypt': (lvl) => ({ souls: 35 * lvl, gold: 25 * lvl }),
    'altar': (lvl) => ({ blood: 20 * lvl, souls: 20 * lvl }),
    'tower': (lvl) => ({ gold: 50 * lvl, bones: 30 * lvl }),
    'forge': (lvl) => ({ gold: 60 * lvl, blood: 15 * lvl }),
    'gate': (lvl) => ({ souls: 100, blood: 50, gold: 100 })
};

// UI Elements
const els = {
    gold: document.getElementById('gold'),
    souls: document.getElementById('souls'),
    bones: document.getElementById('bones'),
    blood: document.getElementById('blood'),
    goldGain: document.getElementById('gold-gain'),
    soulsGain: document.getElementById('souls-gain'),
    bonesGain: document.getElementById('bones-gain'),
    bloodGain: document.getElementById('blood-gain'),
    turn: document.getElementById('turn-count'),
    attackInfo: document.getElementById('attack-info'),
    hp: document.getElementById('hp'),
    def: document.getElementById('def'),
    hpBar: document.getElementById('hp-bar'),
    armyList: document.getElementById('army-list'),
    armyPower: document.getElementById('army-power'),
    eventModal: document.getElementById('event-modal'),
    eventTitle: document.getElementById('event-title'),
    eventDesc: document.getElementById('event-desc'),
    eventClose: document.getElementById('event-close'),
    gameOverModal: document.getElementById('game-over-modal'),
    endTurnBtn: document.getElementById('end-turn-btn')
};

// Initialize
function init() {
    updateUI();
    setupEventListeners();
}

function setupEventListeners() {
    els.endTurnBtn.addEventListener('click', nextTurn);
    
    document.querySelectorAll('.recruit-btn').forEach(btn => {
        btn.addEventListener('click', () => recruitUnit(btn.dataset.unit));
    });

    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        btn.addEventListener('click', () => upgradeBuilding(btn.dataset.building));
    });

    els.eventClose.addEventListener('click', () => {
        els.eventModal.classList.add('hidden');
    });
}

function updateUI() {
    // Resources
    els.gold.innerText = Math.floor(state.resources.gold);
    els.souls.innerText = Math.floor(state.resources.souls);
    els.bones.innerText = Math.floor(state.resources.bones);
    els.blood.innerText = Math.floor(state.resources.blood);

    // Gains
    const gains = calculateGains();
    els.goldGain.innerText = `+${gains.gold}/tura`;
    els.soulsGain.innerText = `+${gains.souls - calculateUpkeep()}/tura`;
    els.bonesGain.innerText = `+${gains.bones}/tura`;
    els.bloodGain.innerText = `+${gains.blood}/tura`;

    // Info
    els.turn.innerText = state.turn;
    els.attackInfo.innerText = `Następny atak za ${state.nextAttack} tur`;
    els.hp.innerText = state.fortress.hp;
    els.def.innerText = state.fortress.def;
    els.hpBar.style.width = `${(state.fortress.hp / state.fortress.maxHp) * 100}%`;

    // Army
    renderArmy();
    
    let power = 0;
    for (const [unit, count] of Object.entries(state.army)) {
        power += count * units[unit].power;
    }
    const forgeBonus = state.buildings['forge'].level * 0.1;
    els.armyPower.innerText = Math.floor(power * (1 + forgeBonus));

    // Building Levels
    for (const [id, data] of Object.entries(state.buildings)) {
        const card = document.getElementById(`b-${id}`);
        if (card) {
            card.querySelector('.lvl').innerText = data.level;
            if (data.level > 0) card.classList.remove('disabled');
        }
    }

    // Button states
    updateButtonStates();
}

function calculateGains() {
    return {
        gold: state.buildings['gold-mine'].level * 10,
        bones: state.buildings['gold-mine'].level * 5,
        souls: state.buildings['crypt'].level * 8,
        blood: state.buildings['altar'].level * 4
    };
}

function calculateUpkeep() {
    let upkeep = 0;
    for (const [unit, count] of Object.entries(state.army)) {
        upkeep += count * units[unit].upkeep;
    }
    return upkeep;
}

function renderArmy() {
    let html = '';
    let hasUnits = false;
    for (const [unit, count] of Object.entries(state.army)) {
        if (count > 0) {
            hasUnits = true;
            html += `<div class="army-item">
                <span>${units[unit].name}</span>
                <span>x${count}</span>
            </div>`;
        }
    }
    els.armyList.innerHTML = hasUnits ? html : 'Brak jednostek — zrekrutuj armię';
}

function updateButtonStates() {
    document.querySelectorAll('.recruit-btn').forEach(btn => {
        const unitType = btn.dataset.unit;
        const unit = units[unitType];
        const canAfford = Object.entries(unit.cost).every(([res, amount]) => state.resources[res] >= amount);
        const unlocked = unitType !== 'wraith' || state.buildings['gate'].level > 0;
        btn.disabled = !canAfford || !unlocked;
        
        // Visual feedback for locked units
        if (!unlocked) {
            btn.style.opacity = "0.3";
            btn.title = "Wymaga Bramy Piekieł";
        } else {
            btn.style.opacity = "1";
            btn.title = "";
        }
    });

    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        const bId = btn.dataset.building;
        const currentLevel = state.buildings[bId].level;
        const cost = upgradeCosts[bId](currentLevel);
        const canAfford = Object.entries(cost).every(([res, amount]) => state.resources[res] >= amount);
        btn.disabled = !canAfford;

        // Update cost text
        const costSpan = btn.querySelector('.cost');
        if (costSpan) {
            let costText = '';
            if (cost.gold) costText += `${cost.gold}🟡 `;
            if (cost.souls) costText += `${cost.souls}💀 `;
            if (cost.bones) costText += `${cost.bones}🦴 `;
            if (cost.blood) costText += `${cost.blood}🩸 `;
            costSpan.innerText = costText;
        }

        // Hide gate upgrade if already built
        if (bId === 'gate' && currentLevel > 0) {
            btn.style.display = 'none';
        }
    });
}

function recruitUnit(type) {
    const unit = units[type];
    for (const [res, amount] of Object.entries(unit.cost)) {
        state.resources[res] -= amount;
    }
    state.army[type]++;
    updateUI();
}

function upgradeBuilding(id) {
    const cost = upgradeCosts[id](state.buildings[id].level);
    for (const [res, amount] of Object.entries(cost)) {
        state.resources[res] -= amount;
    }
    state.buildings[id].level++;
    
    // Tower upgrade increases DEF
    if (id === 'tower') state.fortress.def += 5;
    
    updateUI();
}

function nextTurn() {
    // Generate Resources
    const gains = calculateGains();
    const upkeep = calculateUpkeep();
    
    state.resources.gold += gains.gold;
    state.resources.bones += gains.bones;
    state.resources.blood += gains.blood;
    state.resources.souls += gains.souls - upkeep;

    // Souls can go negative but check for consequences if you want
    if (state.resources.souls < 0) {
        state.resources.souls = 0;
        // Maybe lose some army?
        desertion();
    }

    state.turn++;
    state.nextAttack--;

    if (state.nextAttack <= 0) {
        handleAttack();
        state.nextAttack = 4;
        state.wave++;
    } else {
        checkRandomEvent();
    }

    updateUI();
}

function desertion() {
    for (const unit in state.army) {
        if (state.army[unit] > 0) {
            state.army[unit] = Math.max(0, state.army[unit] - 1);
            showEvent("Dezercja!", "Z powodu braku dusz, część twoich wojsk opuściła królestwo.");
            break;
        }
    }
}

function handleAttack() {
    const enemyPower = state.wave * 50 + (state.wave * state.wave * 5);
    let playerPower = 0;
    for (const [unit, count] of Object.entries(state.army)) {
        playerPower += count * units[unit].power;
    }

    // Add forge bonus
    playerPower *= (1 + state.buildings['forge'].level * 0.1);

    const defenseBonus = state.fortress.def;
    const totalDefense = playerPower + defenseBonus;

    if (totalDefense >= enemyPower) {
        // Victory - maybe lose some units?
        const lossRatio = Math.min(0.5, enemyPower / (totalDefense * 2));
        for (const unit in state.army) {
            state.army[unit] = Math.floor(state.army[unit] * (1 - lossRatio));
        }
        showEvent("Zwycięstwo!", `Odparto atak fali ${state.wave}. Twoje siły (Moc: ${Math.floor(playerPower)}) pokonały wroga (Moc: ${enemyPower}).`);
    } else {
        // Defeat
        const damage = enemyPower - totalDefense;
        state.fortress.hp -= damage;
        showEvent("Porażka!", `Twierdza została uszkodzona! Stracono ${damage} HP. Fala wroga była zbyt silna.`);
        
        if (state.fortress.hp <= 0) {
            state.fortress.hp = 0;
            els.gameOverModal.classList.remove('hidden');
        }
    }
}

function checkRandomEvent() {
    if (Math.random() < 0.2) {
        const events = [
            { title: "Znalezisko", desc: "Twoi słudzy znaleźli stare cmentarzysko. +50 kości.", action: () => state.resources.bones += 50 },
            { title: "Zaraza", desc: "Tajemnicza plaga dotknęła twoje włości. -20 złota.", action: () => state.resources.gold = Math.max(0, state.resources.gold - 20) },
            { title: "Mroczny Pakt", desc: "Demon oferuje krew za dusze. -10 dusz, +20 krwi.", action: () => { 
                if (state.resources.souls >= 10) { state.resources.souls -= 10; state.resources.blood += 20; }
            }},
            { title: "Błogosławieństwo Śmierci", desc: "Twoja nekromancja staje się silniejsza. +15 dusz.", action: () => state.resources.souls += 15 }
        ];
        const ev = events[Math.floor(Math.random() * events.length)];
        ev.action();
        showEvent(ev.title, ev.desc);
    }
}

function showEvent(title, desc) {
    els.eventTitle.innerText = title;
    els.eventDesc.innerText = desc;
    els.eventModal.classList.remove('hidden');
}

init();
