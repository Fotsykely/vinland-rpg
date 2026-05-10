import Phaser from 'phaser'

const AVATAR_PATH  = 'Tiny Swords (Free Pack)/UI Elements/UI Elements/Human Avatars/Avatars_01.png'
const AVATAR_SCALE = 0.25   // 256 × 0.25 = 64 px
const MAX_LIVES    = 3
const PAD          = 10
const GAP          = 8

export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' })
    }

    preload() {
        if (!this.textures.exists('player-avatar')) {
            this.load.image('player-avatar', AVATAR_PATH)
        }
        if (!this.textures.exists('arrow-icon')) {
            this.load.image('arrow-icon', 'Tiny Swords (Free Pack)/UI Elements/UI Elements/Icons/Icon_08.png')
        }
    }

    create() {
        const size = 256 * AVATAR_SCALE   // 64 px
        const half = size / 2

        this._avatars = []
        for (let i = 0; i < MAX_LIVES; i++) {
            const x = PAD + half + i * (size + GAP)
            const y = PAD + half
            const img = this.add.image(x, y, 'player-avatar').setScale(AVATAR_SCALE)
            this._avatars.push(img)
        }

        this._arrow = this.add.image(0, 0, 'arrow-icon').setScale(0.5).setVisible(false)
        this.tweens.add({
            targets:  this._arrow,
            scaleX:   0.7,
            scaleY:   0.7,
            duration: 550,
            yoyo:     true,
            repeat:   -1,
            ease:     'Sine.easeInOut',
        })

        this._waveText = this.add.text(
            this.scale.width / 2, this.scale.height / 2 - 60, '',
            { fontSize: '36px', fontFamily: 'serif', color: '#f5d680', stroke: '#1a1a1a', strokeThickness: 5 }
        ).setOrigin(0.5).setAlpha(0)

        this._enemyCountText = this.add.text(
            this.scale.width - PAD, PAD,
            '',
            { fontSize: '18px', fontFamily: 'serif', color: '#f5d680', stroke: '#1a1a1a', strokeThickness: 3 }
        ).setOrigin(1, 0)

        this.game.events.on('player-health', this._onHealthChange, this)
        this.game.events.on('wave-start', this._onWaveStart, this)
        this.game.events.on('wave-clear', this._onWaveClear, this)
        this.game.events.on('nearest-enemy', this._onNearestEnemy, this)
        this.game.events.on('enemy-count', this._onEnemyCount, this)
        this.game.events.once('game-over', this._onGameOver, this)
        this.events.once('shutdown', () => {
            this.game.events.off('player-health', this._onHealthChange, this)
            this.game.events.off('wave-start', this._onWaveStart, this)
            this.game.events.off('wave-clear', this._onWaveClear, this)
            this.game.events.off('nearest-enemy', this._onNearestEnemy, this)
            this.game.events.off('enemy-count', this._onEnemyCount, this)
            this.game.events.off('game-over', this._onGameOver, this)
        })
    }

    _showWaveText(text) {
        this._waveText.setText(text).setAlpha(1)
        this.tweens.killTweensOf(this._waveText)
        this.tweens.add({
            targets: this._waveText, alpha: 0,
            delay: 1400, duration: 600,
            ease: 'Sine.easeIn',
        })
    }

    _onGameOver() {
        const W = this.scale.width
        const H = this.scale.height

        const overlay = this.add.graphics()
        overlay.fillStyle(0x000000, 0.78)
        overlay.fillRect(0, 0, W, H)

        this.add.text(W / 2, H / 2 - 36, 'GAME OVER', {
            fontSize: '52px',
            fontFamily: 'serif',
            color: '#cc2222',
            stroke: '#000000',
            strokeThickness: 7,
        }).setOrigin(0.5)

        const prompt = this.add.text(W / 2, H / 2 + 44, 'Press any key to restart', {
            fontSize: '18px',
            fontFamily: 'serif',
            color: '#aaaaaa',
        }).setOrigin(0.5)

        this.tweens.add({
            targets: prompt, alpha: 0.1,
            duration: 650, yoyo: true, repeat: -1,
            ease: 'Sine.easeInOut',
        })

        // Short delay so the death-frame key doesn't instantly restart
        this.time.delayedCall(600, () => {
            this.input.keyboard.once('keydown', () => {
                this.game.events.emit('game-over-restart')
            })
        })
    }

    _onEnemyCount(n)   { this._enemyCountText.setText(`⚔ ${n}`) }
    _onWaveStart(wave) { this._showWaveText(`WAVE  ${wave}`) }
    _onWaveClear()     { this._showWaveText('CLEARED !') }

    _onNearestEnemy(data) {
        if (!data || data.inView) {
            this._arrow.setVisible(false)
            return
        }

        const W  = this.scale.width
        const H  = this.scale.height
        const cx = W / 2
        const cy = H / 2
        const dx = data.sx - cx
        const dy = data.sy - cy

        // Find where the direction ray exits the screen rectangle (with margin)
        const margin = 52
        const hw = cx - margin
        const hh = cy - margin
        const tx = hw / (Math.abs(dx) || 0.001)
        const ty = hh / (Math.abs(dy) || 0.001)
        const t  = Math.min(tx, ty)

        this._arrow
            .setPosition(cx + dx * t, cy + dy * t)
            .setRotation(Math.atan2(dy, dx) + Math.PI)
            .setVisible(true)
    }

    _onHealthChange(lives) {
        this._avatars.forEach((img, i) => {
            if (i < lives) {
                img.clearTint()
                img.setAlpha(1)
            } else {
                img.setTint(0x222222)
                img.setAlpha(0.45)
            }
        })
    }
}
