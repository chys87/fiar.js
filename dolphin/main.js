'use strict';

const AI = require('../common/ai').AI;
const Board = require('../common/board').Board;
const Scorer = require('./scorer').Scorer;
const utils = require('../common/utils');
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
    constructor(color, options) {
        super(color);
        const simple = (options == 'simple');
        this._simple = simple;
        this.dolphinMove = simple ? this.dolphinMoveSimple.bind(this) : this.dolphinMoveSearch.bind(this);
    }

    run(board, callback) {
        const action = this.obviousMove(board) || this.dolphinMove(board);
        if (action)
            callback(action);
        return super.run(board, callback);
    }

    dolphinMoveSearch(board) {
        const color = this.color;
        const enemy = this.enemy;
        const w = board.width;
        const h = board.height;

        let scorer = new Scorer(board);
        let searchHeapSize = w * h;
        let localHeapSize = Math.max(w, h);

        let searchHeap = new utils.AttrMinHeap(searchHeapSize, 'score');

        let startTime = Date.now();
        let endTime = startTime + 2000;
        for (let pos of board.yieldBlanks()) {
            let i = pos[0], j = pos[1];

            scorer.changeColor(board, i, j, color);
            let scoreMe = scorer.scoreForMoved(board, color);
            if (scoreMe == Infinity)
                return [i, j];
            let scoreEnemyInfo = scorer.scoreForNextMove(board, enemy);
            let score = scoreMe - (scoreEnemyInfo ? scoreEnemyInfo.score : 0);
            scorer.changeColor(board, i, j, BLANK);

            if (!scoreEnemyInfo || scoreEnemyInfo.score < Infinity)
                searchHeap.push({
                    moves: [{
                        i, j,
                        ei: scoreEnemyInfo && scoreEnemyInfo.i, ej: scoreEnemyInfo && scoreEnemyInfo.j,
                    }],
                    score,
                });
        }
        let stepTime = Date.now() - startTime;

        while (endTime - Date.now() <= stepTime) {
            // Have results converged?
            let candidates = new Set;
            for (const item of searchHeap) {
                let i = item.moves[0].i, j = item.moves[0].j;
                candidates.add(`${i},${j}`);
            }
            if (candidates.size == 1) {
                let pos = candidates.keys()[0].split(',');
                return [+pos[0], +pos[1]];
            }

            let newHeap = new utils.AttrMinHeap(searchHeapSize, 'score');

            let stepBeginTime = Date.now();
            for (const item of searchHeap) {
                if (Date.now() >= endTime)
                    break;
                for (const move of item.moves) {
                    scorer.changeColor(board, move.i, move.j, color);
                    if (move.ei && move.ej)
                        scorer.changeColor(board, move.ei, move.ej, enemy);
                }

                let localHeap = new utils.AttrMinHeap(localHeapSize, 'score');

                for (let pos of board.yieldBlanks()) {
                    let i = pos[0], j = pos[1];

                    scorer.changeColor(board, i, j, color);
                    let scoreMe = scorer.scoreForMoved(board, color);
                    if (scoreMe == Infinity)
                        return [item.moves[0].i, item.moves[0].j];
                    let scoreEnemyInfo = scorer.scoreForNextMove(board, enemy);
                    let score = scoreMe - (scoreEnemyInfo ? scoreEnemyInfo.score : 0);
                    scorer.changeColor(board, i, j, BLANK);

                    if (!scoreEnemyInfo || scoreEnemyInfo.score < Infinity) {
                        let moves = item.moves.slice();
                        moves.push({
                            i, j,
                            ei: scoreEnemyInfo && scoreEnemyInfo.i, ej: scoreEnemyInfo && scoreEnemyInfo.j,
                        });
                        localHeap.push({moves, score});
                    }
                }

                for (let heapItem of localHeap)
                    newHeap.push(heapItem);

                for (const move of item.moves) {
                    scorer.changeColor(board, move.i, move.j, BLANK);
                    if (move.ei && move.ej)
                        scorer.changeColor(board, move.ei, move.ej, BLANK);
                }
            }
            if (Date.now() >= endTime || newHeap.size == 0)
                break;
            searchHeap = newHeap;
            let lastStepTime = Date.now() - stepBeginTime;
            stepTime = stepTime * .5 + lastStepTime * .5;
        }

        let bestMove;
        let bestScore = -Infinity;
        for (let item of searchHeap) {
            if (item.score > bestScore) {
                bestScore = item.score;
                bestMove = [item.moves[0].i, item.moves[0].j];
            }
        }
        return bestMove;
    }

    dolphinMoveSimple(board) {
        const color = this.color;
        const enemy = this.enemy;
        const w = board.width;
        const h = board.height;

        let scorer = new Scorer(board);

        let best_score = -Infinity;
        let best_move;

        for (let pos of board.yieldBlanks()) {
            let i = pos[0], j = pos[1];

            scorer.changeColor(board, i, j, color);
            let scoreMe = scorer.scoreForMoved(board, color);
            let scoreEnemyInfo = (scoreMe == Infinity) ? null : scorer.scoreForNextMove(board, enemy);
            let score = scoreMe - (scoreEnemyInfo ? scoreEnemyInfo.score : 0);
            scorer.changeColor(board, i, j, BLANK);

            if (score > best_score) {
                best_score = score;
                best_move = pos;
            }
        }

        return best_move;
    }
};
