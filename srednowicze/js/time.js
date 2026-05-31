export class TimeSystem {
    constructor(game) {
        this.game = game;
        this.day = 1;
        this.season = 0; // 0: Spring, 1: Summer, 2: Autumn, 3: Winter
        this.timeOfDay = 0; // 0 to 1
        this.dayDuration = 60000; // 60 seconds per day
    }
    
    update(deltaTime) {
        let speedMultiplier = 1;
        if (this.season === 3) speedMultiplier = 0.5; // Winter slows down time? Or maybe just affects production.
        
        this.timeOfDay += (deltaTime / this.dayDuration) * speedMultiplier;
        
        if (this.timeOfDay >= 1) {
            this.timeOfDay = 0;
            this.day++;
            
            if (this.day % 30 === 0) {
                this.season = (this.season + 1) % 4;
            }
        }
    }
    
    getIsNight() {
        const hour = this.timeOfDay * 24;
        return hour > 20 || hour < 6;
    }
}
