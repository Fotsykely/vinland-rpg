import { Scene, manager } from '@tialops/maki'
import musicManager from '../managers/audio/MusicManager.js'
import sfxManager from '../managers/audio/SfxManager.js'
import Lancer from '../entities/enemies/Lancer.js'

const WARRIOR_PATH = 'Tiny Swords (Free Pack)/Units/Blue Units/Warrior'
const LANCER_PATH = 'Tiny Swords (Free Pack)/Units/Red Units/Lancer'
const MAP_KEY = 'vinLand'
const PLAYER_START_X = 1056
const PLAYER_START_Y = 2300
const LANCER_START_X = 1168
const LANCER_START_Y = 2000
const MAP_WIDTH = 30 * 64
const MAP_HEIGHT = 40 * 64
const UNIT_FRAME_WIDTH = 192
const UNIT_FRAME_HEIGHT = 192
const LANCER_FRAME_WIDTH = 320
const LANCER_FRAME_HEIGHT = 320
const LANCER_DETECTION_RADIUS = 280
const LANCER_STOP_DISTANCE = 56
const LANCER_SPEED = 95
const BGM_KEY = 'game-bgm'
const BGM_PATH = 'audio/bgm/sonatina_letsadventure_1ATaleForTheJourney.wav'

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
            frameWidth: UNIT_FRAME_WIDTH, frameHeight: UNIT_FRAME_HEIGHT
        })
        this.load.spritesheet('warrior-attack-sheet', `${WARRIOR_PATH}/Warrior_Attack1.png`, {
            frameWidth: UNIT_FRAME_WIDTH, frameHeight: UNIT_FRAME_HEIGHT
        })
        this.load.spritesheet('lancer-idle-sheet', `${LANCER_PATH}/Lancer_Idle.png`, {
            frameWidth: LANCER_FRAME_WIDTH, frameHeight: LANCER_FRAME_HEIGHT
        })
        this.load.spritesheet('lancer-run-sheet', `${LANCER_PATH}/Lancer_Run.png`, {
            frameWidth: LANCER_FRAME_WIDTH, frameHeight: LANCER_FRAME_HEIGHT
        })
        this.load.spritesheet('dust', 'Tiny Swords (Free Pack)/Particle FX/Dust_02.png', {
            frameWidth: 64, frameHeight: 64
        })

        musicManager.preload(this, [
            { key: BGM_KEY, path: BGM_PATH }
        ])
        sfxManager.preload(this)
    }

    create() {
        super.create()
        manager.create(this)

        const s = this.warrior.sprite
        this._setupPlayer(s)
        this._setupWorld(s)
        this._createAnimations()
        this._setupAttackState(s)
        this._setupLancer(s)
        this._setupMusic()
        this._muteKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M)
        this._wasMoving = false
    }

    _setupLancer(targetSprite) {
        const lancerSprite = this.physics.add.sprite(LANCER_START_X, LANCER_START_Y, 'lancer-idle-sheet')
        lancerSprite.setScale(0.5)
        lancerSprite.setBodySize(20, 20)
        lancerSprite.body.setOffset(150, 210)
        lancerSprite.body.allowGravity = false

        this.physics.add.collider(lancerSprite, manager.getWallGroup(this, MAP_KEY))

        this.lancer = new Lancer(this, lancerSprite, {
            maxLives: 4,
            lives: 4,
            moveSpeed: LANCER_SPEED,
            detectionRadius: LANCER_DETECTION_RADIUS,
            stopDistance: LANCER_STOP_DISTANCE,
            target: targetSprite,
            idleAnimKey: 'lancer-idle',
            runAnimKey: 'lancer-run'
        })

        lancerSprite.anims.play('lancer-idle', true)
    }

    _setupMusic() {
        musicManager.play(this, BGM_KEY, {
            loop: true,
            volume: 0.14
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
        this._createAnimationFromSheet('warrior-idle', 'warrior-idle-sheet', 8, -1)
        this._createAnimationFromSheet('warrior-attack', 'warrior-attack-sheet', 10, 0)
        this._createAnimationFromSheet('lancer-idle', 'lancer-idle-sheet', 12, -1)
        this._createAnimationFromSheet('lancer-run', 'lancer-run-sheet', 10, -1)
    }

    _createAnimationFromSheet(key, sheetKey, frameRate, repeat, frameStart = 0, frameEnd = null) {
        if (this.anims.exists(key) || !this.textures.exists(sheetKey)) {
            return
        }

        const frameTotal = this.textures.get(sheetKey).frameTotal
        if (!frameTotal || frameTotal < 1) {
            return
        }

        this.anims.create({
            key,
            frames: this.anims.generateFrameNumbers(sheetKey, {
                start: frameStart,
                end: frameEnd ?? frameTotal - 1
            }),
            frameRate,
            repeat
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
            sfxManager.toggleMute()
        }

        s.setDepth(s.y)
        this.lancer?.update(s)

        if (this._tryStartAttack(s, keys)) return
        if (this._attacking) return

        const moving = this._applyMovement(s, keys)

        if (!moving) {
            s.anims.play('warrior-idle', true)
        }

        if (moving && !this._wasMoving) {
            sfxManager.play(this, 'player', 'walk')
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
        sfxManager.play(this, 'player', 'attack')
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
