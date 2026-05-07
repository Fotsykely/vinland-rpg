import collider from './tree.collider.json'

const SHEET_KEY = 'tree1-sheet'
const ANIM_KEY  = 'tree-sway'
const ASSET_PATH = 'Tiny Swords (Free Pack)/Terrain/Resources/Wood/Trees/Tree1.png'
const FRAME_WIDTH  = 192
const FRAME_HEIGHT = 256
const FRAME_RATE   = 8

export default class Tree {
    constructor(scene, x, y, { scale = 0.5, debug = false } = {}) {
        this.sprite = scene.physics.add.staticSprite(x, y, SHEET_KEY)
        this.sprite.setOrigin(0.5, 1)
        this.sprite.setScale(scale)
        this.sprite.setDepth(y)
        this.sprite.refreshBody()
        // refreshBody reset width/height → setSize doit être appelé après
        this.sprite.body.setSize(collider.bodyWidth, collider.bodyHeight, false)
        this.sprite.body.setOffset(collider.bodyOffsetX, collider.bodyOffsetY)
        this.sprite.anims.play(ANIM_KEY, true)
        this._randomizeStart(scene)
        if (debug) this._drawDebugBody(scene)
    }

    _drawDebugBody(scene) {
        const { x, y, width, height } = this.sprite.body
        const gfx = scene.add.graphics()
        gfx.lineStyle(2, 0x0000ff, 1)
        gfx.strokeRect(x, y, width, height)
        gfx.setDepth(99999)
    }

    _randomizeStart(scene) {
        const anim = scene.anims.get(ANIM_KEY)
        if (!anim) return
        const frame = anim.frames[Phaser.Math.Between(0, anim.frames.length - 1)]
        this.sprite.anims.setCurrentFrame(frame)
    }

    static preload(scene) {
        scene.load.spritesheet(SHEET_KEY, ASSET_PATH, {
            frameWidth: FRAME_WIDTH,
            frameHeight: FRAME_HEIGHT
        })
    }

    static createAnimation(scene) {
        if (scene.anims.exists(ANIM_KEY)) return
        const frameTotal = scene.textures.get(SHEET_KEY).frameTotal
        scene.anims.create({
            key: ANIM_KEY,
            frames: scene.anims.generateFrameNumbers(SHEET_KEY, { start: 0, end: frameTotal - 1 }),
            frameRate: FRAME_RATE,
            repeat: -1
        })
    }
}
