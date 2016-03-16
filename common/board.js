'use strict';

const constants = require('./constants');
const BLANK = constants.BLANK;
const BLACK = constants.BLACK;
const WHITE = constants.WHITE;
const DIRECTIONS = constants.DIRECTIONS;
const WALL = constants.WALL;

class Board extends Array {
    constructor(width, height) {
        super(height + 2);

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
                    let deltai = DIRECTIONS[dir][0];
                    let deltaj = DIRECTIONS[dir][1];
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
        return {blacks, whites};
    }
};

exports.Board = Board;
