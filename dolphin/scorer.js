'use strict';

const Board = require('../common/board').Board;
const C = require('../common/constants');
const utils = require('../common/utils');
const AttrMinHeap = utils.AttrMinHeap;
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
        this.scoreBoard = utils.makeNestedArray([2, h + 1, w + 1, 6], 0);

        this._rowScoreCache = [new Array(h + 1), new Array(h + 1)];

        this.initializeScores(board);
    }

    scoreForNextMove(board, color) {
        let bestScore = -Infinity;
        let bestMove;

        for (const item of this.guessLikelyMoves(board, color, Math.max(this.w, this.h), 0.01)) {
            let i = item.i, j = item.j;

            this.changeColor(board, i, j, color);
            let score = this.scoreForMoved(board, color);
            this.changeColor(board, i, j, BLANK);

            if (score > bestScore) {
                bestScore = score;
                bestMove = [i, j];
                if (score == Infinity)
                    break;
            }
        }

        if (bestMove)
            return {i: bestMove[0], j: bestMove[1], score: bestScore};
        else
            return null;
    }

    scoreForMoved(board, color) {
        const w = this.w;
        const h = this.h;
        const scb = this.scoreBoard[color];
        let res = 0;

        for (let i = 1; i <= h; ++i) {
            let rowRes = this.rowScoreForMoved(board, color, i);
            if (rowRes == Infinity)
                return rowRes;
            res += rowRes;
        }

        return res;
    }

    rowScoreForMoved(board, color, i) {
        let res = this._rowScoreCache[color][i];
        if (res !== undefined)
            return res;

        res = 0;
        const row = board[i];
        const scbRow = this.scoreBoard[color][i];
        for (let j = 1, w = this.w; j <= w; ++j) {
            const stats = scbRow[j];
            if (stats[5]) {
                res = Infinity;
                break;
            } else if (stats[4] >= 2)
                res += 1000000;
            else if (stats[4] + stats[3] >= 2)
                res += 50000;
            else
                res += stats[4] * 20000 + stats[3] * 100 + stats[2] * 8 + stats[1];
        }
        this._rowScoreCache[color][i] = res;
        return res;
    }

    guessLikelyMoves(board, color, maxReturns, cutThreshold) {
        const w = this.w;
        const h = this.h;

        const enemy = REVERSE_COLOR[color];

        if (!maxReturns || maxReturns < 1)
            maxReturns = 1;
        let heap = new AttrMinHeap(maxReturns, 'weight');

        const scb = this.scoreBoard;
        const scb0 = scb[0];
        const scb1 = scb[1];

        for (let pos of board.yieldBlanks()) {
            let i = pos[0], j = pos[1];
            let st0 = scb0[i][j];
            let st1 = scb1[i][j];

            if (st0[4] || st1[4]) // Only sane choice
                return [{i, j, weight: Infinity}];

            let weight =
                        st0[5] * 1000000 + st0[4] * 20000 + st0[3] * 100 + st0[2] * 8 + st0[1] +
                        st1[5] * 1000000 + st1[4] * 20000 + st1[3] * 100 + st1[2] * 8 + st1[1];
            if (weight)
                heap.push({i, j, weight});
        }

        let array = heap.slice(0, heap.size);
        array.sort((a, b) => b.weight - a.weight);

        if (array.length) {
            let threshold = array[0].weight * cutThreshold;
            let k = array.length;
            while (k && array[k - 1].weight < threshold)
                --k;
            if (k < array.length)
                array.length = k;
        }

        return array;
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

        let changedColor = [false, false];

        for (let k = 4; k < l; ++k) {
            stats[board[ii][jj]]++;
            ii += di;
            jj += dj;

            if (stats[WALL] == 0) {
                for (const color of STONE_COLORS) {
                    if (stats[REVERSE_COLOR[color]] == 0) {
                        changedColor[color] = true;
                        let scbColor = this.scoreBoard[color];
                        const count = stats[color];
                        for (let ki = i, kj = j, k = 0; k < 5; ++k, ki += di, kj += dj)
                            scbColor[ki][kj][count] += add;
                    }
                }
            }

            stats[board[i][j]]--;
            i += di;
            j += dj;
        }

        // Invalidate cache
        for (const color of STONE_COLORS) {
            if (changedColor[color]) {
                if (di == 0)
                    this._rowScoreCache[color][vl.i] = undefined;
                else if (di == 1)
                    this._rowScoreCache[color].fill(undefined, vl.i, vl.i + l);
                else
                    throw RangeError(`Bad di value: ${di}`);
            }
        }
    }
};
