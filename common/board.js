'use strict';

const constants = require('./constants');
const BLANK = constants.BLANK;
const BLACK = constants.BLACK;
const WHITE = constants.WHITE;
const DIRECTIONS = constants.DIRECTIONS;
const WALL = constants.WALL;

class Board extends Array {
    constructor(width, height, options) {
        super(height + 2);

        if (options && options.internal)
            return;

        let sentinel_row = new Uint8Array(width + 2);
        sentinel_row.fill(WALL);
        this[0] = this[height + 1] = sentinel_row;

        for (let i = 1; i <= height; ++i) {
            let row = this[i] = new Uint8Array(width + 2);
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
                res[i] = Uint8Array.from(res[i]);
        } else {
            for (let i = 0; i < this.length; ++i)
                res[i] = Uint8Array.from(res[i]);
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
        let res = {
            [BLACK]: [],
            [WHITE]: [],
        };

        const w = this.width;
        const h = this.height;
        for (let dir in DIRECTIONS) {
            let di = DIRECTIONS[dir].i;
            let dj = DIRECTIONS[dir].j;
            for (let i = 1; i <= h; ++i) {
                let iEnd = i + di * (length - 1);
                if (iEnd > h || iEnd < 1)
                    continue;
                for (let j = 1; j <= w; ++j) {
                    let jEnd = j + dj * (length - 1);
                    if (jEnd > w || jEnd < 1)
                        continue;
                    let counts = {[BLACK]: 0, [WHITE]: 0, [BLANK]: 0, [WALL]: 0};
                    for (let k = 0; k < length; ++k)
                        counts[this[i + di * k][j + dj * k]]++;
                    if (counts[WALL] == 0) {
                        if (counts[BLACK] >= threshold && counts[WHITE] == 0) {
                            res[BLACK].push({i, j, dir, cnt: counts[BLACK]});
                        } else if (counts[WHITE] >= threshold && counts[BLACK] == 0) {
                            res[WHITE].push({i, j, dir, cnt: counts[WHITE]});
                        }
                    }
                }
            }
        }
        return res;
    }
};

exports.Board = Board;
