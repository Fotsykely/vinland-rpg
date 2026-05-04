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
    }

    create() {
        super.create()
        manager.create(this)

        // Place lia in the center of the map (50×50 tiles × 16px = 800×800)
        this.lia.sprite.setPosition(400, 400)

        this.physics.add.collider(this.lia.sprite, manager.getWallGroup(this, 'default_map'))
    }

    update() {
        this.maki.move(this.lia)
    }
}
