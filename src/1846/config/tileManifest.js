import _ from 'lodash';
import Serializable from 'common/model/serializable';
import Tile from 'common/map/tile';
import TileColorIDs from '1846/config/tileColorIds';
import MapTileIDs from '1846/config/mapTileIds';
import ko from 'knockout';
import ValidationError from 'common/game/validationError';

const TileDefinitions = {
    [MapTileIDs.CHICAGO_CONNECTIONS]: {
        id: MapTileIDs.CHICAGO_CONNECTIONS,
        colorId: TileColorIDs.INVISIBLE,
        template: 'chicagoConnections',
        connections: [[-1, 0]],
        map: true,
        revenue: [20,20,40,40]
    },
    [MapTileIDs.ST_LOUIS]: {
        id: MapTileIDs.ST_LOUIS,
        colorId: TileColorIDs.INVISIBLE,
        template: 'stLouis',
        connections: [[-1, 0],[-1, 1]],
        map: true,
        revenue: [50,50,70,70]
    },
    [MapTileIDs.HOLLAND]: {
        id: MapTileIDs.HOLLAND,
        map: true,
        colorId: TileColorIDs.INVISIBLE,
        template: 'holland',
        connections: [[-1, 0]],
        revenue: [40,40,10,10]
    },
    [MapTileIDs.SARNIA]: {
        id: MapTileIDs.SARNIA,
        map: true,
        colorId: TileColorIDs.INVISIBLE,
        template: 'sarnia',
        connections: [[-1, 0]],
        revenue: [30,30,50,50]
    },
    [MapTileIDs.WINDSOR]: {
        id: MapTileIDs.WINDSOR,
        map: true,
        colorId: TileColorIDs.INVISIBLE,
        template: 'windsor',
        connections: [[-1, 0]],
        revenue: [40,40,60,60]
    },
    [MapTileIDs.LOUISVILLE]: {
        id: MapTileIDs.LOUISVILLE,
        map: true,
        colorId: TileColorIDs.INVISIBLE,
        template: 'louisville',
        connections: [[-1, 0], [-1, 1]],
        revenue: [50,50,70,70]
    },
    [MapTileIDs.CHARLESTON]: {
        id: MapTileIDs.CHARLESTON,
        map: true,
        colorId: TileColorIDs.INVISIBLE,
        template: 'charleston',
        connections: [[-1, 0]],
        revenue: [20,20,50,50]
    },
    [MapTileIDs.BUFFALO]: {
        id: MapTileIDs.BUFFALO,
        map: true,
        colorId: TileColorIDs.INVISIBLE,
        template: 'buffalo',
        connections: [[-1, 0],[-1,1]],
        revenue: [30,30,60,60]
    },
    [MapTileIDs.BINGHAMTON]: {
        id: MapTileIDs.BINGHAMTON,
        map: true,
        colorId: TileColorIDs.INVISIBLE,
        template: 'binghamton',
        connections: [[-1, 0]],
        revenue: [20,20,50,50]
    },
    [MapTileIDs.PITTSBURGH]: {
        id: MapTileIDs.PITTSBURGH,
        map: true,
        colorId: TileColorIDs.INVISIBLE,
        template: 'pittsburgh',
        connections: [[-1, 0],[-1,1],[-1,2]],
        revenue: [30,30,70,70]
    },
    [MapTileIDs.CUMBERLAND]: {
        id: MapTileIDs.CUMBERLAND,
        map: true,
        colorId: TileColorIDs.INVISIBLE,
        template: 'cumberland',
        connections: [[-1, 0]],
        revenue: [20,20,40,40]
    },
    [MapTileIDs.BLANK]: {
        id: MapTileIDs.BLANK,
        map: true,
        colorId: TileColorIDs.INVISIBLE
    },
    [MapTileIDs.CAIRO]: {
        id: MapTileIDs.CAIRO,
        map: true,
        colorId: TileColorIDs.INVISIBLE,
        revenue: 20,
        template: 'cairo',
        connections: [[0, 7]],
        cities: {
            7: { id: 7, maxTokens: 1 }
        }
    },
    [MapTileIDs.CITY]: {
        id: MapTileIDs.CITY,
        map: true,
        colorId: TileColorIDs.INVISIBLE
    },
    [MapTileIDs.CHICAGO]: {
        id: MapTileIDs.CHICAGO,
        map: true,
        colorId: TileColorIDs.YELLOW,
        revenue: 10,
        template: 'mapChicago',
        connections: [[0, 7], [1, 8], [2, 9], [3, 10]],
        cities: {
            7: { id: 7, maxTokens: 1 },
            8: { id: 8, maxTokens: 1 },
            9: { id: 9, maxTokens: 1 },
            10: { id: 10, maxTokens: 1 },
        }
    },
    [MapTileIDs.CENTRALIA]: {
        id: MapTileIDs.CENTRALIA,
        map: true,
        colorId: TileColorIDs.INVISIBLE,
        revenue: 10,
        template: 'mapDoubleCity',
        connections: [[0, 7], [1, 7], [3, 7], [4, 7]],
        cities: {
            7: { id: 7, maxTokens: 2 }
        }
    },
    [MapTileIDs.PORT_HURON]: {
        id: MapTileIDs.PORT_HURON,
        map: true,
        colorId: TileColorIDs.INVISIBLE,
        cities: {
            7: { id: 7, maxTokens: 1 }
        }
    },

    [MapTileIDs.DETROIT]: {
        id: MapTileIDs.DETROIT,
        map: true,
        colorId: TileColorIDs.YELLOW,
        revenue: 40,
        template: 'mapDoubleCity',
        connections: [[0, 7], [4, 7]],
        cities: {
            7: { id: 7, maxTokens: 2 }
        }
    },
    [MapTileIDs.ERIE]: {
        id: MapTileIDs.ERIE,
        map: true,
        colorId: TileColorIDs.YELLOW,
        revenue: 10,
        template: 'mapDoubleCity',
        connections: [[0, 7], [3, 7], [4, 7]],
        cities: {
            7: { id: 7, maxTokens: 2 }
        }
    },
    [MapTileIDs.CLEVELAND]: {
        id: MapTileIDs.CLEVELAND,
        map: true,
        colorId: TileColorIDs.INVISIBLE
    },
    [MapTileIDs.CINCINNATI]: {
        id: MapTileIDs.CINCINNATI,
        map: true,
        template:'cincinnati',
        colorId: TileColorIDs.INVISIBLE,
        cities: {
            7: { id: 7, maxTokens: 1 }
        }
    },
    [MapTileIDs.FORT_WAYNE]: {
        id: MapTileIDs.FORT_WAYNE,
        map: true,
        template:'fortWayne',
        colorId: TileColorIDs.INVISIBLE,
        cities: {
            7: { id: 7, maxTokens: 1 }
        }
    },
    [MapTileIDs.WHEELING]: {
        id: MapTileIDs.WHEELING,
        map: true,
        colorId: TileColorIDs.INVISIBLE,
        revenue: 10,
        template: 'wheeling',
        connections: [[2, 7]],
        cities: {
            7: { id: 7, maxTokens: 1 }
        }
    },
    [MapTileIDs.SALAMANCA]: {
        id: MapTileIDs.SALAMANCA,
        map: true,
        colorId: TileColorIDs.INVISIBLE,
        revenue: 10,
        template: 'salamanca',
        connections: [[1, 7], [4, 7], [5, 7]],
        cities: {
            7: { id: 7, maxTokens: 1 }
        }
    },
    [MapTileIDs.HOMEWOOD]: {
        id: MapTileIDs.HOMEWOOD,
        map: true,
        colorId: TileColorIDs.INVISIBLE,
        template: 'homewood',
        revenue: 10,
        connections: [[1, 7], [2, 7], [4, 7], [5, 7]],
        cities: {
            7: { id: 7, maxTokens: 1 }
        }
    },
    [MapTileIDs.HUNTINGTON]: {
        id: MapTileIDs.HUNTINGTON,
        map: true,
        colorId: TileColorIDs.INVISIBLE,
        revenue: 20,
        template: 'huntington',
        connections: [[0, 7], [1, 7], [5, 7]],
        cities: {
            7: { id: 7, maxTokens: 1 }
        }
    },
    [MapTileIDs.C7]: {
        id: MapTileIDs.C7,
        map: true,
        colorId: TileColorIDs.INVISIBLE,
        template: 'mapCommon',
        connections: [[2, 3]]
    },
    [MapTileIDs.A15]: {
        id: MapTileIDs.A15,
        map: true,
        colorId: TileColorIDs.INVISIBLE,
        template: 'mapCommon',
        connections: [[2, 3]]
    },
    5: {
        id: 5,
        colorId: TileColorIDs.YELLOW,
        revenue: 20,
        template: 'city',
        maxTokens: 1,
        connections: [[2, 7], [3, 7]],
        cities: {
            7: { id: 7, maxTokens: 1 }
        }
    },
    6: {
        id: 6,
        colorId: TileColorIDs.YELLOW,
        revenue: 20,
        template: 'city',
        maxTokens: 1,
        connections: [[1, 7], [3, 7]],
        cities: {
            7: { id: 7, maxTokens: 1 }
        }
    },
    7: {
        id: 7,
        colorId: TileColorIDs.YELLOW,
        connections: [[2, 3]]
    },
    8: {
        id: 8,
        colorId: TileColorIDs.YELLOW,
        connections: [[1, 3]]
    },
    9: {
        id: 9,
        colorId: TileColorIDs.YELLOW,
        connections: [[0, 3]]
    },
    14: {
        id: 14,
        colorId: TileColorIDs.GREEN,
        revenue: 30,
        template: 'city',
        maxTokens: 2,
        connections: [[0, 7], [2, 7], [3, 7], [5, 7]],
        cities: {
            7: { id: 7, maxTokens: 2 }
        }
    },
    15: {
        id: 15,
        colorId: TileColorIDs.GREEN,
        revenue: 30,
        template: 'city',
        maxTokens: 2,
        connections: [[0, 7], [1, 7], [2, 7], [3, 7]],
        cities: {
            7: { id: 7, maxTokens: 2 }
        }
    },
    16: {
        id: 16,
        colorId: TileColorIDs.GREEN,
        connections: [[1, 3], [2, 4]]
    },
    17: {
        id: 17,
        colorId: TileColorIDs.GREEN,
        connections: [[0, 4], [1, 3]]
    },
    18: {
        id: 18,
        colorId: TileColorIDs.GREEN,
        connections: [[0, 3], [1, 2]]
    },
    19: {
        id: 19,
        colorId: TileColorIDs.GREEN,
        connections: [[0, 3], [2, 4]]
    },
    20: {
        id: 20,
        colorId: TileColorIDs.GREEN,
        connections: [[0, 3], [2, 5]]
    },
    21: {
        id: 21,
        colorId: TileColorIDs.GREEN,
        connections: [[0, 1], [3, 5]]
    },
    22: {
        id: 22,
        colorId: TileColorIDs.GREEN,
        connections: [[0, 5], [1, 3]]
    },
    23: {
        id: 23,
        colorId: TileColorIDs.GREEN,
        connections: [[0, 3], [1, 3]]
    },
    24: {
        id: 24,
        colorId: TileColorIDs.GREEN,
        connections: [[0, 3], [3, 5]]
    },
    25: {
        id: 25,
        colorId: TileColorIDs.GREEN,
        connections: [[1, 3], [3, 5]]
    },
    26: {
        id: 26,
        colorId: TileColorIDs.GREEN,
        connections: [[0, 3], [2, 3]]
    },
    27: {
        id: 27,
        colorId: TileColorIDs.GREEN,
        connections: [[0, 3], [0, 1]]
    },
    28: {
        id: 28,
        colorId: TileColorIDs.GREEN,
        connections: [[1, 3], [2, 3]]
    },
    29: {
        id: 29,
        colorId: TileColorIDs.GREEN,
        connections: [[1, 3], [1, 2]]
    },
    30: {
        id: 30,
        colorId: TileColorIDs.GREEN,
        connections: [[1, 3], [3, 4]]
    },
    31: {
        id: 31,
        colorId: TileColorIDs.GREEN,
        connections: [[2, 3], [3, 5]]
    },
    39: {
        id: 39,
        colorId: TileColorIDs.BROWN,
        connections: [[2, 4], [2, 3], [3, 4]]
    },
    40: {
        id: 40,
        colorId: TileColorIDs.BROWN,
        connections: [[1, 5], [1, 3], [3, 5]]
    },
    41: {
        id: 41,
        colorId: TileColorIDs.BROWN,
        connections: [[0, 3], [0, 1], [1, 3]]
    },
    42: {
        id: 42,
        colorId: TileColorIDs.BROWN,
        connections: [[0, 5], [0, 3], [3, 5]]
    },
    43: {
        id: 43,
        colorId: TileColorIDs.BROWN,
        connections: [[0, 2], [0, 3], [1, 3], [1, 2]]
    },
    44: {
        id: 44,
        colorId: TileColorIDs.BROWN,
        connections: [[0, 3], [0, 5], [2, 3], [2, 5]]
    },
    45: {
        id: 45,
        colorId: TileColorIDs.BROWN,
        connections: [[0, 3], [0, 4], [2, 3], [2, 4]]
    },
    46: {
        id: 46,
        colorId: TileColorIDs.BROWN,
        connections: [[0, 2], [0, 3], [2, 4], [3, 4]]
    },
    47: {
        id: 47,
        colorId: TileColorIDs.BROWN,
        connections: [[0, 2], [0, 3], [2, 5], [3, 5]]
    },
    51: {
        id: 51,
        colorId: TileColorIDs.GRAY,
        revenue: 50,
        template: 'city',
        maxTokens: 2,
        connections: [[0, 7], [1, 7], [3, 7], [4, 7], [5, 7]],
        cities: {
            7: { id: 7, maxTokens: 2 }
        }
    },
    57: {
        id: 57,
        colorId: TileColorIDs.YELLOW,
        revenue: 20,
        template: 'city',
        maxTokens: 1,
        connections: [[0, 7], [3, 7]],
        cities: {
            7: { id: 7, maxTokens: 1 }
        }
    },
    70: {
        id: 70,
        colorId: TileColorIDs.BROWN,
        connections: [[0, 1], [0, 2], [1, 3], [2, 3]]
    },
    290: {
        id: 290,
        colorId: TileColorIDs.GRAY,
        revenue: 70,
        template: 'z',
        maxTokens: 3,
        connections: [[0, 7], [1, 7], [3, 7], [4, 7], [5, 7]],
        cities: {
            7: { id: 7, maxTokens: 3 }
        }
    },
    291: {
        id: 291,
        colorId: TileColorIDs.YELLOW,
        revenue: 40,
        template: 'z',
        maxTokens: 1,
        connections: [[2, 7], [3, 7]],
        cities: {
            7: { id: 7, maxTokens: 1 }
        }
    },
    292: {
        id: 292,
        colorId: TileColorIDs.YELLOW,
        revenue: 40,
        template: 'z',
        maxTokens: 1,
        connections: [[1, 7], [3, 7]],
        cities: {
            7: { id: 7, maxTokens: 1 }
        }
    },
    293: {
        id: 293,
        colorId: TileColorIDs.YELLOW,
        revenue: 40,
        template: 'z',
        maxTokens: 1,
        connections: [[0, 7], [3, 7]],
        cities: {
            7: { id: 7, maxTokens: 1 }
        }
    },
    294: {
        id: 294,
        colorId: TileColorIDs.GREEN,
        revenue: 50,
        template: 'z',
        maxTokens: 2,
        connections: [[0, 7], [2, 7], [3, 7], [5, 7]],
        cities: {
            7: { id: 7, maxTokens: 2 }
        }
    },
    295: {
        id: 295,
        colorId: TileColorIDs.GREEN,
        revenue: 50,
        template: 'z',
        maxTokens: 2,
        connections: [[0, 7], [1, 7], [2, 7], [3, 7]],
        cities: {
            7: { id: 7, maxTokens: 2 }
        }
    },
    296: {
        id: 296,
        colorId: TileColorIDs.GREEN,
        revenue: 50,
        template: 'z',
        maxTokens: 2,
        connections: [[0, 7], [2, 7], [3, 7], [4, 7]],
        cities: {
            7: { id: 7, maxTokens: 2 }
        }
    },
    297: {
        id: 297,
        colorId: TileColorIDs.BROWN,
        revenue: 60,
        template: 'z',
        maxTokens: 3,
        connections: [[0, 7], [1, 7], [3, 7], [4, 7], [5, 7]],
        cities: {
            7: { id: 7, maxTokens: 3 }
        }
    },
    298: {
        id: 298,
        colorId: TileColorIDs.GREEN,
        revenue: 40,
        template: 'chicago',
        connections: [[0, 7], [1, 7], [0, 8], [2, 8], [0, 9], [3, 9], [0, 10], [4, 10]],
        cities: {
            7: { id: 7, maxTokens: 1 },
            8: { id: 8, maxTokens: 1 },
            9: { id: 9, maxTokens: 1 },
            10: { id: 10, maxTokens: 1 },
        }
    },
    299: {
        id: 299,
        colorId: TileColorIDs.BROWN,
        revenue: 70,
        template: 'chicago',
        connections: [[0, 7], [1, 7], [0, 8], [2, 8], [0, 9], [3, 9], [0, 10], [4, 10]],
        cities: {
            7: { id: 7, maxTokens: 1 },
            8: { id: 8, maxTokens: 1 },
            9: { id: 9, maxTokens: 1 },
            10: { id: 10, maxTokens: 1 },
        }
    },
    300: {
        id: 300,
        colorId: TileColorIDs.GRAY,
        revenue: 90,
        template: 'chicago',
        connections: [[0, 7], [1, 7], [0, 8], [2, 8], [0, 9], [3, 9], [0, 10], [4, 10]],
        cities: {
            7: { id: 7, maxTokens: 1 },
            8: { id: 8, maxTokens: 1 },
            9: { id: 9, maxTokens: 1 },
            10: { id: 10, maxTokens: 1 },
        }
    },
    611: {
        id: 611,
        colorId: TileColorIDs.BROWN,
        revenue: 40,
        template: 'city',
        maxTokens: 2,
        connections: [[0, 7], [1, 7], [3, 7], [4, 7], [5, 7]],
        cities: {
            7: { id: 7, maxTokens: 2 }
        }
    },
    619: {
        id: 619,
        colorId: TileColorIDs.GREEN,
        revenue: 30,
        template: 'city',
        maxTokens: 2,
        connections: [[0, 7], [2, 7], [3, 7], [4, 7]],
        cities: {
            7: { id: 7, maxTokens: 2 }
        }
    }
};

