/**
 * Generator DNA i proceduralny wygląd stworzeń.
 */
window.GameEngine.CreatureGenerator = {
    // Generuje losowe DNA dla nowego stworzenia
    generateDNA: function() {
        return {
            bodyColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
            size: 10 + Math.random() * 20,
            speed: 50 + Math.random() * 100,
            intelligence: Math.random(),
            aggression: Math.random(),
            eyes: Math.floor(Math.random() * 4) + 1,
            horns: Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0,
            wings: Math.random() > 0.8,
            diet: Math.random() > 0.5 ? 'herbivore' : 'carnivore'
        };
    },

    // Rysuje stworzenie na podstawie DNA
    drawCreature: function(ctx, x, y, dna, emotion = 'neutral', isLeashed = false) {
        if (!dna) return;
        ctx.save();
        ctx.translate(x, y);

        // Rozmiar zależny od DNA
        const s = dna.size || 20;

        // Cień pod stworzeniem (lepszy)
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, s * 0.7, s * 0.9, s * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ciało z gradientem dla efektu 3D
        const gradient = ctx.createRadialGradient(-s*0.3, -s*0.3, s*0.1, 0, 0, s);
        gradient.addColorStop(0, 'white');
        gradient.addColorStop(0.2, dna.bodyColor);
        gradient.addColorStop(1, 'black');
        
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 1.0;
        ctx.beginPath();
        ctx.ellipse(0, 0, s, s * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Obramowanie ciała
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Rogi
        if (dna.horns > 0) {
            ctx.fillStyle = '#333';
            for (let i = 0; i < dna.horns; i++) {
                const angle = -0.5 - (i * 0.5);
                ctx.rotate(angle);
                ctx.fillRect(s * 0.5, -s * 0.8, s * 0.2, s * 0.5);
                ctx.rotate(-angle);
            }
        }

        // Skrzydła
        if (dna.wings) {
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath();
            ctx.ellipse(-s * 0.8, -s * 0.5, s * 0.5, s * 0.8, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(s * 0.8, -s * 0.5, s * 0.5, s * 0.8, -Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Oczy
        ctx.fillStyle = 'white';
        const eyeCount = dna.eyes;
        for (let i = 0; i < eyeCount; i++) {
            const offsetX = (i - (eyeCount - 1) / 2) * (s * 0.4);
            ctx.beginPath();
            ctx.arc(offsetX, -s * 0.2, s * 0.2, 0, Math.PI * 2);
            ctx.fill();
            
            // Źrenice
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(offsetX, -s * 0.2, s * 0.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'white';
        }

        // Emocje - usta
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (emotion === 'happy') {
            ctx.arc(0, s * 0.1, s * 0.3, 0.2 * Math.PI, 0.8 * Math.PI);
        } else if (emotion === 'angry') {
            ctx.arc(0, s * 0.4, s * 0.3, 1.2 * Math.PI, 1.8 * Math.PI);
        } else {
            ctx.moveTo(-s * 0.2, s * 0.3);
            ctx.lineTo(s * 0.2, s * 0.3);
        }
        ctx.stroke();

        ctx.restore();
    }
};
