import Enemy from './Enemy.js'

const ATTACK_COOLDOWN = 2000   // ms between attacks
const ATTACK_RANGE    = 60     // px — triggers attack

// Angle thresholds (radians) for direction snapping
const D22 = Math.PI / 8        // 22.5°
const D67 = 3 * Math.PI / 8    // 67.5°

export default class Lancer extends Enemy {
    constructor(scene, sprite, options = {}) {
        super(scene, sprite, options)
        this.idleAnimKey    = options.idleAnimKey    ?? 'lancer-idle'
        this.runAnimKey     = options.runAnimKey     ?? 'lancer-run'
        this.attackAnimKeys = options.attackAnimKeys ?? {
            right:     'lancer-attack-right',
            downright: 'lancer-attack-downright',
            down:      'lancer-attack-down',
            upright:   'lancer-attack-upright',
            up:        'lancer-attack-up',
        }

        this._attackState       = 'idle'   // 'idle' | 'attacking' | 'cooldown'
        this._damageDone        = false
        this._currentAttackAnim = null

        sprite.on('animationcomplete', (anim) => {
            if (anim.key !== this._currentAttackAnim) return
            this._tryDealDamage()
            this._attackState = 'cooldown'
            scene.time.delayedCall(ATTACK_COOLDOWN, () => {
                if (this.isAlive()) this._attackState = 'idle'
            })
        })
    }

    update(targetSprite) {
        if (this._isHit) return
        if (targetSprite) this.setTarget(targetSprite)

        if (!this.target || !this.isAlive()) {
            this.stop(); this._playIdle(); this.updateDepth(); return
        }

        const distance = this.getDistanceTo(this.target)

        if (this._attackState === 'attacking') {
            this.stop(); this.updateDepth(); return
        }
        if (this._attackState === 'cooldown') {
            this.stop(); this._playIdle(); this.updateDepth(); return
        }
        if (distance > this.detectionRadius) {
            this.stop(); this._playIdle(); this.updateDepth(); return
        }
        if (distance <= ATTACK_RANGE) {
            this._startAttack(); this.updateDepth(); return
        }

        const dx = this.target.x - this.sprite.x
        this.moveToward(this.target.x, this.target.y)
        this.sprite.setFlipX(dx < 0)
        this._playRun()
        this.updateDepth()
    }

    receiveHit(damage, knockVx, knockVy) {
        this._attackState       = 'idle'
        this._damageDone        = false
        this._currentAttackAnim = null
        super.receiveHit(damage, knockVx, knockVy)
    }

    // ── Direction selection ───────────────────────────────────────────────────

    _getAttackAnim() {
        if (!this.target) return { key: this.attackAnimKeys.right, flipX: false }

        const dx    = this.target.x - this.sprite.x
        const dy    = this.target.y - this.sprite.y
        const flipX = dx < 0

        // Mirror to right hemisphere so we only need 5 key directions
        const angle = Math.atan2(dy, flipX ? -dx : dx)

        let key
        if      (angle >= -D22 && angle <  D22) key = this.attackAnimKeys.right
        else if (angle >=  D22 && angle <  D67) key = this.attackAnimKeys.downright
        else if (angle >=  D67)                 key = this.attackAnimKeys.down
        else if (angle >= -D67 && angle < -D22) key = this.attackAnimKeys.upright
        else                                    key = this.attackAnimKeys.up

        return { key, flipX }
    }

    // ── Attack ────────────────────────────────────────────────────────────────

    _startAttack() {
        if (this._attackState !== 'idle') return
        const { key, flipX } = this._getAttackAnim()
        this._attackState       = 'attacking'
        this._damageDone        = false
        this._currentAttackAnim = key
        this.stop()
        this.sprite.setFlipX(flipX)
        this.sprite.anims.play(key, true)
    }

    _tryDealDamage() {
        if (this._damageDone || !this.target) return
        const dist = this.getDistanceTo(this.target)
        if (dist <= ATTACK_RANGE * 1.4) {
            this._damageDone = true
            this.scene.game.events.emit('lancer-hit-player')
        }
    }

    // ── Animations ────────────────────────────────────────────────────────────

    _playIdle() {
        if (this.sprite.anims.currentAnim?.key !== this.idleAnimKey) {
            this.sprite.anims.play(this.idleAnimKey, true)
        }
    }

    _playRun() {
        if (this.sprite.anims.currentAnim?.key !== this.runAnimKey) {
            this.sprite.anims.play(this.runAnimKey, true)
        }
    }
}
