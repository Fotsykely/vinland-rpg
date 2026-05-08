import Phaser from 'phaser'

const BANNER_PATH = 'Tiny Swords (Free Pack)/UI Elements/UI Elements/Banners/Banner.png'

export default class TutorialScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TutorialScene' })
    }

    preload() {
        if (!this.textures.exists('tutorial-banner')) {
            this.load.image('tutorial-banner', BANNER_PATH)
        }
    }

    create() {
        const { width, height } = this.scale

        // Semi-transparent overlay so GameScene is visible behind
        const overlay = this.add.graphics()
        overlay.fillStyle(0x000000, 0.68)
        overlay.fillRect(0, 0, width, height)

        // Banner — decorative, top-center
        const banner = this.add.image(width / 2, height / 2 - 80, 'tutorial-banner')
        banner.setScale(0.52)

        // Title text on the banner
        this.add.text(width / 2, height / 2 - 100, 'CONTROLS', {
            fontSize: '22px',
            fontFamily: 'serif',
            color: '#f5e0b0',
            stroke: '#2a1a08',
            strokeThickness: 5,
        }).setOrigin(0.5)

        // Control rows
        const entries = [
            ['↑  ↓  ←  →', 'Move'],
            ['SPACE',       'Attack'],
        ]
        entries.forEach(([key, action], i) => {
            const y = height / 2 + 60 + i * 44
            this.add.text(width / 2 - 16, y, key, {
                fontSize: '20px',
                fontFamily: 'monospace',
                color: '#ffd86e',
                stroke: '#000000',
                strokeThickness: 3,
            }).setOrigin(1, 0.5)

            this.add.text(width / 2 + 16, y, action, {
                fontSize: '20px',
                fontFamily: 'serif',
                color: '#f0dfc0',
                stroke: '#000000',
                strokeThickness: 3,
            }).setOrigin(0, 0.5)
        })

        // Blinking prompt
        const prompt = this.add.text(width / 2, height - 48, 'Press any key to start', {
            fontSize: '15px',
            fontFamily: 'serif',
            color: '#999999',
        }).setOrigin(0.5)

        this.tweens.add({
            targets:  prompt,
            alpha:    0.1,
            duration: 650,
            yoyo:     true,
            repeat:   -1,
            ease:     'Sine.easeInOut',
        })

        this.input.keyboard.once('keydown', () => {
            const game = this.scene.get('GameScene')
            if (game) game._tutorialActive = false
            this.scene.stop()
        })
    }
}
