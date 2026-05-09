import Phaser from 'phaser'

const SP_PATH = 'Tiny Swords (Free Pack)/UI Elements/UI Elements/Papers/SpecialPaper.png'

// Exact content bounds in the 320×320 SpecialPaper spritesheet
const SP_FRAMES = {
    tl: [11,  21, 53, 43],
    tc: [128, 21, 64, 43],
    tr: [256, 21, 53, 43],
    ml: [10,  128, 54, 64],
    mc: [128, 128, 64, 64],
    mr: [256, 128, 54, 64],
    bl: [9,   256, 55, 43],
    bc: [128, 256, 64, 43],
    br: [256, 256, 55, 43],
}

export default class TutorialScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TutorialScene' })
    }

    preload() {
        if (!this.textures.exists('sp')) {
            this.load.image('sp', SP_PATH)
        }
    }

    create() {
        const { width, height } = this.scale

        const overlay = this.add.graphics()
        overlay.fillStyle(0x000000, 0.68)
        overlay.fillRect(0, 0, width, height)

        const cx = width / 2
        const cy = height / 2

        this._buildPanel(cx, cy, 400, 300)

        this.add.text(cx, cy - 100, 'CONTROLS', {
            fontSize: '22px',
            fontFamily: 'serif',
            color: '#f5d680',
            stroke: '#1a1a1a',
            strokeThickness: 4,
        }).setOrigin(0.5)

        const entries = [
            ['↑  ↓  ←  →', 'Move'],
            ['SPACE',       'Attack'],
        ]
        entries.forEach(([key, action], i) => {
            const y = cy + i * 50
            this.add.text(cx - 16, y, key, {
                fontSize: '20px',
                fontFamily: 'monospace',
                color: '#ffd86e',
                stroke: '#000000',
                strokeThickness: 3,
            }).setOrigin(1, 0.5)

            this.add.text(cx + 16, y, action, {
                fontSize: '20px',
                fontFamily: 'serif',
                color: '#e8dfc0',
                stroke: '#000000',
                strokeThickness: 3,
            }).setOrigin(0, 0.5)
        })

        const prompt = this.add.text(width / 2, height - 48, 'Press any key to start', {
            fontSize: '15px',
            fontFamily: 'serif',
            color: '#888888',
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
            this.game.events.emit('tutorial-done')
            this.scene.stop()
        })
    }

    _buildPanel(cx, cy, panelW, panelH) {
        const tex = this.textures.get('sp')
        if (!tex.has('sp-tl')) {
            Object.entries(SP_FRAMES).forEach(([k, [x, y, w, h]]) =>
                tex.add('sp-' + k, 0, x, y, w, h)
            )
        }

        // Corner sizes (symmetric: LW=RW=55, TH=BH=43)
        const LW = 55, RW = 55, TH = 43, BH = 43
        const innerW = panelW - LW - RW   // 290
        const innerH = panelH - TH - BH   // 214

        // Positions (symmetric → all centers land exactly on 0)
        const topY = -panelH / 2 + TH / 2
        const botY =  panelH / 2 - BH / 2
        const lX   = -panelW / 2 + LW / 2
        const rX   =  panelW / 2 - RW / 2

        const g = this.add.container(cx, cy)

        // Background: tile the center piece across the full panel
        g.add(this.add.tileSprite(0, 0, panelW, panelH, 'sp', 'sp-mc'))

        // Edges stretched on one axis
        const addEdge = (x, y, fw, fh, frame) => {
            const e = this.add.image(x, y, 'sp', frame)
            e.setDisplaySize(fw, fh)
            g.add(e)
        }
        addEdge(0,  topY, innerW, TH, 'sp-tc')
        addEdge(0,  botY, innerW, BH, 'sp-bc')
        addEdge(lX, 0,    LW, innerH, 'sp-ml')
        addEdge(rX, 0,    RW, innerH, 'sp-mr')

        // Corners (natural size, on top)
        g.add(this.add.image(lX, topY, 'sp', 'sp-tl'))
        g.add(this.add.image(rX, topY, 'sp', 'sp-tr'))
        g.add(this.add.image(lX, botY, 'sp', 'sp-bl'))
        g.add(this.add.image(rX, botY, 'sp', 'sp-br'))
    }
}
