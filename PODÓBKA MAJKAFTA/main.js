import * as THREE from 'three';
import { World } from './world.js';
import { Player } from './player.js';
import { Inventory } from './inventory.js';

class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.Fog(0x87CEEB, 20, 100);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);

        // Oświetlenie
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = true;
        this.scene.add(sunLight);

        // Inicjalizacja modułów
        this.world = new World(this.scene);
        this.inventory = new Inventory();
        this.player = new Player(this.camera, this.renderer.domElement, this.world, this.inventory);

        this.clock = new THREE.Clock();

        this.initEventListeners();
        this.animate();
    }

    initEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        const saveBtn = document.getElementById('save-btn');
        const loadBtn = document.getElementById('load-btn');

        saveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.world.save();
        });

        loadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.world.load();
        });

        document.getElementById('instructions').addEventListener('click', () => {
            this.player.controls.lock();
        });

        this.player.controls.addEventListener('lock', () => {
            document.getElementById('instructions').style.display = 'none';
        });

        this.player.controls.addEventListener('unlock', () => {
            document.getElementById('instructions').style.display = 'block';
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        
        if (this.player.controls.isLocked) {
            this.player.update(delta);
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Uruchomienie gry
new Game();
