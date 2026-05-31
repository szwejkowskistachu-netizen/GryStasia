import { GameScene } from './game.js';

export const config = {
    type: Phaser.CANVAS,
    width: 800,
    height: 600,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 200 },
            debug: false
        }
    },
    scene: [GameScene]
};

export const items = [
    { id: 'jetpack', name: 'Plecak Odrzutowy', price: 2500 },
    { id: 'emote_sigma', name: 'Emotka: SIGMA (Spacja)', price: 2000 },
    { id: 'emote_67', name: 'Emotka: 67 (Spacja)', price: 2500 }
];

export const skins = [
    { id: 'hiper_malpa', name: 'hiper małpa', price: 15000 },
    { id: 'default', name: 'Zwykła Małpa', price: 0 },
    { id: 'desek', name: 'Małpa DESEK', price: 5000 },
    { id: 'ballerina', name: 'Małpa BALLERINA', price: 7000 },
    { id: 'nauk', name: 'Małpa NAUK', price: 9000 }
];
