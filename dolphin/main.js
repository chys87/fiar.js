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
const REVERSE_COLOR = C.REVERSE_COLOR;
const Heap = require('../common/utils').Heap;

const scoreHeap = class scoreHeap extends Heap {
    cmp(a, b) {
        return a.score < b.score;
    }
};

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

    dolphinStep(scorer, board, color, maxWidth, maxDepth) {
        let victoryMove = AI.victoryMove(board, color);
        if (victoryMove)
            return {i: victoryMove[0], j: victoryMove[1], score: Infinity};

        const enemy = REVERSE_COLOR[color];
        const w = board.width;
        const h = board.height;

        if (maxDepth <= 1)
            maxWidth = 1;
        else
            maxWidth = Math.max(maxWidth, 1);

        let heap = new scoreHeap(maxWidth);

        for (let pos of board.yieldBlanks()) {
            let i = pos[0], j = pos[1];

            scorer.changeColor(board, i, j, color);
            let scoreMe = scorer.scoreFor(color, false);
            let scoreEnemy = scorer.scoreFor(enemy, true);
            let score = scoreMe - scoreEnemy;
            scorer.changeColor(board, i, j, BLANK);

            heap.push({i, j, score});
        }

        if (!heap.size)
            return null;

        if (maxDepth <= 1) {
            // Simply find best score
            while (heap.size > 1)
                heap.pop();
            return heap[0];
        } else {
            let nextMaxWidth = maxWidth >>> 1;
            let nextMaxDepth = maxDepth - 1;

            let best_score = -Infinity;
            let best_move;
            for (const item of heap) {
                let i = item.i;
                let j = item.j;
                scorer.changeColor(board, i, j, color);
                let enemyBestMoveInfo = this.dolphinStep(scorer, board, enemy, nextMaxWidth, nextMaxDepth);
                scorer.changeColor(board, i, j, BLANK);
                if (!enemyBestMoveInfo)
                    continue;
                let score = -enemyBestMoveInfo.score;
                if (score > best_score) {
                    best_score = score;
                    best_move = [enemyBestMoveInfo.i, enemyBestMoveInfo.j];
                }
            }
            if (!best_move)
                return null;
            else
                return {i: best_move[0], j: best_move[1], score: best_score};
        }

    }

    _dolphinMove(board) {
        let scorer = new Scorer(board);
        let res = this.dolphinStep(scorer, board, this.color, 8, 3);
        if (res)
            return [res.i, res.j];
        else
            return null;
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
            let scoreMe = scorer.scoreForMoved(color);
            let scoreEnemyInfo = scorer.scoreForNextMove(board, enemy);
            let score = scoreMe - (scoreEnemyInfo.score || 0);
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
