'use strict';

const C = require('./constants');
const BLANK = C.BLANK;
const BLACK = C.BLACK;
const WHITE = C.WHITE;
const DIRECTIONS = C.DIRECTIONS;
const WALL = C.WALL;

const Board = exports.Board = class Board extends Array {
    constructor(width, height, options) {
        super(height + 2);

        if (options && options.internal)
            return;

        let row = new Array(width + 2);
        row.fill(WALL);
        this[0] = this[height + 1] = row;

        row = new Array(width + 2);
        row.fill(BLANK);
        row[0] = row[width + 1] = WALL;

        for (let i = 1; i <= height; ++i)
            this[i] = Array.from(row);
    }

    get width() {
        return this[0].length - 2;
    }
    get height() {
        return this.length - 2;
    }

    copy() {
        let res = new Board(this.width, this.height, {internal: true});

        let h = this.height;
        res[0] = res[h + 1] = this[0];

        for (let i = 1; i <= h; ++i)
            res[i] = Array.from(this[i]);

        return res;
    }

    *yieldBlanks() {
        for (let i = 1, h = this.height; i <= h; ++i) {
            const row = this[i];
            let j = 0;
            while ((j = row.indexOf(BLANK, j + 1)) >= 0)
                yield [i, j];
        }
    }

    hasBlanks() {
        return !this.yieldBlanks().next().done;
    }

    isEmpty() {
        for (const row of this)
            if (row.indexOf(BLACK) >= 0 || row.indexOf(WHITE) >= 0)
                return false;
        return true;
    }

    getVirtualLines() {
        if (this._virtualLinesCache)
            return this._virtualLinesCache;

        const w = this.width;
        const h = this.height;

        let key = `${w}-${h}`;
        let res = Board._virtualLinesCache.get(key);
        if (res) {
            this._virtualLinesCache = res;
            return res;
        }

        res = [];

        // top
        for (let j = 1; j <= w; ++j) {
            res.push({i: 1, j, dir: C.DOWN, l: h});
            res.push({i: 1, j, dir: C.RIGHTDOWN, l: Math.min(w - j + 1, h)});
            res.push({i: 1, j, dir: C.LEFTDOWN, l: Math.min(j, h)});
        }

        // RIGHT
        for (let i = 1; i <= h; ++i)
            res.push({i, j: 1, dir: C.RIGHT, l: w});

        // LEFTDOWN, RIGHTDOWN from right/left
        for (let i = 2; i <= h; ++i) {
            res.push({i, j: 1, dir: C.RIGHTDOWN, l: Math.min(w, h - i + 1)});
            res.push({i, j: w, dir: C.LEFTDOWN, l: Math.min(w, h - i + 1)});
        }

        Board._virtualLinesCache.set(key, res);
        this._virtualLinesCache = res;
        return res;
    }

    getVirtualLinesFor(i, j, extendLength) {
        if (!extendLength)
            extendLength = 5;

        const key = `${i}-${j}-${extendLength}`;
        let res = Board._getVirtualLinesForCache.get(key);
        if (res)
            return res;

        const w = this.width;
        const h = this.height;

        const extendLeftward = Math.min(extendLength - 1, j - 1);
        const extendRightward = Math.min(extendLength - 1, w - j);
        const extendTopward = Math.min(extendLength - 1, i - 1);
        const extendDownward = Math.min(extendLength - 1, h - i);
        const extendTopLeftward = Math.min(extendTopward, extendLeftward);
        const extendRightDownward = Math.min(extendRightward, extendDownward);
        const extendTopRightward = Math.min(extendTopward, extendRightward);
        const extendLeftDownward = Math.min(extendDownward, extendLeftward);

        res = [
            // RIGHT
            {i, j: j - extendLeftward, dir: C.RIGHT, l: extendLeftward + extendRightward + 1},
            // DOWN
            {i: i - extendTopward, j, dir: C.DOWN, l: extendTopward + extendDownward + 1},
            // RIGHTDOWN
            {i: i - extendTopLeftward, j: j - extendTopLeftward, dir: C.RIGHTDOWN, l: extendTopLeftward + extendRightDownward + 1},
            // LEFTDOWN
            {i: i - extendTopRightward, j: j + extendTopRightward, dir: C.LEFTDOWN, l: extendTopRightward + extendLeftDownward + 1},
        ];
        Board._getVirtualLinesForCache.set(key, res);
        return res;
    }

    static *yieldPositionsFromLine(i, j, dir, l) {
        const vd = C.DIRECTIONS[dir];
        const di = vd.i;
        const dj = vd.j;
        for (let k = 0; k < l; ++k) {
            yield [i, j];
            i += di;
            j += dj;
        }
    }

    yieldLines(min_cnt) {
        return this.yieldSemiLines(min_cnt, min_cnt);
    }

    *yieldSemiLines(length, threshold) {
        const w = this.width;
        const h = this.height;

        for (const item of this.getVirtualLines()) {
            let l = item.l;
            if (l < length)
                continue;

            let i = item.i;
            let j = item.j;
            let dir = item.dir;
            let di = DIRECTIONS[dir].i;
            let dj = DIRECTIONS[dir].j;

            let ii = i;
            let jj = j;

            let counts = [0, 0, 0, 0];

            for (let k = 0; k < length - 1; ++k) {
                counts[this[ii][jj]]++;
                ii += di;
                jj += dj;
            }

            for (let k = length - 1; k < l; ++k) {
                counts[this[ii][jj]]++;
                ii += di;
                jj += dj;

                if (counts[WALL] == 0) {
                    if (counts[BLACK] >= threshold && counts[WHITE] == 0)
                        yield {i, j, dir, cnt: counts[BLACK], color: BLACK};
                    else if (counts[WHITE] >= threshold && counts[BLACK] == 0)
                        yield {i, j, dir, cnt: counts[WHITE], color: WHITE};
                }

                counts[this[i][j]]--;
                i += di;
                j += dj;
            }
        }
    }

    serialize() {
        let w = this.width;
        let h = this.height;
        let s = '';
        for (let i = 1; i <= h; ++i) {
            let r = '';
            for (let j = 1; j <= w; ++j)
                r += ' ' + C.SERIALIZE_MAP[this[i][j]];
            r += '\n';
            s += r;
        }
        return s;
    }

    deserialize(s) {
        s.split('\n').forEach((line, i0) => {
            let i = i0 + 1;
            for (let j = 1, j0 = 1, l = line.length; j0 < l; j0 += 2, ++j) {
                let c = line[j0];
                let color = C.DESERIALIZE_MAP.get(c);
                if (color !== undefined)
                    this[i][j] = color;
                else if (c == ' ' || c == '\n')
                    ;
                else
                    throw RangeError(`Bad character ${c} in ${ARGS.load}`);
            }
        });
    }
};

Board._virtualLinesCache = new Map;
Board._getVirtualLinesForCache = new Map;
