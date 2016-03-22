#!/usr/bin/env node

'use strict';

const fs = require('fs');
const yargs = require('yargs');

const Board = require('../common/board').Board;
const C = require('../common/constants');

const DEFAULT_WIDTH = 15;
const DEFAULT_HEIGHT = 15;

const AI_DICT = {
    'random': ['../common/ai', 'AI'],
    'donkey': ['../common/ai', 'DonkeyAI'],
    'dolphin': ['../dolphin/main', 'dolphinAI'],
};
const DEFAULT_AI = 'random';

const ARGS = yargs
    .usage(`$0 [options...] [BLACK_AI[:OPTIONS] [WHITE_AI[:OPTIONS]]]

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
    .options('holes', {
        describe: 'Number of holes on the board',
        default: 0,
    })
    .option('sleep', {
        alias: 's',
        describe: 'Sleep time between moves',
        default: 100,
    })
    .option('load', {
        describe: 'Load initial state (* = black; o = white; x = wall)',
    })
    .option('save', {
        describe: 'Save each step',
    })
    .help('help')
    .argv;

const aiNames = {
    [C.BLACK]: ARGS._[0] || DEFAULT_AI,
    [C.WHITE]: ARGS._[1] || DEFAULT_AI,
};
const ais = {};

for (const color of C.STONE_COLORS) {
    const parts = aiNames[color].split(':');
    const aiInfo = AI_DICT[parts[0]];
    if (!aiInfo) {
        console.error(`Unknown AI ${aiNames[color]}`);
        process.exit(1);
    }
    const cls = require(aiInfo[0])[aiInfo[1]];
    let ai = new cls(color, ...parts.slice(1));
    ais[color] = ai;
}

let board = new Board(ARGS.w, ARGS.h);
let moves = {[C.BLACK]: 0, [C.WHITE]: 0};
let totalTimes = {[C.BLACK]: 0, [C.WHITE]: 0};

if (ARGS.load)
    board.deserialize(fs.readFileSync(ARGS.load, 'ascii'));

let saveText = null;
if (ARGS.save) {
    saveText = '';
    process.on('exit', () => {
        fs.writeFileSync(ARGS.save, saveText, 'ascii');
    });
}

if (ARGS.holes) {
    const holes = Math.min(ARGS.holes, ARGS.w * ARGS.h);
    let blanks = Array.from(board.yieldBlanks());
    for (let i = 0; i < holes; ++i) {
        var k = Math.floor(Math.random() * blanks.length);
        board[blanks[k][0]][blanks[k][1]] = C.WALL;
        blanks[k] = blanks[blanks.length - 1];
        blanks.length -= 1;
    }
}

const write = process.stdout.write.bind(process.stdout);

function draw_screen(board) {
    let s = '\x1b[H';  // Move cursor to home
    const w = board.width;
    const h = board.height;
    s += 'X'.repeat(w * 4 + 4) + '\n';
    for (let i = 1; i <= h; ++i) {
        s += 'XX';
        for (let j = 1; j <= w; ++j)
            s += ' ' + C.DISPLAY[board[i][j]] + ' ';
        s += 'XX\nXX' + ' '.repeat(w * 4) + 'XX\n';
    }
    s += 'X'.repeat(w * 4 + 4) + '\n';
    for (let color of C.STONE_COLORS) {
        const ms = totalTimes[color];
        const mv = moves[color];
        s += `${C.DISPLAY[color]}: ${C.COLOR_DESC[color]} ${aiNames[color]} ${mv} moves ${ms} ms`;
        if (mv)
            s += ` ${ms/mv} ms/move`;
        s += '\x1b[K\n';
    }
    write(s);
}

write('\x1b[3J\x1b[H\x1b[2J'); // Clear screen

let turn = C.BLACK;

function make_turn() {
    let action;
    let beginTime = Date.now();
    try {
        action = ais[turn].run(board.copy());
    } catch (e) {
        console.error(`${C.COLOR_DESC[turn]} threw an exception.`);
        throw e;
    }
    let usedTime = Date.now() - beginTime;
    moves[turn]++;
    totalTimes[turn] += usedTime;
    if (!action) {
        console.log(`${C.COLOR_DESC[turn]} surrenders.`);
        return;
    }
    const i = action[0];
    const j = action[1];
    if (!(i >= 1 && i <= board.height) || !(j >= 1 && j <= board.width) || board[i][j] != C.BLANK) {
        console.error(`${C.COLOR_DESC[turn]} attempts to make an illegal move (${i}, ${j})`);
        return;
    }

    board[i][j] = turn;
    draw_screen(board);

    if (saveText !== null) {
        saveText += '\n\n\n';
        saveText += board.serialize();
    }

    let first = board.yieldLines(5).next();
    if (!first.done) {
        console.log(`${C.COLOR_DESC[first.value.color]} wins!!`);
        return;
    }

    if (!board.hasBlanks()) {
        console.log('No more legal moves. WHITE wins!!');
        return;
    }

    turn = C.REVERSE_COLOR[turn];
    setTimeout(make_turn, ARGS.sleep);
}

draw_screen(board);
setTimeout(make_turn, ARGS.sleep);
