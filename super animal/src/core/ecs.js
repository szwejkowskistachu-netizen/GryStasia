/**
 * Bardzo lekki system ECS (Entity Component System)
 */

export class World {
    constructor() {
        this.entities = new Set();
        this.components = new Map(); // Map<ComponentName, Map<EntityId, ComponentData>>
        this.systems = [];
        this.nextEntityId = 0;
    }

    createEntity() {
        const id = this.nextEntityId++;
        this.entities.add(id);
        return id;
    }

    destroyEntity(id) {
        this.entities.delete(id);
        for (let componentMap of this.components.values()) {
            componentMap.delete(id);
        }
    }

    addComponent(id, componentName, data = {}) {
        if (!this.components.has(componentName)) {
            this.components.set(componentName, new Map());
        }
        this.components.get(componentName).set(id, data);
    }

    getComponent(id, componentName) {
        return this.components.get(componentName)?.get(id);
    }

    hasComponent(id, componentName) {
        return this.components.get(componentName)?.has(id) || false;
    }

    removeComponent(id, componentName) {
        this.components.get(componentName)?.delete(id);
    }

    addSystem(systemFn) {
        this.systems.push(systemFn);
    }

    update(dt) {
        for (let system of this.systems) {
            system(this, dt);
        }
    }

    // Pomocnicza metoda do pobierania encji z określonymi komponentami
    query(...componentNames) {
        const results = [];
        for (let id of this.entities) {
            let hasAll = true;
            for (let name of componentNames) {
                if (!this.hasComponent(id, name)) {
                    hasAll = false;
                    break;
                }
            }
            if (hasAll) results.push(id);
        }
        return results;
    }
}