const Manifest = {
    [MapTileIDs.CHICAGO_CONNECTIONS]: {
        upgrades: []
    },
    [MapTileIDs.ST_LOUIS]: {
        upgrades: []
    },
    [MapTileIDs.HOLLAND]: {
        upgrades: []
    },
    [MapTileIDs.SARNIA]: {
        upgrades: []
    },
    [MapTileIDs.WINDSOR]: {
        upgrades: []
    },
    [MapTileIDs.LOUISVILLE]: {
        upgrades: []
    },
    [MapTileIDs.CHARLESTON]: {
        upgrades: []
    },
    [MapTileIDs.BUFFALO]: {
        upgrades: []
    },
    [MapTileIDs.BINGHAMTON]: {
        upgrades: []
    },
    [MapTileIDs.PITTSBURGH]: {
        upgrades: []
    },
    [MapTileIDs.CUMBERLAND]: {
        upgrades: []
    },
    [MapTileIDs.BLANK]: {
        upgrades: [7, 8, 9],
        count: -1
    },
    [MapTileIDs.CAIRO]: {
        upgrades: []
    },
    [MapTileIDs.CITY]: {
        upgrades: [5, 6, 57],
        count: -1
    },
    [MapTileIDs.PORT_HURON]: {
        upgrades: [5, 6, 57],
        count: -1
    },
    [MapTileIDs.CHICAGO]: {
        upgrades: [298],
        count: -1
    },
    [MapTileIDs.CENTRALIA]: {
        upgrades: []
    },
    [MapTileIDs.DETROIT]: {
        upgrades: [294, 295],
        count: -1
    },
    [MapTileIDs.ERIE]: {
        upgrades: [14,619],
        count: -1
    },
    [MapTileIDs.CLEVELAND]: {
        upgrades: [291, 292, 293],
        count: -1
    },
    [MapTileIDs.FORT_WAYNE]: {
        upgrades: [5, 6, 57],
        count: -1
    },
    [MapTileIDs.CINCINNATI]: {
        upgrades: [291, 292, 293],
        count: -1
    },
    [MapTileIDs.WHEELING]: {
        upgrades: [14],
        count: -1
    },
    [MapTileIDs.SALAMANCA]: {
        upgrades: []
    },
    [MapTileIDs.HOMEWOOD]: {
        upgrades: []
    },
    [MapTileIDs.HUNTINGTON]: {
        upgrades: []
    },
    [MapTileIDs.C7]: {
        upgrades: [],
        count: -1
    },
    [MapTileIDs.A15]: {
        upgrades: [],
        count: -1
    },
    5: {
        upgrades: [14, 15, 619],
        count: 3
    },
    6: {
        upgrades: [14, 15, 619],
        count: 4
    },
    7: {
        upgrades: [18, 21, 22, 26, 27, 28, 29, 30, 31],
        count: -1
    },
    8: {
        upgrades: [16, 17, 19, 21, 22, 23, 24, 25, 28, 29, 30, 31],
        count: -1
    },
    9: {
        upgrades: [18, 19, 20, 23, 24, 26, 27],
        count: -1
    },
    14: {
        upgrades: [611],
        count: 4
    },
    15: {
        upgrades: [611],
        count: 5
    },
    16: {
        upgrades: [43, 70],
        count: 2
    },
    17: {
        upgrades: [47],
        count: 1
    },
    18: {
        upgrades: [43],
        count: 1
    },
    19: {

        upgrades: [45, 46],
        count: 2
    },
    20: {
        upgrades: [44, 47],
        count: 2
    },
    21: {
        upgrades: [46],
        count: 1
    },
    22: {
        upgrades: [45],
        count: 1
    },
    23: {
        upgrades: [41, 43, 45, 47],
        count: 4
    },
    24: {
        upgrades: [42, 43, 46, 47],
        count: 4
    },
    25: {
        upgrades: [40, 45, 46],
        count: 2
    },
    26: {
        upgrades: [42, 44, 45],
        count: 1
    },
    27: {
        upgrades: [41, 44, 46],
        count: 1
    },
    28: {
        upgrades: [39, 43, 46, 70],
        count: 1
    },
    29: {
        upgrades: [39, 43, 45, 70],
        count: 1
    },
    30: {
        upgrades: [42, 70],
        count: 1
    },
    31: {
        upgrades: [41, 70],
        count: 1
    },
    39: {
        count: 1
    },
    40: {
        count: 1
    },
    41: {
        count: 2
    },
    42: {
        count: 2
    },
    43: {
        count: 2
    },
    44: {
        count: 1
    },
    45: {
        count: 2
    },
    46: {
        count: 2
    },
    47: {
        count: 2
    },
    51: {
        count: 2
    },
    57: {
        upgrades: [14, 15, 619],
        count: 4
    },
    70: {
        count: 1
    },
    290: {
        count: 1
    },
    291: {
        upgrades: [294, 295, 296],
        count: 1
    },
    292: {
        upgrades: [294, 295, 296],
        count: 1
    },
    293: {
        upgrades: [294, 295, 296],
        count: 1
    },
    294: {
        upgrades: [297],
        count: 2
    },
    295: {
        upgrades: [297],
        count: 2
    },
    296: {
        upgrades: [297],
        count: 1
    },
    297: {
        upgrades: [290],
        count: 2
    },
    298: {
        upgrades: [299],
        count: 1
    },
    299: {
        upgrades: [300],
        count: 1
    },
    300: {
        count: 1
    },
    611: {
        upgrades: [51],
        count: 1
    },
    619: {
        upgrades: [611],
        count: 3
    }
};

