'use strict';

const constants = require('./constants');

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
