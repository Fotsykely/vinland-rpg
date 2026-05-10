#!/usr/bin/env python3
"""Convert vinLand.json from maki format to Tiled JSON format."""

import json
from pathlib import Path

MAKI_PATH   = Path('assets/maps/vinLand.json')
BACKUP_PATH = Path('assets/maps/vinLand.maki.json')

TILESET_NAME  = 'tiny_swords'
TILESET_IMAGE = '../rooms/tiny_swords.png'   # relative to assets/maps/
TILESET_COLS  = 9
TILESET_ROWS  = 6
TILESET_W     = 576
TILESET_H     = 384

def convert():
    maki = json.loads(MAKI_PATH.read_text())

    T    = maki['tileSize']
    MW   = maki['mapWidth']
    MH   = maki['mapHeight']

    # Floor: 2D → flat GIDs  (maki 0=empty→Tiled 0, maki N→Tiled N — 1:1)
    floor_flat = [cell for row in maki['layers']['floor'] for cell in row]

    # Furniture → Tiled object layer
    furniture_objects = []
    for i, item in enumerate(maki['layers'].get('furniture', [])):
        furniture_objects.append({
            'id': i + 1, 'name': '', 'rotation': 0, 'type': 'furniture',
            'visible': True,
            'x': item['x'], 'y': item['y'],
            'width': item['w'], 'height': item['h'],
            'properties': [{'name': 'src', 'type': 'string', 'value': item['src']}],
        })

    # Collisions → Tiled object layer
    collision_objects = []
    for col in maki.get('collisions', []):
        collision_objects.append({
            'id': 200 + col['id'], 'name': 'collision', 'rotation': 0,
            'type': 'collision', 'visible': False,
            'x': col['x'], 'y': col['y'],
            'width': col['w'], 'height': col['h'],
        })

    tiled = {
        'height': MH, 'width': MW,
        'tileheight': T, 'tilewidth': T,
        'infinite': False,
        'nextlayerid': 6, 'nextobjectid': 300,
        'orientation': 'orthogonal',
        'renderorder': 'right-down',
        'tiledversion': '1.10.1',
        'type': 'map', 'version': '1.10',
        'tilesets': [{
            'columns': TILESET_COLS,
            'firstgid': 1,
            'image': TILESET_IMAGE,
            'imageheight': TILESET_H, 'imagewidth': TILESET_W,
            'margin': 0, 'spacing': 0,
            'name': TILESET_NAME,
            'tilecount': TILESET_COLS * TILESET_ROWS,
            'tileheight': T, 'tilewidth': T,
        }],
        'layers': [
            {
                'id': 1, 'name': 'floor',
                'type': 'tilelayer',
                'data': floor_flat,
                'width': MW, 'height': MH,
                'x': 0, 'y': 0,
                'opacity': 1, 'visible': True,
            },
            {
                'id': 2, 'name': 'decorations',
                'type': 'tilelayer',
                'data': [0] * (MW * MH),
                'width': MW, 'height': MH,
                'x': 0, 'y': 0,
                'opacity': 1, 'visible': True,
            },
            {
                'id': 3, 'name': 'furniture',
                'type': 'objectgroup',
                'draworder': 'topdown',
                'objects': furniture_objects,
                'x': 0, 'y': 0,
                'opacity': 1, 'visible': True,
            },
            {
                'id': 4, 'name': 'collisions',
                'type': 'objectgroup',
                'draworder': 'topdown',
                'objects': collision_objects,
                'x': 0, 'y': 0,
                'opacity': 0, 'visible': False,
            },
        ],
    }

    BACKUP_PATH.write_text(MAKI_PATH.read_text())
    MAKI_PATH.write_text(json.dumps(tiled, indent=2))

    print(f'Backup  → {BACKUP_PATH}')
    print(f'Output  → {MAKI_PATH}')
    print(f'Floor tiles (non-empty) : {sum(1 for x in floor_flat if x)}')
    print(f'Furniture objects       : {len(furniture_objects)}')
    print(f'Collision objects       : {len(collision_objects)}')

convert()
