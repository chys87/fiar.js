#!/usr/bin/env node

'use strict';

const yargs = require('yargs');

const Board = require('../common/board').Board;
const constants = require('../common/constants');

const DEFAULT_WIDTH = 15;
const DEFAULT_HEIGHT = 15;

const AI_DICT = {
    'random': ['../common/ai', 'AI'],
};
const DEFAULT_AI = 'random';

const ARGS = yargs
    .usage(`$0 [options...] [BLACK_AI [WHITE_AI]]

Available AIs: ${Object.keys(AI_DICT)}`)
    .option('width', {
        alias: 'w',
        describe: 'Width of the board',
        default: DEFAULT_WIDTH,
    })
    .option('height', {
        alias: 'h',
        describe: 'Height of the board',
        default: DEFAULT_HEIGHT,
    })
    .option('sleep', {
        alias: 's',
        describe: 'Sleep time between moves',
        default: 1000,
    })
    .help('help')
    .argv;

const black_ai_name = ARGS._[0] || DEFAULT_AI;
const white_ai_name = ARGS._[1] || DEFAULT_AI;
const black_ai_info = AI_DICT[black_ai_name];
const white_ai_info = AI_DICT[white_ai_name];

if (!black_ai_info) {
    console.error(`Unknown AI ${black_ai_name}`);
    process.exit(1);
}
if (!white_ai_info) {
    console.error(`Unknown AI ${white_ai_name}`);
    process.exit(1);
}

let black_ai_cls = require(black_ai_info[0])[black_ai_info[1]];
let white_ai_cls = require(white_ai_info[0])[white_ai_info[1]];

let ais = {
    [constants.BLACK]: new black_ai_cls(constants.BLACK),
    [constants.WHITE]: new white_ai_cls(constants.WHITE),
};

let board = new Board(ARGS.w, ARGS.h);

const write = process.stdout.write.bind(process.stdout);

function draw_screen(board) {
    let s = '\x1b[H';  // Move cursor to home
    const w = board.width;
    const h = board.height;
    s += 'X'.repeat(w * 4 + 4) + '\n';
    for (let i = 1; i <= h; ++i) {
        s += 'XX';
        for (let j = 1; j <= w; ++j)
            s += ' ' + constants.DISPLAY[board[i][j]] + ' ';
        s += 'XX\nXX' + ' '.repeat(w * 4) + 'XX\n';
    }
    s += 'X'.repeat(w * 4 + 4) + '\n';
    s += `${constants.DISPLAY[constants.BLACK]}: BLACK\n`;
    s += `${constants.DISPLAY[constants.WHITE]}: WHITE\n`;
    write(s);
}

write('\x1b[3J\x1b[H\x1b[2J'); // Clear screen

let turn = constants.BLACK;

function make_turn() {
    let action;
    try {
        action = ais[turn].run(board);
    } catch (e) {
        console.error(`${constants.COLOR_DESC[turn]} threw an exception.`);
        throw e;
    }
    if (!action) {
        console.log(`${constants.COLOR_DESC[turn]} surrenders.`);
        return;
    }
    const i = action[0];
    const j = action[1];
    if (!(i >= 1 && i <= board.width) || !(j >= 1 && j <= board.height) || board[i][j] != constants.BLANK) {
        console.error(`${constants.COLOR_DESC[turn]} attempts to make an illegal move.`);
        return;
    }

    board[i][j] = turn;
    draw_screen(board);

    let lines = board.findLines(5);
    if (lines.blacks.length) {
        console.log('BLACK wins!!');
        return;
    } else if (lines.whites.length) {
        console.log('WHITE wins!!');
        return;
    }

    if (board.findBlanks().length == 0) {
        console.log('No more legal moves. WHITE wins!!');
        return;
    }

    turn = constants.REVERSE_COLOR[turn];
    setTimeout(make_turn, ARGS.sleep);
}

draw_screen(board);
setTimeout(make_turn, ARGS.sleep);
