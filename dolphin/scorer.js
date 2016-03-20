'use strict';

const Board = require('../common/board').Board;
const C = require('../common/constants');
const BLANK = C.BLANK;
const BLACK = C.BLACK;
const WHITE = C.WHITE;
const WALL = C.WALL;
const DIRECTIONS = C.DIRECTIONS;
const REVERSE_COLOR = C.REVERSE_COLOR;
const STONE_COLORS = C.STONE_COLORS;

const Scorer = exports.Scorer = class Scorer {
    constructor(board) {
        const w = this.w = board.width;
        const h = this.h = board.height;
        this.scoreBoard = [new Array(h + 1), new Array(h + 1)];
        for (const color of STONE_COLORS) {
            let scb = this.scoreBoard[color];
            for (let i = 1; i <= h; ++i) {
                scb[i] = new Array(w + 1);
                for (let j = 1; j <= w; ++j)
                    scb[i][j] = [0, 0, 0, 0, 0, 0];
            }
        }

        this._changeColorRefreshPositionsCache = new Map;

        this.initializeScores(board);
    }

    scoreFor(color, nextMove) {
        const w = this.w;
        const h = this.h;
        const scb = this.scoreBoard[color];
        let res = 0;

        if (nextMove) {

            for (let i = 1; i <= h; ++i) {
                const scbRow = scb[i];
                for (let j = 1; j <= w; ++j) {
                    const stats = scbRow[j];
                    if (stats[4] || stats[5])
                        res += 1000000;
                    else if (stats[3] >= 2)
                        res += 1000000 / 2;
                    else if (stats[3] + stats[2] >= 2)
                        res += 50000;
                    else
                        res += (stats[3] + stats[2] / 3) * 100 + stats[1] * 2;
                }
            }

        } else {

            for (let i = 1; i <= h; ++i) {
                const scbRow = scb[i];
                for (let j = 1; j <= w; ++j) {
                    const stats = scbRow[j];
                    if (stats[5])
                        res += 1000000;
                    else if (stats[4] >= 2)
                        res += 1000000;
                    else if (stats[4] + stats[3] >= 2)
                        res += 50000;
                    else
                        res += (stats[4] * 2 + stats[3]) * 100 + stats[2] * 8 + stats[1];
                }
            }

        }

        return res;
    }

    initializeScores(board) {
        for (const vl of board.getVirtualLines())
            this.markForVirtualLine(board, vl, 1);
    }

    changeColor(board, i, j, color) {
        if (board[i][j] == color)
            return;
        this.markFor(board, i, j, -1);
        board[i][j] = color;
        this.markFor(board, i, j, 1);
    }

    markFor(board, i, j, add) {
        for (const vl of board.getVirtualLinesFor(i, j))
            this.markForVirtualLine(board, vl, add);
    }

    markForVirtualLine(board, vl, add) {
        let l = vl.l;
        if (l < 5)
            return;
        let dir = DIRECTIONS[vl.dir];
        let di = dir.i;
        let dj = dir.j;
        let i = vl.i;
        let j = vl.j;
        let ii = i;
        let jj = j;

        let stats = [0, 0, 0, 0];
        for (let k = 0; k < 4; ++k) {
            stats[board[ii][jj]]++;
            ii += di;
            jj += dj;
        }

        for (let k = 4; k < l; ++k) {
            stats[board[ii][jj]]++;
            ii += di;
            jj += dj;

            if (stats[WALL] == 0) {
                for (const color of STONE_COLORS) {
                    if (stats[REVERSE_COLOR[color]] == 0 && stats[BLANK]) {
                        let scbColor = this.scoreBoard[color];
                        const count = stats[color];
                        for (let ki = i, kj = j, k = 0; k < 5; ++k, ki += di, kj += dj)
                            if (board[ki][kj] == BLANK)
                                scbColor[ki][kj][count] += add;
                    }
                }
            }

            stats[board[i][j]]--;
            i += di;
            j += dj;
        }
    }
};
