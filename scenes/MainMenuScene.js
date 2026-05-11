import Phaser from 'phaser'

const SP_PATH = 'Tiny Swords (Free Pack)/UI Elements/UI Elements/Papers/SpecialPaper.png'
const SP_FRAMES = {
    tl: [11,  21, 53, 43], tc: [128, 21, 64, 43],  tr: [256, 21, 53, 43],
    ml: [10, 128, 54, 64], mc: [128,128, 64, 64],   mr: [256,128, 54, 64],
    bl: [9,  256, 55, 43], bc: [128,256, 64, 43],   br: [256,256, 55, 43],
}

export default class MainMenuScene extends Phaser.Scene {
    constructor() { super({ key: 'MainMenuScene' }) }

    preload() {
        if (!this.textures.exists('sp'))           this.load.image('sp',            SP_PATH)
        if (!this.textures.exists('icon-play'))    this.load.image('icon-play',    'Tiny Swords (Free Pack)/UI Elements/UI Elements/Icons/Icon_07.png')
        if (!this.textures.exists('icon-quit'))    this.load.image('icon-quit',    'Tiny Swords (Free Pack)/UI Elements/UI Elements/Icons/Icon_09.png')
        if (!this.textures.exists('icon-options')) this.load.image('icon-options', 'Tiny Swords (Free Pack)/UI Elements/UI Elements/Icons/Icon_10.png')
    }

    create() {
        const { width: W, height: H } = this.scale
        const cx = W / 2, cy = H / 2

        this.add.rectangle(0, 0, W, H, 0x0d1117).setOrigin(0)

        this.add.text(cx, cy - 170, 'THE MAKI KNIGHT', {
            fontSize: '48px', fontFamily: 'serif',
            color: '#f5d680', stroke: '#1a1a1a', strokeThickness: 7,
        }).setOrigin(0.5)

        this.add.text(cx, cy - 115, 'by Ando Razafy', {
            fontSize: '15px', fontFamily: 'serif', color: '#666666',
        }).setOrigin(0.5)

        this._buildPanel(cx, cy + 10, 380, 190)

        this._addBtn(cx - 110, cy + 10, 'icon-play',    'JOUER',     () => this.scene.start('GameScene'))
        this._addBtn(cx,       cy + 10, 'icon-options', 'CONTRÔLES', () => this._toggleControls())
        this._addBtn(cx + 110, cy + 10, 'icon-quit',    'QUITTER',   () => window.close())

        this._controlsPanel = this._buildControlsOverlay(cx, cy)
        this._controlsPanel.setVisible(false)
    }

    _addBtn(x, y, key, label, cb) {
        const icon = this.add.image(x, y - 12, key).setScale(0.75).setInteractive({ useHandCursor: true })
        const txt  = this.add.text(x, y + 30, label, {
            fontSize: '12px', fontFamily: 'serif', color: '#e8dfc0',
        }).setOrigin(0.5)
        icon.on('pointerover',  () => { icon.setScale(0.88); txt.setColor('#f5d680') })
        icon.on('pointerout',   () => { icon.setScale(0.75); txt.setColor('#e8dfc0') })
        icon.on('pointerdown',  cb)
    }

    _toggleControls() {
        this._controlsPanel.setVisible(!this._controlsPanel.visible)
    }

    _buildControlsOverlay(cx, cy) {
        const g = this.add.container(cx, cy + 10)
        this._buildPanel(0, 0, 340, 285, g)

        const title = this.add.text(0, -108, 'CONTRÔLES', {
            fontSize: '20px', fontFamily: 'serif', color: '#f5d680',
            stroke: '#1a1a1a', strokeThickness: 4,
        }).setOrigin(0.5)
        g.add(title)

        const entries = [
            ['↑  ↓  ←  →', 'Déplacer'],
            ['SPACE',       'Attaquer'],
            ['SPACE ×2',    'Combo'],
            ['SHIFT',       'Dash'],
            ['E',           'Garde / Parade'],
            ['ESC',         'Pause'],
        ]
        entries.forEach(([key, action], i) => {
            const y = -60 + i * 30
            g.add(this.add.text(-16, y, key,    { fontSize: '14px', fontFamily: 'monospace', color: '#ffd86e', stroke: '#000', strokeThickness: 2 }).setOrigin(1, 0.5))
            g.add(this.add.text( 16, y, action, { fontSize: '14px', fontFamily: 'serif',     color: '#e8dfc0', stroke: '#000', strokeThickness: 2 }).setOrigin(0, 0.5))
        })

        const close = this.add.text(0, 122, '[ fermer ]', {
            fontSize: '12px', fontFamily: 'serif', color: '#888888',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        close.on('pointerdown', () => g.setVisible(false))
        close.on('pointerover', () => close.setColor('#f5d680'))
        close.on('pointerout',  () => close.setColor('#888888'))
        g.add(close)

        return g
    }

    _buildPanel(cx, cy, panelW, panelH, container = null) {
        const tex = this.textures.get('sp')
        if (!tex.has('sp-tl')) {
            Object.entries(SP_FRAMES).forEach(([k, [x, y, w, h]]) =>
                tex.add('sp-' + k, 0, x, y, w, h)
            )
        }
        const LW = 55, RW = 55, TH = 43, BH = 43
        const innerW = panelW - LW - RW
        const innerH = panelH - TH - BH
        const topY = -panelH / 2 + TH / 2
        const botY =  panelH / 2 - BH / 2
        const lX   = -panelW / 2 + LW / 2
        const rX   =  panelW / 2 - RW / 2

        const g = container ?? this.add.container(cx, cy)
        g.add(this.add.tileSprite(0, 0, panelW, panelH, 'sp', 'sp-mc'))
        const addEdge = (x, y, fw, fh, frame) => {
            const e = this.add.image(x, y, 'sp', frame).setDisplaySize(fw, fh)
            g.add(e)
        }
        addEdge(0, topY, innerW, TH, 'sp-tc')
        addEdge(0, botY, innerW, BH, 'sp-bc')
        addEdge(lX, 0, LW, innerH, 'sp-ml')
        addEdge(rX, 0, RW, innerH, 'sp-mr')
        g.add(this.add.image(lX, topY, 'sp', 'sp-tl'))
        g.add(this.add.image(rX, topY, 'sp', 'sp-tr'))
        g.add(this.add.image(lX, botY, 'sp', 'sp-bl'))
        g.add(this.add.image(rX, botY, 'sp', 'sp-br'))

        if (!container) return g
    }
}
