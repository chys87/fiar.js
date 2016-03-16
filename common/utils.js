'use strict';

const randomChooseFrom = exports.randomChooseFrom = series => {
    // Choose a random item from a list, whose length may not be known in advance
    let res = null;
    let n = 0;
    for (const item of series) {
        ++n;
        if (Math.random() * n < 1)
            res = item;
    }
    return res;
};
