'use strict';

const WHITE = 0;
const BLACK = 1;
const BLANK = 2;
const WALL = 3;
const STONE_COLORS = [BLACK, WHITE];
const DISPLAY = {
    [BLANK]: '  ',
    [WHITE]: '\x1b[46m  \x1b[0m',
    [BLACK]: '\x1b[41m  \x1b[0m',
    [WALL]: 'XX',
};
const COLOR_DESC = {
    [BLANK]: 'BLANK',
    [WHITE]: 'WHITE',
    [BLACK]: 'BLACK',
    [WALL]: 'WALL',
};
const REVERSE_COLOR = {
    [BLANK]: WALL,
    [WALL]: BLANK,
    [WHITE]: BLACK,
    [BLACK]: WHITE,
};

const RIGHT = 0, DOWN = 1, RIGHTDOWN = 2, LEFTDOWN = 3;
const DIRECTIONS = {
    [RIGHT]: {i: 0, j: 1},
    [DOWN]: {i: 1, j: 0},
    [RIGHTDOWN]: {i: 1, j: 1},
    [LEFTDOWN]: {i: 1, j: -1},
};

Object.assign(exports, {
    BLANK, WHITE, BLACK, WALL,
    DISPLAY, COLOR_DESC, STONE_COLORS,
    REVERSE_COLOR,

    RIGHT, DOWN, RIGHTDOWN, LEFTDOWN, DIRECTIONS,
})
