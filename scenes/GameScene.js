import { Scene, manager } from '@tialops/maki'
import musicManager from '../managers/MusicManager.js'

const WARRIOR_PATH = 'Tiny Swords (Free Pack)/Units/Blue Units/Warrior'
const MAP_KEY = 'brokeLand'
const PLAYER_START_X = 1056
const PLAYER_START_Y = 2300
const MAP_WIDTH = 30 * 64
const MAP_HEIGHT = 40 * 64
const BGM_KEY = 'game-bgm'
const BGM_PATH = 'audio/sonatina_letsadventure_1ATaleForTheJourney.wav'

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
        manager.map(this, MAP_KEY)
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

        musicManager.preload(this, [
            { key: BGM_KEY, path: BGM_PATH }
        ])
    }

    create() {
        super.create()
        manager.create(this)

        const s = this.warrior.sprite
        this._setupPlayer(s)
        this._setupWorld(s)
        this._createAnimations()
        this._setupAttackState(s)
        this._setupMusic()
        this._muteKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M)
        this._wasMoving = false
    }

    _setupMusic() {
        musicManager.play(this, BGM_KEY, {
            loop: true,
            volume: 0.2
        })

        this.events.once('shutdown', () => {
            musicManager.stop(BGM_KEY)
        })
    }

    _setupPlayer(sprite) {
        sprite.setScale(0.5)
        sprite.setPosition(PLAYER_START_X, PLAYER_START_Y)
        sprite.setBodySize(20, 20)
        sprite.body.setOffset(38, 67)
    }

    _setupWorld(sprite) {
        this.physics.add.collider(sprite, manager.getWallGroup(this, MAP_KEY))
        this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT)
        this.cameras.main.startFollow(sprite, true, 0.1, 0.1)

        this.children.list.forEach(child => {
            if (child.depth === 1 && child.type === 'Image') child.setDepth(child.y)
        })
    }

    _createAnimations() {
        this.anims.create({
            key: 'warrior-idle',
            frames: this.anims.generateFrameNumbers('warrior-idle-sheet', { start: 0, end: 7 }),
            frameRate: 8,
            repeat: -1
        })

        this.anims.create({
            key: 'warrior-attack',
            frames: this.anims.generateFrameNumbers('warrior-attack-sheet', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: 0
        })
    }

    _setupAttackState(sprite) {
        this._attacking = false
        sprite.on('animationcomplete', (anim) => {
            if (anim.key === 'warrior-attack') this._attacking = false
        })
    }

    update() {
        const s = this.warrior.sprite
        const keys = this.warrior.keys

        if (Phaser.Input.Keyboard.JustDown(this._muteKey)) {
            musicManager.toggleMute()
        }

        s.setDepth(s.y)

        if (this._tryStartAttack(s, keys)) return
        if (this._attacking) return

        const moving = this._applyMovement(s, keys)

        if (!moving) {
            s.anims.play('warrior-idle', true)
        }

        if (moving && !this._wasMoving) {
            // this._playDust(s.x, s.y + 20)
        }
        this._wasMoving = moving
    }

    _tryStartAttack(sprite, keys) {
        if (!Phaser.Input.Keyboard.JustDown(keys.space) || this._attacking) {
            return false
        }

        this._attacking = true
        sprite.anims.play('warrior-attack', true)
        sprite.setVelocity(0)
        return true
    }

    _applyMovement(sprite, keys) {
        const speed = this.warrior.speed
        sprite.setVelocity(0)

        if (keys.left.isDown) {
            sprite.setVelocityX(-speed)
            sprite.setFlipX(true)
            sprite.anims.play('warrior-right', true)
            return true
        }

        if (keys.right.isDown) {
            sprite.setVelocityX(speed)
            sprite.setFlipX(false)
            sprite.anims.play('warrior-right', true)
            return true
        }

        if (keys.up.isDown) {
            sprite.setVelocityY(-speed)
            sprite.anims.play('warrior-right', true)
            return true
        }

        if (keys.down.isDown) {
            sprite.setVelocityY(speed)
            sprite.anims.play('warrior-right', true)
            return true
        }

        return false
    }
}
