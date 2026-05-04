import { Scene, manager } from '@tialops/maki'

export default class GameScene extends Scene {
    _getConfig() {
        return {
            sprite: {
                file: 'ash.png',
                layout: 'row',
                cols: 24,
                rows: 1,
                frameWidth: 32,
                frameHeight: 64,
                directions: {
                    right: { start: 0, end: 5 },
                    up: { start: 6, end: 11 },
                    left: { start: 12, end: 17 },
                    down: { start: 18, end: 23 }
                }
            }
        }
    }

    preload() {
        super.preload()
        this.lia = this.maki.player('ash')
        manager.map(this, 'default_map')
        manager.preload(this)

        this.load.spritesheet('dust', 'Tiny Swords (Free Pack)/Particle FX/Dust_02.png', {
            frameWidth: 64,
            frameHeight: 64
        })
    }

    create() {
        super.create()
        manager.create(this)

        this.lia.sprite.setPosition(400, 400)

        this.physics.add.collider(this.lia.sprite, manager.getWallGroup(this, 'default_map'))

        this.anims.create({
            key: 'dust-anim',
            frames: this.anims.generateFrameNumbers('dust', { start: 0, end: 9 }),
            frameRate: 12,
            repeat: 0
        })
    }

    _playDust(x, y) {
        const fx = this.add.sprite(x, y, 'dust').setDepth(2)
        fx.play('dust-anim')
        fx.on('animationcomplete', () => fx.destroy())
    }

    update() {
        const { x, y } = this.lia.sprite.body.velocity
        const moving = x !== 0 || y !== 0

        if (moving && !this._wasMoving) {
            this._playDust(this.lia.sprite.x, this.lia.sprite.y + 20)
        }
        this._wasMoving = moving

        this.maki.move(this.lia)
    }
}
