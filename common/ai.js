'use strict';

const C = require('./constants');

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
                if (board[i][j] != C.BLANK)
                    continue;
                nb[i][j] = color;
                let score = this.getScore(nb);
                if (best_score === undefined || score > best_score) {
                    best_score = score;
                    best_move = [i, j];
                }
                nb[i][j] = C.BLANK;
            }
        }

        return best_move || super.run(board);
    }

    getScore(board) {
        const color = this.color;
        const enemy = C.REVERSE_COLOR[color];

        let scoreBoard = {
            [C.BLACK]: {},
            [C.WHITE]: {},
        };

        const semilines = board.findSemiLines(5, 1);

        for (const clr of [C.BLACK, C.WHITE]) {
            for (const sl of semilines[clr]) {
                let i = sl.i;
                let j = sl.j;
                let di = C.DIRECTIONS[sl.dir].i;
                let dj = C.DIRECTIONS[sl.dir].j;
                for (let k = 0; k < 5; ++k) {
                    const key = `${i},${j}`;
                    if (!scoreBoard[clr][key])
                        scoreBoard[clr][key] = [0, 0, 0, 0, 0, 0];
                    scoreBoard[clr][key][sl.cnt + (clr == enemy)] += 1;
                    i += di;
                    j += dj;
                }
            }
        }

        let scores = {
            [C.BLACK]: 0,
            [C.WHITE]: 0,
        };
        for (const clr of [C.BLACK, C.WHITE]) {
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
                    res += (stats[4] + stats[3]) * 100 + stats[2] * 8 + stats[1];
            }
            scores[clr] = res;
        }

        // Factor in [0.5, 1]. The smaller, the more agressive.
        const factor = 1 - this.aggressiveness / 2;
        return scores[color] - scores[enemy] * factor;
    }

    obviousMove(board) {
        const w = board.width;
        const h = board.height;
        const color = this.color;
        const enemy = C.REVERSE_COLOR[color];

        // An empty board. Place in the center
        if (board.isEmpty()) {
            let i = (h + 1) >>> 1;
            let j = (w + 1) >>> 1;
            if (board[i][j] == C.BLANK)
                return [i, j];
            if (board[i][j + 1] == C.BLANK)
                return [i, j + 1];
            if (board[i + 1][j] == C.BLANK)
                return [i + 1, j];
            if (board[i + 1][j + 1] == C.BLANK)
                return [i + 1, j + 1];
        }

        // Almost 5?
        for (const item of board.findSemiLines(5, 4)[color]) {
            let i = item.i;
            let j = item.j;
            let dir = C.DIRECTIONS[item.dir];
            let cnt = item.cnt;
            for (let k = 0; k < 5; ++k) {
                if (board[i + dir.i * k][j + dir.j * k] == C.BLANK)
                    return [i + dir.i * k, j + dir.j * k];
            }
        }

        return null;
    }
};