class TileManifest extends Serializable {
    constructor(definition) {
        super();
        definition = definition || {};
        this.TileColorIDs = TileColorIDs;

        this.availableTiles = ko.observable(definition.availableTiles || _.mapValues(Manifest, 'count'));
        this.displayTilesById = ko.computed(() => {
            return _(TileDefinitions).map(definition => TileManifest.createTile(definition.id)).keyBy('id').value();
        });
        this.tilesByColor = ko.computed(() => {
            return _(TileDefinitions).map((tileDefinition) => {
                return {
                    id: tileDefinition.id,
                    tile: this.displayTilesById()[tileDefinition.id],
                    colorId: tileDefinition.colorId,
                    upgrades: Manifest[tileDefinition.id].upgrades,
                    remaining: this.availableTiles()[tileDefinition.id]
                }
            }).groupBy('colorId').value();
        });
        this.activeTileSet = ko.observable(TileColorIDs.YELLOW);
        this.activeTiles = ko.computed(() => {
            return this.tilesByColor()[this.activeTileSet()] || [];
        });

        this.popoverParams = {
            placement: 'right',
            content: '<div data-bind="template: { name: \'views/tileUpgradePopover\' }"></div>'
        };

    }

    toJSON() {
        const plainObject = super.toJSON();
        delete plainObject.popoverParams;
        delete plainObject.TileColorIDs;
        return plainObject;
    }

