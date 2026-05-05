import { Scene, manager } from '@tialops/maki'

const WARRIOR_PATH = 'Tiny Swords (Free Pack)/Units/Blue Units/Warrior'

export default class GameScene extends Scene {
    _getConfig() {
        return {
            sprite: {
                // warrior_run.png copied to assets/sprites/ so maki can find it
                file: 'warrior_run.png',
                layout: 'row',
                cols: 6,
                rows: 1,
                frameWidth: 192,
                frameHeight: 192,
                // All directions use the same 6 frames — flip X handles left vs right
                directions: {
                    right: { start: 0, end: 5 },
                    left:  { start: 0, end: 5 },
                    up:    { start: 0, end: 5 },
                    down:  { start: 0, end: 5 }
                }
            }
        }
    }

    preload() {
        super.preload()
        this.warrior = this.maki.player('warrior')
        manager.map(this, 'brokeLand')
        manager.preload(this)

        this.load.spritesheet('warrior-idle-sheet', `${WARRIOR_PATH}/Warrior_Idle.png`, {
            frameWidth: 192, frameHeight: 192
        })
        this.load.spritesheet('warrior-attack-sheet', `${WARRIOR_PATH}/Warrior_Attack1.png`, {
            frameWidth: 192, frameHeight: 192
        })
        this.load.spritesheet('dust', 'Tiny Swords (Free Pack)/Particle FX/Dust_02.png', {
            frameWidth: 64, frameHeight: 64
        })
    }

    create() {
        super.create()
        manager.create(this)

        const s = this.warrior.sprite
        s.setScale(0.5)                   // 192×192 → 96×96 display (~1.5 tiles)
        s.setPosition(1056, 2300)
        s.setBodySize(20, 20)             // hitbox in display-px — adjust with debug: true
        s.body.setOffset(38, 67)          // center hitbox at feet (96*0.5=48 center, 96*0.8=77 feet)

        this.physics.add.collider(s, manager.getWallGroup(this, 'brokeLand'))

        this.cameras.main.setBounds(0, 0, 30 * 64, 40 * 64)
        this.cameras.main.startFollow(s, true, 0.1, 0.1)

        this.children.list.forEach(child => {
            if (child.depth === 1 && child.type === 'Image') child.setDepth(child.y)
        })

        this.anims.create({
            key: 'warrior-idle',
            frames: this.anims.generateFrameNumbers('warrior-idle-sheet', { start: 0, end: 7 }),
            frameRate: 8, repeat: -1
        })
        this.anims.create({
            key: 'warrior-attack',
            frames: this.anims.generateFrameNumbers('warrior-attack-sheet', { start: 0, end: 3 }),
            frameRate: 10, repeat: 0
        })
        this.anims.create({
            key: 'dust-anim',
            frames: this.anims.generateFrameNumbers('dust', { start: 0, end: 9 }),
            frameRate: 12, repeat: 0
        })

        this._attacking = false
        s.on('animationcomplete', (anim) => {
            if (anim.key === 'warrior-attack') this._attacking = false
        })
    }

    _playDust(x, y) {
        const fx = this.add.sprite(x, y, 'dust').setDepth(2)
        fx.play('dust-anim')
        fx.on('animationcomplete', () => fx.destroy())
    }

    update() {
        const s = this.warrior.sprite
        const keys = this.warrior.keys

        s.setDepth(s.y)

        // Space → attack (blocks movement during swing)
        if (Phaser.Input.Keyboard.JustDown(keys.space) && !this._attacking) {
            this._attacking = true
            s.anims.play('warrior-attack', true)
            s.setVelocity(0)
            return
        }
        if (this._attacking) return

        // Movement
        const speed = this.warrior.speed
        s.setVelocity(0)
        let moving = false

        if (keys.left.isDown) {
            s.setVelocityX(-speed)
            s.setFlipX(true)
            s.anims.play('warrior-right', true)  // same frames, flipped
            moving = true
        } else if (keys.right.isDown) {
            s.setVelocityX(speed)
            s.setFlipX(false)
            s.anims.play('warrior-right', true)
            moving = true
        } else if (keys.up.isDown) {
            s.setVelocityY(-speed)
            s.anims.play('warrior-right', true)
            moving = true
        } else if (keys.down.isDown) {
            s.setVelocityY(speed)
            s.anims.play('warrior-right', true)
            moving = true
        }

        if (!moving) {
            s.anims.play('warrior-idle', true)
        }

        if (moving && !this._wasMoving) {
            this._playDust(s.x, s.y + 20)
        }
        this._wasMoving = moving
    }
}
