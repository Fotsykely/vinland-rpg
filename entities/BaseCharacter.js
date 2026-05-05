export default class BaseCharacter {
    constructor(scene, sprite, options = {}) {
        this.scene = scene
        this.sprite = sprite
        this.maxLives = options.maxLives ?? 3
        this.lives = options.lives ?? this.maxLives
        this.moveSpeed = options.moveSpeed ?? 100
    }

    isAlive() {
        return this.lives > 0
    }

    takeDamage(amount = 1) {
        this.lives = Math.max(0, this.lives - amount)
        return this.lives
    }

    heal(amount = 1) {
        this.lives = Math.min(this.maxLives, this.lives + amount)
        return this.lives
    }

    setPosition(x, y) {
        this.sprite.setPosition(x, y)
    }

    stop() {
        if (this.sprite.body) {
            this.sprite.body.reset(this.sprite.x, this.sprite.y)
        } else {
            this.sprite.setVelocity(0, 0)
        }
    }

    updateDepth() {
        this.sprite.setDepth(this.sprite.y)
    }

    getDistanceTo(targetSprite) {
        const dx = targetSprite.x - this.sprite.x
        const dy = targetSprite.y - this.sprite.y
        return Math.hypot(dx, dy)
    }

    moveToward(x, y) {
        const dx = x - this.sprite.x
        const dy = y - this.sprite.y
        const length = Math.hypot(dx, dy)

        if (length <= 0.0001) {
            this.stop()
            return
        }

        const vx = (dx / length) * this.moveSpeed
        const vy = (dy / length) * this.moveSpeed
        this.sprite.setVelocity(vx, vy)
    }
}