    setActiveTileSet(colorId) {
        this.activeTileSet(colorId);
    }

    getUpgradesForTile(id) {
        return _(Manifest[id].upgrades || []).map((upgradeId) => {
            return {
                tile: this.displayTilesById()[upgradeId],
                remaining: this.availableTiles()[upgradeId]
            }
        }).value();
    }

    getTile(id, replacedId) {
        const numAvailable = this.availableTiles()[id];
        if (numAvailable === 0) {
            throw new ValidationError('No ' + id + ' tile available');
        }
        else if (numAvailable > 0) {
            this.availableTiles()[id] = numAvailable - 1;
        }

        if (replacedId) {
            const numReplacedAvailable = this.availableTiles()[replacedId];
            const isUnlimited = numReplacedAvailable === -1;
            if (!isUnlimited) {
                this.availableTiles()[replacedId] = numReplacedAvailable + 1;
            }
        }

        return TileManifest.createTile(id);
    }

    static getTileDefinition(id) {
        return TileDefinitions[id];
    }

    getTemplateName(id) {
        console.log("Get template name: " + id)
        return TileManifest.getTileDefinition(id).template || 'common';
    }

    static createTile(id) {
        const definition = _.clone(TileDefinitions[id]);
        definition['upgrades'] = Manifest[id].upgrades;
        return new Tile(definition);
    }
}

TileManifest.registerClass();

export default TileManifest;