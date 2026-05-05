import BaseCharacter from '../BaseCharacter.js'

export default class Enemy extends BaseCharacter {
    constructor(scene, sprite, options = {}) {
        super(scene, sprite, options)
        this.target = options.target ?? null
        this.detectionRadius = options.detectionRadius ?? 220
        this.stopDistance = options.stopDistance ?? 44
    }

    setTarget(targetSprite) {
        this.target = targetSprite
    }

    canChaseTarget() {
        if (!this.target || !this.isAlive()) return false
        return this.getDistanceTo(this.target) <= this.detectionRadius
    }
}
