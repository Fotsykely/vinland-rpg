import Phaser from 'phaser'
import ColliderEditorScene from './scenes/ColliderEditorScene.js'
import { PREFABS } from './prefabs.js'

// ── Tab switching ────────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab
        document.querySelectorAll('.tab-btn').forEach(b =>
            b.classList.toggle('active', b.dataset.tab === tab))
        document.querySelectorAll('.panel').forEach(p =>
            p.classList.toggle('active', p.id === `panel-${tab}`))
    })
})

// ── Prefab list ──────────────────────────────────────────────────────────────
const prefabListEl    = document.getElementById('prefab-list')
let   currentKey      = null
let   game            = null

Object.entries(PREFABS).forEach(([key, p]) => {
    const el = document.createElement('div')
    el.className   = 'prefab-item'
    el.textContent = p.label
    el.dataset.key = key
    el.addEventListener('click', () => selectPrefab(key))
    prefabListEl.appendChild(el)
})

// ── Phaser game ──────────────────────────────────────────────────────────────
function ensureGame() {
    if (game) return
    game = new Phaser.Game({
        type:            Phaser.AUTO,
        width:           400,
        height:          350,
        parent:          'phaser-container',
        backgroundColor: '#161616',
        scene:           [ColliderEditorScene],
    })
    game.registry.set('prefabs', PREFABS)
}

function getScene() {
    const s = game?.scene.getScene('ColliderEditorScene')
    return s?.scene.isActive() ? s : null
}

// ── Select prefab ────────────────────────────────────────────────────────────
async function selectPrefab(key) {
    currentKey = key
    const p = PREFABS[key]

    document.querySelectorAll('.prefab-item').forEach(el =>
        el.classList.toggle('active', el.dataset.key === key))

    // Load collision values from the JSON file (source of truth)
    let w = 0, h = 0, ox = 0, oy = 0
    try {
        const res = await fetch(`/collider?path=${encodeURIComponent(p.sourcePath)}`)
        if (res.ok) {
            const json = await res.json()
            w = json.bodyWidth;  h = json.bodyHeight
            ox = json.bodyOffsetX; oy = json.bodyOffsetY
        }
    } catch { /* file not found yet — start at 0 */ }

    // Mutate the PREFABS entry so the Phaser scene reads correct values when it boots
    p.bodyWidth = w;  p.bodyHeight = h
    p.bodyOffsetX = ox; p.bodyOffsetY = oy

    setInputs(w, h, ox, oy)

    ensureGame()
    game.registry.set('initialPrefab', key)

    const scene = getScene()
    if (scene) {
        scene.loadPrefab(key, { bodyWidth: w, bodyHeight: h, bodyOffsetX: ox, bodyOffsetY: oy })
    }
}

// ── Inputs ───────────────────────────────────────────────────────────────────
const inpW  = document.getElementById('inp-w')
const inpH  = document.getElementById('inp-h')
const inpOX = document.getElementById('inp-ox')
const inpOY = document.getElementById('inp-oy')

function setInputs(w, h, ox, oy) {
    inpW.value  = w;  inpH.value  = h
    inpOX.value = ox; inpOY.value = oy
    refreshCode(w, h, ox, oy)
}

function refreshCode(w, h, ox, oy) {
    document.getElementById('code-output').textContent =
        `body.setSize(${w}, ${h})\nbody.setOffset(${ox}, ${oy})`
}

// Phaser → HTML
window.addEventListener('collider-update', e => {
    const { bodyW, bodyH, bodyOX, bodyOY } = e.detail
    inpW.value  = bodyW;  inpH.value  = bodyH
    inpOX.value = bodyOX; inpOY.value = bodyOY
    refreshCode(bodyW, bodyH, bodyOX, bodyOY)
})

// HTML → Phaser
;[inpW, inpH, inpOX, inpOY].forEach(inp => inp.addEventListener('input', pushToScene))

function pushToScene() {
    const scene = getScene()
    if (!scene) return
    const w  = parseInt(inpW.value)  || 0
    const h  = parseInt(inpH.value)  || 0
    const ox = parseInt(inpOX.value) || 0
    const oy = parseInt(inpOY.value) || 0
    scene.setBody(w, h, ox, oy)
    refreshCode(w, h, ox, oy)
}

// ── Copy ─────────────────────────────────────────────────────────────────────
document.getElementById('btn-copy').addEventListener('click', () => {
    const text = document.getElementById('code-output').textContent
    if (text === '—') return
    navigator.clipboard.writeText(text).then(() => {
        const msg = document.getElementById('copy-msg')
        msg.classList.add('show')
        setTimeout(() => msg.classList.remove('show'), 2000)
    })
})

// ── Save directly to project via Vite dev server ─────────────────────────────
const btnExport = document.getElementById('btn-export')
const copyMsg   = document.getElementById('copy-msg')

btnExport.addEventListener('click', async () => {
    if (!currentKey) return
    const p    = PREFABS[currentKey]
    const data = {
        prefab:      currentKey,
        bodyWidth:   parseInt(inpW.value),
        bodyHeight:  parseInt(inpH.value),
        bodyOffsetX: parseInt(inpOX.value),
        bodyOffsetY: parseInt(inpOY.value),
    }
    const filePath = p.sourcePath ?? `entities/environment/${currentKey}.collider.json`

    try {
        const res = await fetch(`/collider?path=${encodeURIComponent(filePath)}`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ data }),
        })
        if (!res.ok) throw new Error(await res.text())
        btnExport.textContent = 'Saved ✓'
        setTimeout(() => { btnExport.textContent = 'Save' }, 2000)
    } catch (e) {
        console.error('[Collider Editor] Save failed:', e)
        btnExport.textContent = 'Error!'
        setTimeout(() => { btnExport.textContent = 'Save' }, 2000)
    }
})

// ── Auto-select first prefab ─────────────────────────────────────────────────
const firstKey = Object.keys(PREFABS)[0]
if (firstKey) selectPrefab(firstKey)
