import sfxCatalog from './sfxCatalog.js'

class SfxManager {
    constructor() {
        this._catalog = sfxCatalog
        this._muted = false
        this._masterVolume = 1
    }

    setCatalog(catalog) {
        this._catalog = catalog || {}
    }

    preload(scene) {
        const clips = this._flattenCatalog()
        clips.forEach((clip) => {
            if (!clip?.key || !clip?.path) return
            if (scene.cache.audio.exists(clip.key)) return
            scene.load.audio(clip.key, clip.path)
        })
    }

    play(scene, group, action, options = {}) {
        const clips = this._getClips(group, action)
        if (!clips.length) return null

        const selected = this._pickRandomClip(clips)
        if (!selected || !scene.cache.audio.exists(selected.key)) return null

        const sound = scene.sound.add(selected.key, {
            loop: options.loop ?? selected.loop ?? false,
            volume: this._resolveVolume(selected, options),
            rate: options.rate ?? selected.rate ?? 1,
            detune: options.detune ?? selected.detune ?? 0,
            mute: this._muted
        })

        sound.play()
        sound.once('complete', () => sound.destroy())

        return sound
    }

    setMuted(value) {
        this._muted = Boolean(value)
    }

    toggleMute() {
        this.setMuted(!this._muted)
        return this._muted
    }

    setMasterVolume(volume) {
        this._masterVolume = this._clamp01(volume)
    }

    _resolveVolume(clip, options) {
        const base = options.volume ?? clip.volume ?? 1
        return this._clamp01(base * this._masterVolume)
    }

    _flattenCatalog() {
        const clips = []

        Object.values(this._catalog || {}).forEach((group) => {
            Object.values(group || {}).forEach((actionClips) => {
                if (!Array.isArray(actionClips)) return
                actionClips.forEach((clip) => clips.push(clip))
            })
        })

        return clips
    }

    _getClips(group, action) {
        const actionClips = this._catalog?.[group]?.[action]
        if (!Array.isArray(actionClips)) return []
        return actionClips
    }

    _pickRandomClip(clips) {
        const index = Math.floor(Math.random() * clips.length)
        return clips[index]
    }

    _clamp01(value) {
        if (Number.isNaN(value)) return 0
        if (value < 0) return 0
        if (value > 1) return 1
        return value
    }
}

const sfxManager = new SfxManager()
export default sfxManager
