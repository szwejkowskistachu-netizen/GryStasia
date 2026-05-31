const CONFIG = {
    MAP_WIDTH: 800,
    MAP_HEIGHT: 800,
    GRID_SIZE: 10,
    INITIAL_UNITS_PER_FACTION: 20,
    TICK_RATE: 1000 / 60,
    FACTIONS: [
        { id: 1, name: 'Alpha', color: '#ff4444', strategy: 'aggressive' },
        { id: 2, name: 'Beta', color: '#44ff44', strategy: 'defensive' },
        { id: 3, name: 'Gamma', color: '#4444ff', strategy: 'balanced' },
        { id: 4, name: 'Delta', color: '#ffff44', strategy: 'scout' }
    ],
    UNIT_TYPES: {
        SOLDIER: {
            hp: 100,
            atk: 10,
            def: 5,
            spd: 2,
            rng: 30,
            sight: 150,
            cooldown: 30
        }
    }
};
