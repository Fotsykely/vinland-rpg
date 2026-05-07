import Phaser from 'phaser'

const W = 400
const H = 350

export default class ColliderEditorScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ColliderEditorScene' })
    }

    init(data) {
        const prefabs   = this.registry.get('prefabs')
        const prefabKey = data.prefabKey ?? this.registry.get('initialPrefab') ?? Object.keys(prefabs)[0]
        this._prefab    = prefabs[prefabKey]
        this.bodyW      = data.bodyW  ?? this._prefab.bodyWidth  ?? 0
        this.bodyH      = data.bodyH  ?? this._prefab.bodyHeight ?? 0
        this.bodyOX     = data.bodyOX ?? this._prefab.bodyOffsetX ?? 0
        this.bodyOY     = data.bodyOY ?? this._prefab.bodyOffsetY ?? 0
        this._dragging  = null
        this._drag      = null
    }

    preload() {
        const p = this._prefab
        if (!this.textures.exists(p.sheetKey)) {
            this.load.spritesheet(p.sheetKey, p.assetPath, {
                frameWidth:  p.frameWidth,
                frameHeight: p.frameHeight,
            })
        }
    }

    create() {
        const p  = this._prefab

        this._drawCheckerboard()

        // Always display at scale 1 for visibility.
        // _bodyRect() converts game-space body values → editor-display-space using 1/gameScale.
        this.sprite = this.add.sprite(W / 2, H - 10, p.sheetKey)
        this.sprite.setOrigin(0.5, 1)

        if (!this.anims.exists(p.animKey)) {
            const lastFrame = this.textures.get(p.sheetKey).frameTotal - 2
            this.anims.create({
                key:       p.animKey,
                frames:    this.anims.generateFrameNumbers(p.sheetKey, { start: 0, end: lastFrame }),
                frameRate: p.frameRate,
                repeat:    -1,
            })
        }
        this.sprite.play(p.animKey)

        this.bodyGfx = this.add.graphics()
        this._drawBody()

        this.input.on('pointerdown', this._onDown, this)
        this.input.on('pointermove', this._onMove, this)
        this.input.on('pointerup',   this._onUp,   this)

        this._emit()
    }

    // ── Drawing ──────────────────────────────────────────────────────────────

    _drawCheckerboard() {
        const gfx  = this.add.graphics()
        const size = 16
        const cols = Math.ceil(W / size)
        const rows = Math.ceil(H / size)
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                gfx.fillStyle((r + c) % 2 === 0 ? 0x1e1e1e : 0x181818, 1)
                gfx.fillRect(c * size, r * size, size, size)
            }
        }
        gfx.setDepth(-1)
    }

    // Phaser StaticBody rules:
    //   setSize(w, h)     → body.width  = w * scaleX   (pre-scale values)
    //   setOffset(ox, oy) → body.x = sprite.x - displayW * originX + ox  (world-space values)
    //
    // Editor displays sprite at scale 1 (frameWidth × frameHeight).
    // To match game proportions:
    //   - offset is scaled by 1/gameScale  (world px → editor px)
    //   - size   is used as-is             (pre-scale px = same in editor at scale 1)
    _bodyRect() {
        const { x: sx, y: sy } = this.sprite
        const gs    = this._prefab.scale ?? 1
        const ratio = 1 / gs
        return {
            x: sx - this._prefab.frameWidth  / 2 + this.bodyOX * ratio,
            y: sy - this._prefab.frameHeight      + this.bodyOY * ratio,
            w: this.bodyW,   // pre-scale: no conversion needed
            h: this.bodyH,
        }
    }

    _drawBody() {
        const r  = this._bodyRect()
        const hs = 5
        this._cache = r

        this.bodyGfx.clear()
        this.bodyGfx.setDepth(10)

        this.bodyGfx.fillStyle(0x4ade80, 0.18)
        this.bodyGfx.fillRect(r.x, r.y, r.w, r.h)

        this.bodyGfx.lineStyle(1, 0x4ade80, 0.85)
        this.bodyGfx.strokeRect(r.x, r.y, r.w, r.h)

        this.bodyGfx.lineStyle(1, 0x4ade80, 0.3)
        this.bodyGfx.lineBetween(r.x + r.w / 2, r.y, r.x + r.w / 2, r.y + r.h)
        this.bodyGfx.lineBetween(r.x, r.y + r.h / 2, r.x + r.w, r.y + r.h / 2)

        this.bodyGfx.fillStyle(0xffffff, 0.9)
        for (const [cx, cy] of [
            [r.x,       r.y      ],
            [r.x + r.w, r.y      ],
            [r.x,       r.y + r.h],
            [r.x + r.w, r.y + r.h],
        ]) {
            this.bodyGfx.fillRect(cx - hs / 2, cy - hs / 2, hs, hs)
        }
    }

    // ── Hit test ─────────────────────────────────────────────────────────────

    _hitTest(px, py) {
        const r  = this._cache
        if (!r) return null
        const hs = 9

        for (const c of [
            { name: 'tl', x: r.x,       y: r.y       },
            { name: 'tr', x: r.x + r.w, y: r.y       },
            { name: 'bl', x: r.x,       y: r.y + r.h },
            { name: 'br', x: r.x + r.w, y: r.y + r.h },
        ]) {
            if (Math.abs(px - c.x) <= hs && Math.abs(py - c.y) <= hs) {
                return { type: 'corner', corner: c.name }
            }
        }
        if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
            return { type: 'move' }
        }
        return null
    }

    // ── Pointer events ───────────────────────────────────────────────────────

    _onDown(pointer) {
        const hit = this._hitTest(pointer.x, pointer.y)
        if (!hit) return
        this._dragging = hit
        this._drag = {
            sx: pointer.x, sy: pointer.y,
            ox: this.bodyOX, oy: this.bodyOY,
            w:  this.bodyW,  h:  this.bodyH,
        }
    }

    _onMove(pointer) {
        const hit = this._hitTest(pointer.x, pointer.y)
        if (!this._dragging) {
            if      (!hit)                 this.input.setDefaultCursor('default')
            else if (hit.type === 'move')  this.input.setDefaultCursor('grab')
            else if (hit.corner === 'tl' || hit.corner === 'br') this.input.setDefaultCursor('nwse-resize')
            else                           this.input.setDefaultCursor('nesw-resize')
        }
        if (!this._dragging) return

        const gs  = this._prefab.scale ?? 1
        const raw_dx = pointer.x - this._drag.sx   // display-space delta
        const raw_dy = pointer.y - this._drag.sy
        // offset is world-space → convert display delta to world: multiply by gs
        const off_dx = Math.round(raw_dx * gs)
        const off_dy = Math.round(raw_dy * gs)
        // size is pre-scale → display delta = pre-scale delta (no conversion)
        const siz_dx = Math.round(raw_dx)
        const siz_dy = Math.round(raw_dy)

        if (this._dragging.type === 'move') {
            this.bodyOX = this._drag.ox + off_dx
            this.bodyOY = this._drag.oy + off_dy
        } else {
            const c = this._dragging.corner
            if (c === 'br') {
                this.bodyW = Math.max(1, this._drag.w + siz_dx)
                this.bodyH = Math.max(1, this._drag.h + siz_dy)
            } else if (c === 'tl') {
                this.bodyOX = this._drag.ox + off_dx
                this.bodyOY = this._drag.oy + off_dy
                this.bodyW  = Math.max(1, this._drag.w - siz_dx)
                this.bodyH  = Math.max(1, this._drag.h - siz_dy)
            } else if (c === 'tr') {
                this.bodyOY = this._drag.oy + off_dy
                this.bodyW  = Math.max(1, this._drag.w + siz_dx)
                this.bodyH  = Math.max(1, this._drag.h - siz_dy)
            } else if (c === 'bl') {
                this.bodyOX = this._drag.ox + off_dx
                this.bodyW  = Math.max(1, this._drag.w - siz_dx)
                this.bodyH  = Math.max(1, this._drag.h + siz_dy)
            }
        }

        this._drawBody()
        this._emit()
    }

    _onUp() {
        this._dragging = null
        this.input.setDefaultCursor('default')
    }

    // ── Public API ───────────────────────────────────────────────────────────

    setBody(w, h, ox, oy) {
        this.bodyW  = w;  this.bodyH  = h
        this.bodyOX = ox; this.bodyOY = oy
        this._drawBody()
    }

    loadPrefab(key, data) {
        this.scene.restart({
            prefabKey: key,
            bodyW:  data.bodyWidth,  bodyH:  data.bodyHeight,
            bodyOX: data.bodyOffsetX, bodyOY: data.bodyOffsetY,
        })
    }

    // ── Communication ────────────────────────────────────────────────────────

    _emit() {
        window.dispatchEvent(new CustomEvent('collider-update', {
            detail: { bodyW: this.bodyW, bodyH: this.bodyH, bodyOX: this.bodyOX, bodyOY: this.bodyOY },
        }))
    }
}
