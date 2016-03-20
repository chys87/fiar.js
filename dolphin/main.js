'use strict';

const fs = require('fs');
const AI = require('../common/ai').AI;
const Board = require('../common/board').Board;
const Scorer = require('./scorer').Scorer;
const C = require('../common/constants');
const BLANK = C.BLANK;
const BLACK = C.BLACK;
const WHITE = C.WHITE;
const WALL = C.WALL;

const dolphinAI = exports.dolphinAI = class dolphinAI extends AI {
    constructor(color, debug) {
        super(color);
        this._df = null;
        if (debug)
            this._df = fs.createWriteStream('/tmp/dolphin-debug.txt');
    }

    run(board) {
        return this.obviousMove(board) || this.dolphinMove(board);
    }

    dolphinMove(board) {
        const color = this.color;
        const enemy = this.enemy;
        const w = board.width;
        const h = board.height;

        if (this._df)
            this._dumpBoard(board);

        let scorer = new Scorer(board);

        let best_score = -Infinity;
        let best_move;

        for (let pos of board.yieldBlanks()) {
            let i = pos[0], j = pos[1];

            scorer.changeColor(board, i, j, color);
            let scoreMe = scorer.scoreFor(color, false);
            let scoreEnemy = scorer.scoreFor(enemy, true);
            let score = scoreMe - scoreEnemy;
            scorer.changeColor(board, i, j, BLANK);

            if (this._df) {
                let s = `${i} ${j} ${scoreMe} ${scoreEnemy}\n`;
                this._df.write(s);
            }

            if (score > best_score) {
                best_score = score;
                best_move = pos;
            }
        }

        return best_move || super.run(board);
    }

    _dumpBoard(board) {
        const w = board.width;
        const h = board.height;
        let s = '  ';
        for (let j = 1; j <= w; ++j)
            s += `${j%10} `;
        s += '\n';
        for (let i = 1; i <= h; ++i) {
            s += `${i%10} `;
            for (let j = 1; j <= w; ++j) {
                if (board[i][j] == BLACK)
                    s += '* ';
                else if (board[i][j] == WHITE)
                    s += 'o ';
                else if (board[i][j] == WALL)
                    s += 'X ';
                else
                    s += '  ';
            }
            s += '\n';
        }
        this._df.write(s);
    }
};
