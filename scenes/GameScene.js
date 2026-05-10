import { Scene, manager } from '@tialops/maki'
import musicManager from '../managers/audio/MusicManager.js'
import sfxManager from '../managers/audio/SfxManager.js'
import Lancer from '../entities/enemies/Lancer.js'
import Tree   from '../entities/environment/Tree.js'

const WARRIOR_PATH = 'Tiny Swords (Free Pack)/Units/Blue Units/Warrior'
const LANCER_PATH = 'Tiny Swords (Free Pack)/Units/Black Units/Lancer'
const MAP_KEY = 'vinLand'
const PLAYER_START_X = 1056
const PLAYER_START_Y = 2300
const MAP_WIDTH = 30 * 64
const MAP_HEIGHT = 40 * 64
const UNIT_FRAME_WIDTH = 192
const UNIT_FRAME_HEIGHT = 192
const LANCER_FRAME_WIDTH = 320
const LANCER_FRAME_HEIGHT = 320
const LANCER_DETECTION_RADIUS = 280
const LANCER_STOP_DISTANCE = 56
const LANCER_SPEED = 95
const BGM_KEY   = 'game-bgm'
const BGM_PATH  = 'audio/bgm/sonatina_letsadventure_1ATaleForTheJourney.wav'
const MAX_LIVES        = 3
const ATTACK_OFFSET    = 28 // px ahead of player center where attack hitbox is placed
const ATTACK_RADIUS    = 24 // px radius of circular attack hitbox
const DASH_SPEED       = 500  // px/s
const DASH_DURATION    = 160  // ms
const DASH_COOLDOWN    = 1000  // ms
const WAVE_DELAY       = 4000  // ms between waves
const SPAWN_POINTS = [
    // Corridor (x: 960–1340, y: 1650–2540)
    { x: 1168, y: 2000 },
    { x: 1050, y: 1870 },
    { x: 1290, y: 2020 },
    { x:  990, y: 2020 },
    { x: 1270, y: 2360 },
    { x:  990, y: 2440 },
    // Upper area (x: 420–1800, y: 120–1480) — avoids monastery at (1568,104)
    { x:  600, y:  380 },
    { x: 1700, y:  500 },
    { x:  720, y: 1000 },
    { x: 1500, y: 1050 },
    { x: 1100, y:  650 },
]

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
        for (const dir of ['Right', 'DownRight', 'Down', 'UpRight', 'Up']) {
            this.load.spritesheet(`lancer-attack-${dir.toLowerCase()}-sheet`,
                `${LANCER_PATH}/Lancer_${dir}_Attack.png`,
                { frameWidth: LANCER_FRAME_WIDTH, frameHeight: LANCER_FRAME_HEIGHT })
        }
        this.load.spritesheet('dust', 'Tiny Swords (Free Pack)/Particle FX/Dust_02.png', {
            frameWidth: 64, frameHeight: 64
        })

        Tree.preload(this)

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
        this._setupTrees(s)
        this._setupWaves(s)
        this._setupMusic()
        this._muteKey  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M)
        this._dashKey  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)
        this._wasMoving  = false
        this._dashing    = false
        this._dashReady  = true
        this._lastDir    = { x: 1, y: 0 }

        this._attackRangeGfx  = this.add.graphics()
        this._lancerRangeGfx  = this.add.graphics()
        this._invincible = false

        this._lives = MAX_LIVES
        this.scene.launch('UIScene')
        this.game.events.emit('player-health', this._lives)
        this.game.events.on('lancer-hit-player', this.takeDamage, this)
        this.events.once('shutdown', () => {
            this.game.events.off('lancer-hit-player', this.takeDamage, this)
        })

        this._tutorialActive = true
        this.game.events.once('tutorial-done', () => { this._tutorialActive = false })
        this.scene.launch('TutorialScene')
    }

    _setupTrees(warriorSprite) {
        const positions = [
            { x:  664, y: 512 },
            { x: 1210, y: 2170 },
            { x:  1440, y: 955 },
            { x: 752, y: 1008 },
            { x: 1060, y: 2460 },
            { x:  1130, y: 1360 },
        ]
        this.treeGroup = this.physics.add.staticGroup()
        positions.forEach(({ x, y }) => {
            const tree = new Tree(this, x, y, { debug: false })
            this.treeGroup.add(tree.sprite)
        })
        this.physics.add.collider(warriorSprite, this.treeGroup)
    }

    _setupWaves(targetSprite) {
        this._enemies      = []
        this._currentWave  = 0
        this._waveActive   = false
        this._wavePending  = false
        this._waveTarget   = targetSprite
        this._startNextWave()
    }

    _startNextWave() {
        this._currentWave++
        this._waveActive  = true
        this._wavePending = false
        const count  = Math.min(this._currentWave, SPAWN_POINTS.length)
        const points = Phaser.Utils.Array.Shuffle([...SPAWN_POINTS]).slice(0, count)
        points.forEach(({ x, y }) => this._spawnEnemy(x, y))
        this.game.events.emit('wave-start', this._currentWave)
    }

    _spawnEnemy(x, y) {
        const lancerSprite = this.physics.add.sprite(x, y, 'lancer-idle-sheet')
        lancerSprite.setScale(0.5)
        lancerSprite.setBodySize(20, 20)
        lancerSprite.body.setOffset(150, 210)
        lancerSprite.body.allowGravity = false
        this.physics.add.collider(lancerSprite, manager.getWallGroup(this, MAP_KEY))
        this.physics.add.collider(lancerSprite, this.treeGroup)
        const lancer = new Lancer(this, lancerSprite, {
            maxLives: 2, lives: 2,
            moveSpeed: LANCER_SPEED,
            detectionRadius: LANCER_DETECTION_RADIUS,
            stopDistance: LANCER_STOP_DISTANCE,
            target: this._waveTarget,
            idleAnimKey: 'lancer-idle',
            runAnimKey:  'lancer-run',
            attackAnimKeys: {
                right:     'lancer-attack-right',
                downright: 'lancer-attack-downright',
                down:      'lancer-attack-down',
                upright:   'lancer-attack-upright',
                up:        'lancer-attack-up',
            }
        })
        lancerSprite.anims.play('lancer-idle', true)
        this._enemies.push(lancer)
    }

    _checkWaveClear() {
        if (!this._waveActive || this._wavePending || this._enemies.length === 0) return
        if (this._enemies.every(e => !e.isAlive())) {
            this._waveActive  = false
            this._wavePending = true
            this._enemies     = []
            this.game.events.emit('wave-clear', this._currentWave)
            this.time.delayedCall(WAVE_DELAY, () => this._startNextWave())
        }
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
        Tree.createAnimation(this)
        this._createAnimationFromSheet('warrior-idle', 'warrior-idle-sheet', 8, -1)
        this._createAnimationFromSheet('warrior-attack', 'warrior-attack-sheet', 10, 0)
        this._createAnimationFromSheet('lancer-idle',   'lancer-idle-sheet',   12, -1)
        this._createAnimationFromSheet('lancer-run',    'lancer-run-sheet',    10, -1)
        for (const dir of ['right', 'downright', 'down', 'upright', 'up']) {
            this._createAnimationFromSheet(
                `lancer-attack-${dir}`, `lancer-attack-${dir}-sheet`, 8, 0)
        }
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
        this._attacking     = false
        this._hitConnected  = false
        this._hitWindow     = false

        // Open hit window on frame 3+ (last ~half of the attack animation)
        sprite.on('animationupdate', (anim, frame) => {
            if (anim.key === 'warrior-attack' && frame.index >= 2) {
                this._hitWindow = true
            }
        })

        sprite.on('animationcomplete', (anim) => {
            if (anim.key === 'warrior-attack') {
                this._attacking    = false
                this._hitWindow    = false
            }
        })
    }

    update() {
        if (this._tutorialActive) return
        const s = this.warrior.sprite
        const keys = this.warrior.keys

        if (Phaser.Input.Keyboard.JustDown(this._muteKey)) {
            musicManager.toggleMute()
            sfxManager.toggleMute()
        }

        s.setDepth(s.y)
        this._enemies.forEach(e => e.update(s))
        this._checkWaveClear()
        // this._drawLancerRange()

        if (this._attacking && this._hitWindow && !this._hitConnected) {
            this._checkAttackHit(s)
        }

        if (this._dashing) return

        if (Phaser.Input.Keyboard.JustDown(this._dashKey) && this._dashReady && !this._attacking) {
            this._startDash(s)
            return
        }

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

        this._attacking    = true
        this._hitConnected = false
        this._hitWindow    = false
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
            this._lastDir = { x: -1, y: 0 }
            return true
        }

        if (keys.right.isDown) {
            sprite.setVelocityX(speed)
            sprite.setFlipX(false)
            sprite.anims.play('warrior-right', true)
            this._lastDir = { x: 1, y: 0 }
            return true
        }

        if (keys.up.isDown) {
            sprite.setVelocityY(-speed)
            sprite.anims.play('warrior-right', true)
            this._lastDir = { x: 0, y: -1 }
            return true
        }

        if (keys.down.isDown) {
            sprite.setVelocityY(speed)
            sprite.anims.play('warrior-right', true)
            this._lastDir = { x: 0, y: 1 }
            return true
        }

        return false
    }

    _drawLancerRange() {
        this._lancerRangeGfx.clear()
        for (const enemy of this._enemies) {
            if (!enemy.isAlive() || !enemy.isAttacking()) continue
            const { x, y } = enemy.sprite
            const angle = enemy.attackAngle
            const reach = enemy.lanceReach
            const hitR  = enemy.lanceHitRadius
            const tipX  = x + Math.cos(angle) * reach
            const tipY  = y + Math.sin(angle) * reach
            this._lancerRangeGfx.setDepth(enemy.sprite.depth + 1)
            this._lancerRangeGfx.lineStyle(hitR * 2, 0xff2222, 0.18)
            this._lancerRangeGfx.lineBetween(x, y, tipX, tipY)
            this._lancerRangeGfx.lineStyle(1.5, 0xff2222, 0.75)
            this._lancerRangeGfx.lineBetween(x, y, tipX, tipY)
            this._lancerRangeGfx.fillStyle(0xff2222, 0.18)
            this._lancerRangeGfx.fillCircle(x, y, hitR)
            this._lancerRangeGfx.fillCircle(tipX, tipY, hitR)
            this._lancerRangeGfx.lineStyle(1.5, 0xff2222, 0.75)
            this._lancerRangeGfx.strokeCircle(x, y, hitR)
            this._lancerRangeGfx.strokeCircle(tipX, tipY, hitR)
        }
    }

    _drawAttackRange(sprite) {
        this._attackRangeGfx.clear()
        if (!this._attacking) return
        const facing = sprite.flipX ? -1 : 1
        const hitX   = sprite.x + facing * ATTACK_OFFSET
        const hitY   = sprite.y
        // Orange = wind-up, red = hit window active
        const color     = this._hitWindow ? 0xff2222 : 0xff8800
        const fillAlpha = this._hitWindow ? 0.25     : 0.10
        const lineAlpha = this._hitWindow ? 0.90     : 0.45
        this._attackRangeGfx.setDepth(sprite.depth + 1)
        this._attackRangeGfx.fillStyle(color, fillAlpha)
        this._attackRangeGfx.fillCircle(hitX, hitY, ATTACK_RADIUS)
        this._attackRangeGfx.lineStyle(1.5, color, lineAlpha)
        this._attackRangeGfx.strokeCircle(hitX, hitY, ATTACK_RADIUS)
    }

    _checkAttackHit(warriorSprite) {
        const facing = warriorSprite.flipX ? -1 : 1
        const hitX   = warriorSprite.x + facing * ATTACK_OFFSET
        const hitY   = warriorSprite.y
        for (const enemy of this._enemies) {
            if (!enemy.isAlive()) continue
            const dist = Math.hypot(hitX - enemy.sprite.x, hitY - enemy.sprite.y)
            if (dist < ATTACK_RADIUS) {
                this._hitConnected = true
                enemy.receiveHit(1, facing * 340, -120)
            }
        }
    }

    _startDash(sprite) {
        this._dashing    = true
        this._dashReady  = false
        this._invincible = true

        sprite.setVelocity(
            this._lastDir.x * DASH_SPEED,
            this._lastDir.y * DASH_SPEED
        )

        // Afterimage trail
        this.time.addEvent({
            delay: 40, repeat: 3,
            callback: () => this._spawnAfterimage(sprite),
        })

        this.time.delayedCall(DASH_DURATION, () => {
            this._dashing    = false
            this._invincible = false
            sprite.setVelocity(0, 0)
            this.time.delayedCall(DASH_COOLDOWN, () => { this._dashReady = true })
        })
    }

    _spawnAfterimage(sprite) {
        const ghost = this.add.image(sprite.x, sprite.y, sprite.texture.key, sprite.frame.name)
        ghost.setScale(sprite.scaleX, sprite.scaleY)
        ghost.setFlipX(sprite.flipX)
        ghost.setDepth(sprite.depth - 1)
        ghost.setAlpha(0.55)
        ghost.setTint(0x6699ff)
        this.tweens.add({
            targets: ghost, alpha: 0, duration: 220,
            onComplete: () => ghost.destroy(),
        })
    }

    takeDamage() {
        if (this._lives <= 0 || this._invincible) return
        this._lives--
        this.game.events.emit('player-health', this._lives)
        this._invincible = true
        this._applyPlayerHitEffect(this.warrior.sprite)
        this.time.delayedCall(800, () => {
            this._invincible = false
            this.warrior.sprite.setVisible(true).clearTint()
        })
    }

    _applyPlayerHitEffect(sprite) {
        // Red flash
        sprite.setTint(0xff3333)
        this.time.delayedCall(120, () => { if (sprite.active) sprite.clearTint() })

        // Camera shake
        this.cameras.main.shake(220, 0.006)

        // Flicker for the duration of invincibility
        let visible = true
        const flicker = this.time.addEvent({
            delay:    80,
            repeat:   8,
            callback: () => { sprite.setVisible(visible = !visible) },
        })
        this.time.delayedCall(780, () => { flicker.remove() })
    }
}
