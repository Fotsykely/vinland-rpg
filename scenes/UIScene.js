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

        this.game.events.on('player-health', this._onHealthChange, this)
        this.events.once('shutdown', () => {
            this.game.events.off('player-health', this._onHealthChange, this)
        })
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
