import Enemy from './Enemy.js'

export default class Lancer extends Enemy {
    constructor(scene, sprite, options = {}) {
        super(scene, sprite, options)
        this.idleAnimKey = options.idleAnimKey ?? 'lancer-idle'
        this.runAnimKey = options.runAnimKey ?? 'lancer-run'
    }

    update(targetSprite) {
        if (targetSprite) {
            this.setTarget(targetSprite)
        }

        if (!this.target || !this.isAlive()) {
            this.stop()
            this._playIdle()
            this.updateDepth()
            return
        }

        const distance = this.getDistanceTo(this.target)
        if (distance > this.detectionRadius || distance <= this.stopDistance) {
            this.stop()
            this._playIdle()
            this.updateDepth()
            return
        }

        const dx = this.target.x - this.sprite.x
        this.moveToward(this.target.x, this.target.y)
        this.sprite.setFlipX(dx < 0)
        this._playRun()
        this.updateDepth()
    }

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
