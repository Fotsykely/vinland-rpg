// Registry of all prefabs available in the collision editor.
// Collision values (bodyWidth/Height/OffsetX/Y) are NOT stored here —
// they live in sourcePath and are loaded at runtime.
export const PREFABS = {
    tree: {
        label:       'Tree',
        sheetKey:    'tree1-sheet',
        assetPath:   'Tiny Swords (Free Pack)/Terrain/Resources/Wood/Trees/Tree1.png',
        frameWidth:  192,
        frameHeight: 256,
        frameRate:   8,
        animKey:     'tree-sway',
        scale:       0.5,   // must match setScale() in the game entity
        sourcePath:  'entities/environment/tree.collider.json',
    },
}
