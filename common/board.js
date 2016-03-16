'use strict';

const constants = require('./constants');
const BLANK = constants.BLANK;
const BLACK = constants.BLACK;
const WHITE = constants.WHITE;
const DIRECTIONS = constants.DIRECTIONS;
const WALL = constants.WALL;

const Board = exports.Board = class Board extends Array {
    constructor(width, height, options) {
        super(height + 2);

        if (options && options.internal)
            return;

        let sentinel_row = new Array(width + 2);
        sentinel_row.fill(WALL);
        this[0] = this[height + 1] = sentinel_row;

        for (let i = 1; i <= height; ++i) {
            let row = this[i] = new Array(width + 2);
            row.fill(0);
            row[0] = row[width + 1] = WALL;
        }
    }

    get width() {
        return this[0].length - 2;
    }
    get height() {
        return this.length - 2;
    }

    copy(options) {
        let res = new Board(this.width, this.height, {internal: true});
        for (let i = 0; i < this.length; ++i)
            res[i] = this[i];
        if (options && options.deepcopyRows.length) {
            for (let i of options.deepcopyRows)
                res[i] = Array.from(res[i]);
        } else {
            for (let i = 0; i < this.length; ++i)
                res[i] = Array.from(res[i]);
        }
        return res;
    }

    findBlanks() {
        let blanks = [];

        const width = this.width;
        const height = this.height;
        for (let i = 1; i <= height; ++i)
            for (let j = 1; j <= width; ++j)
                if (this[i][j] == BLANK)
                    blanks.push([i, j]);

        return blanks;
    }

    countColor(color) {
        let cnt = 0;
        for (let row of this) {
            for (let cell of row)
                cnt += (cell == color);
        }
        return cnt;
    }

    isEmpty() {
        return this.every(row => row.every(cell => cell != BLACK && cell != WHITE));
    }

    findLines(min_cnt) {
        if (!min_cnt)
            min_cnt = 3;

        let blacks = [];
        let whites = [];
        const width = this.width;
        const height = this.height;
        for (let i = 1; i <= height; ++i) {
            for (let j = 1; j <= width; ++j) {
                const cur = this[i][j];
                if (cur != WHITE && cur != BLACK)
                    continue;
                for (let dir in DIRECTIONS) {
                    let deltai = DIRECTIONS[dir].i;
                    let deltaj = DIRECTIONS[dir].j;
                    let ii = i, jj = j;
                    let cnt = 0;
                    do {
                        ii += deltai;
                        jj += deltaj;
                        ++cnt;
                    } while (this[ii][jj] == cur);
                    if (cnt >= min_cnt) {
                        if (cur == BLACK)
                            blacks.push({i, j, dir, cnt});
                        else
                            whites.push({i, j, dir, cnt});
                    }
                }
            }
        }
        return {
            [BLACK]: blacks,
            [WHITE]: whites,
        };
    }

    findSemiLines(length, threshold) {
        let blacks = [];
        let whites = [];

        const w = this.width;
        const h = this.height;
        for (let dir in DIRECTIONS) {
            let di = DIRECTIONS[dir].i;
            let dj = DIRECTIONS[dir].j;

            let iLo = 1, iHi = h;
            let jLo = 1, jHi = w;

            if (di < 0)
                iLo = length;
            else if (di > 0)
                iHi = h - length + 1;
            if (dj < 0)
                jLo = length;
            else if (dj > 0)
                jHi = w - length + 1;

            for (let i = iLo; i <= iHi; ++i) {
                for (let j = jLo; j <= jHi; ++j) {
                    let counts = [0, 0, 0, 0];
                    let ii = i, jj = j;
                    for (let k = 0; k < length; ++k) {
                        counts[this[ii][jj]]++;
                        ii += di;
                        jj += dj;
                    }
                    if (counts[WALL] == 0) {
                        if (counts[BLACK] >= threshold && counts[WHITE] == 0)
                            blacks.push({i, j, dir, cnt: counts[BLACK]});
                        else if (counts[WHITE] >= threshold && counts[BLACK] == 0)
                            whites.push({i, j, dir, cnt: counts[WHITE]});
                    }
                }
            }
        }
        return {
            [BLACK]: blacks,
            [WHITE]: whites,
        };
    }
};
