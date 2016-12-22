'use strict';

const utils = require('./utils');
const C = require('./constants');
const BLANK = C.BLANK;
const WHITE = C.WHITE;
const BLACK = C.BLACK;
const WALL = C.WALL;
const STONE_COLORS = C.STONE_COLORS;
const REVERSE_COLOR = C.REVERSE_COLOR;
const DIRECTIONS = C.DIRECTIONS;

const AI = exports.AI = class AI {
    constructor(color) {
        this.color = color;
        this.enemy = REVERSE_COLOR[color];
    }

    run(board, callback) {
        callback(this.obviousMove(board) || this.randomMove(board));
    }

    randomMove(board) {
        // Random choice
        return utils.randomChooseFrom(board.yieldBlanks());
    }

    static victoryMove(board, color) {
        for (const item of board.yieldSemiLines(5, 4)) {
            if (item.color != color)
                continue;
            let i = item.i;
            let j = item.j;
            let dir = DIRECTIONS[item.dir];
            for (let k = 0; k < 5; ++k) {
                if (board[i + dir.i * k][j + dir.j * k] == BLANK)
                    return [i + dir.i * k, j + dir.j * k];
            }
        }
        return null;
    }

    obviousMove(board) {
        const w = board.width;
        const h = board.height;
        const color = this.color;
        const enemy = this.enemy;

        // An empty board. Place in the center
        if (board.isEmpty()) {
            let i = (h + 1) >>> 1;
            let j = (w + 1) >>> 1;
            for (let di of [0, 1, -1])
                for (let dj of [0, 1, -1])
                    if (board[i + di][j + dj] == BLANK)
                        return [i + di, j + dj];
        }

        return AI.victoryMove(board, color);
    }
};

const DonkeyAI = exports.DonkeyAI = class DonkeyAI extends AI {
    constructor(color, aggressiveness) {
        super(color);
        this.aggressiveness = aggressiveness || .5;
    }

    run(board, callback) {
        let obvious = this.obviousMove(board);
        if (obvious)
            return callback(obvious);

        const color = this.color;
        const w = board.width;
        const h = board.height;

        let best_score = -Infinity;
        let best_move;

        for (let pos of board.yieldBlanks()) {
            let i = pos[0], j = pos[1];
            board[i][j] = color;
            let score = this.getScore(board);
            if (score > best_score) {
                best_score = score;
                best_move = pos;
            }
            board[i][j] = BLANK;
        }

        if (best_move)
            return callback(obvious);
        else
            return super.run(board, callback);
    }

    getScore(board) {
        const color = this.color;
        const enemy = this.enemy;

        let scoreBoard = {
            [BLACK]: new Map,
            [WHITE]: new Map,
        };

        for (const sl of board.yieldSemiLines(5, 1)) {
            const clr = sl.color;
            let scb = scoreBoard[clr];
            let i = sl.i;
            let j = sl.j;
            let di = DIRECTIONS[sl.dir].i;
            let dj = DIRECTIONS[sl.dir].j;
            for (let k = 0; k < 5; ++k) {
                if (board[i][j] == BLANK) {
                    const key = `${i},${j}`;
                    let stats = scb.get(key);
                    if (!stats)
                        scb.set(key, stats = [0, 0, 0, 0, 0, 0]);
                    stats[sl.cnt + (clr == enemy)] += 1;
                }
                i += di;
                j += dj;
            }
        }

        let scores = {
            [BLACK]: 0,
            [WHITE]: 0,
        };
        for (const clr of STONE_COLORS) {
            const scb = scoreBoard[clr];
            let res = 0;
            for (const stats of scb.values()) {
                if (stats[5])
                    res += 1000000;
                else if (stats[4] >= 2)
                    res += 1000000;
                else if (stats[4] + stats[3] >= 2)
                    res += 50000;
                else
                    res += (stats[4] * 2 + stats[3]) * 100 + stats[2] * 8 + stats[1];
            }
            scores[clr] = res;
        }

        // Factor in [0.2, 1]. The smaller, the more agressive.
        const factor = 1 - this.aggressiveness * .8;
        return scores[color] - scores[enemy] * factor;
    }
};
