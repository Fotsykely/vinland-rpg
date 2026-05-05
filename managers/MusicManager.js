class MusicManager {
    constructor() {
        this._tracks = new Map()
        this._muted = false
    }

    preload(scene, tracks) {
        tracks.forEach((track) => {
            if (!track?.key || !track?.path) return
            if (scene.cache.audio.exists(track.key)) return
            scene.load.audio(track.key, track.path)
        })
    }

    play(scene, key, options = {}) {
        if (!scene.cache.audio.exists(key)) {
            return null
        }

        const existing = this._tracks.get(key)
        if (existing) {
            if (!existing.isPlaying) existing.play()
            return existing
        }

        const sound = scene.sound.add(key, {
            loop: options.loop ?? true,
            volume: options.volume ?? 0.4,
            rate: options.rate ?? 1,
            detune: options.detune ?? 0,
            mute: this._muted
        })

        sound.play()
        this._tracks.set(key, sound)

        sound.once('destroy', () => {
            this._tracks.delete(key)
        })

        return sound
    }

    stop(key) {
        const sound = this._tracks.get(key)
        if (!sound) return
        sound.stop()
        sound.destroy()
    }

    stopAll() {
        this._tracks.forEach((sound) => {
            sound.stop()
            sound.destroy()
        })
        this._tracks.clear()
    }

    setMuted(value) {
        this._muted = Boolean(value)
        this._tracks.forEach((sound) => {
            sound.setMute(this._muted)
        })
    }

    toggleMute() {
        this.setMuted(!this._muted)
        return this._muted
    }

    setVolume(key, volume) {
        const sound = this._tracks.get(key)
        if (!sound) return
        sound.setVolume(Phaser.Math.Clamp(volume, 0, 1))
    }
}

const musicManager = new MusicManager()
export default musicManager
