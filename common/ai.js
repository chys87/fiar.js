'use strict';

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
    }

    run(board) {
        // Default behavior is random choice
        const width = board.width;
        const height = board.height;
        let choices = board.findBlanks();
        let l = choices.length;
        if (l)
            return choices[Math.floor(Math.random() * l)];
        else
            return null;
    }
};

const DonkeyAI = exports.DonkeyAI = class DonkeyAI extends AI {
    constructor(color, aggressiveness) {
        super(color);
        this.aggressiveness = aggressiveness || .5;
    }

    run(board) {
        let obvious = this.obviousMove(board);
        if (obvious)
            return obvious;

        const color = this.color;
        const w = board.width;
        const h = board.height;

        let best_score;
        let best_move;

        for (let i = 1; i <= h; ++i) {
            let nb = board.copy({deepcopyRows: i});
            for (let j = 1; j <= w; ++j) {
                if (board[i][j] != BLANK)
                    continue;
                nb[i][j] = color;
                let score = this.getScore(nb);
                if (best_score === undefined || score > best_score) {
                    best_score = score;
                    best_move = [i, j];
                }
                nb[i][j] = BLANK;
            }
        }

        return best_move || super.run(board);
    }

    getScore(board) {
        const color = this.color;
        const enemy = REVERSE_COLOR[color];

        let scoreBoard = {
            [BLACK]: {},
            [WHITE]: {},
        };

        const semilines = board.findSemiLines(5, 1);

        for (const clr of STONE_COLORS) {
            let scb = scoreBoard[clr];
            for (const sl of semilines[clr]) {
                let i = sl.i;
                let j = sl.j;
                let di = DIRECTIONS[sl.dir].i;
                let dj = DIRECTIONS[sl.dir].j;
                for (let k = 0; k < 5; ++k) {
                    if (board[i][j] == BLANK) {
                        const key = `${i},${j}`;
                        let stats = scb[key];
                        if (!stats)
                            scb[key] = stats = [0, 0, 0, 0, 0, 0];
                        stats[sl.cnt + (clr == enemy)] += 1;
                    }
                    i += di;
                    j += dj;
                }
            }
        }

        let scores = {
            [BLACK]: 0,
            [WHITE]: 0,
        };
        for (const clr of STONE_COLORS) {
            const scb = scoreBoard[clr];
            let res = 0;
            for (const key in scb) {
                const stats = scb[key];
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

    obviousMove(board) {
        const w = board.width;
        const h = board.height;
        const color = this.color;
        const enemy = REVERSE_COLOR[color];

        // An empty board. Place in the center
        if (board.isEmpty()) {
            let i = (h + 1) >>> 1;
            let j = (w + 1) >>> 1;
            if (board[i][j] == BLANK)
                return [i, j];
            if (board[i][j + 1] == BLANK)
                return [i, j + 1];
            if (board[i + 1][j] == BLANK)
                return [i + 1, j];
            if (board[i + 1][j + 1] == BLANK)
                return [i + 1, j + 1];
        }

        // Almost 5?
        for (const item of board.findSemiLines(5, 4)[color]) {
            let i = item.i;
            let j = item.j;
            let dir = DIRECTIONS[item.dir];
            let cnt = item.cnt;
            for (let k = 0; k < 5; ++k) {
                if (board[i + dir.i * k][j + dir.j * k] == BLANK)
                    return [i + dir.i * k, j + dir.j * k];
            }
        }

        return null;
    }
};
