class Faction {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.color = config.color;
        this.strategyName = config.strategy;
        this.units = [];
        this.kills = 0;
        this.deaths = 0;
        
        // Strategy parameters
        this.strategy = this.getStrategyPreset(config.strategy);
    }

    getStrategyPreset(name) {
        const presets = {
            aggressive: {
                attackPriority: 'weakest',
                retreatHP: 0.1,
                groupBehavior: 'scatter',
                targetFocus: 'random'
            },
            defensive: {
                attackPriority: 'nearest',
                retreatHP: 0.4,
                groupBehavior: 'stayTogether',
                targetFocus: 'tanks'
            },
            balanced: {
                attackPriority: 'nearest',
                retreatHP: 0.2,
                groupBehavior: 'stayTogether',
                targetFocus: 'random'
            },
            scout: {
                attackPriority: 'weakest',
                retreatHP: 0.5,
                groupBehavior: 'scatter',
                targetFocus: 'healers'
            }
        };
        return presets[name] || presets.balanced;
    }

    updateStats() {
        // Logic to update stats if needed
    }
}
