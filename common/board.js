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

    *yieldVirtualLines() {
        const w = this.width;
        const h = this.height;

        // top
        for (let j = 1; j <= w; ++j) {
            yield {i: 1, j, dir: C.DOWN, l: h};
            yield {i: 1, j, dir: C.RIGHTDOWN, l: Math.min(w - j + 1, h)};
            yield {i: 1, j, dir: C.LEFTDOWN, l: Math.min(j, h)};
        }

        // RIGHT
        for (let i = 1; i <= h; ++i)
            yield {i, j: 1, dir: C.RIGHT, l: w};

        // LEFTDOWN, RIGHTDOWN from right/left
        for (let i = 2; i <= h; ++i) {
            yield {i, j: 1, dir: C.RIGHTDOWN, l: Math.min(w, h - i + 1)};
            yield {i, j: w, dir: C.LEFTDOWN, l: Math.min(w, h - i + 1)};
        }
    }

    *yieldLines(min_cnt) {
        yield* this.yieldSemiLines(min_cnt, min_cnt);
    }

    *yieldSemiLines(length, threshold) {
        const w = this.width;
        const h = this.height;

        for (const item of this.yieldVirtualLines()) {
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
};
