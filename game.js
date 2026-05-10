import Phaser from 'phaser'
import MainMenuScene from './scenes/MainMenuScene.js'
import GameScene     from './scenes/GameScene.js'
import TutorialScene from './scenes/TutorialScene.js'
import UIScene       from './scenes/UIScene.js'
import PauseScene    from './scenes/PauseScene.js'

new Phaser.Game({
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#1a1a2e',
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: [MainMenuScene, GameScene, TutorialScene, UIScene, PauseScene]
})
