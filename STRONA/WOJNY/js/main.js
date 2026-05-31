document.addEventListener('DOMContentLoaded', () => {
    const engine = new Engine('gameCanvas');

    document.getElementById('startBtn').addEventListener('click', () => {
        engine.start();
        document.getElementById('startBtn').classList.add('active');
        document.getElementById('pauseBtn').classList.remove('active');
    });

    document.getElementById('pauseBtn').addEventListener('click', () => {
        engine.pause();
        document.getElementById('pauseBtn').classList.add('active');
        document.getElementById('startBtn').classList.remove('active');
    });

    document.querySelectorAll('.speedBtn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const speed = parseInt(e.target.dataset.speed);
            engine.setSpeed(speed);
            
            document.querySelectorAll('.speedBtn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
        });
    });

    // Default speed
    document.querySelector('.speedBtn[data-speed="1"]').classList.add('active');
});
