'use strict';

const util = require('util');

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

const deepCopy = exports.deepCopy = function deepCopy(obj) {
    if (util.isArray(obj)) {
        obj = obj.slice();
        for (let i = 0, l = obj.length; i < l; ++i)
            obj[i] = deepCopy(obj[i]);
    } else if (util.isObject(obj)) {
        let res = {};
        for (let k in obj)
            if (obj.hasOwnProperty(k))
                res[k] = deepCopy(obj[k]);
        obj = res;
    }
    return obj;
};

const Heap = exports.Heap = class Heap extends Array {
    constructor(maxSize) {
        super(maxSize);
        this._size = 0;
    }

    get size() {
        return this._size;
    }

    push(elem) {
        if (this._size < this.length) {
            let j = this._size++;
            this[j] = elem;
            this._heapUp(j);
        } else if (this.cmp(this[0], elem)) {
            this[0] = elem;
            this._heapDown(0);
        }
    }

    pop() {
        let res = this[0];
        let j = --this._size;
        if (j) {
            this[0] = this[j];
            this._heapDown(0);
        }
    }

    cmp(a, b) {
        // Override this function
        return a < b;
    }

    _heapDown(i) {
        const size = this._size;
        for (;;) {
            let left = i * 2 + 1;
            let right = left + 1;
            if (left >= size) {
                break;
            } else if (right == size || this.cmp(this[left], this[right])) {
                if (this.cmp(this[left], this[i])) {
                    let tmp = this[i];
                    this[i] = this[left];
                    this[left] = tmp;
                    i = left;
                } else {
                    break;
                }
            } else if (this.cmp(this[right], this[i])) {
                let tmp = this[i];
                this[i] = this[right];
                this[right] = tmp;
                i = right;
            } else {
                break;
            }
        }
        return i;
    }

    _heapUp(i) {
        while (i) {
            let j = (i - 1) >>> 1;
            if (this.cmp(this[i], this[j])) {
                let tmp = this[i];
                this[i] = this[j];
                this[j] = tmp;
                i = j;
            } else {
                break;
            }
        }
        return i;
    }
};

const AttrMinHeap = exports.AttrMinHeap = class AttrMinHeap extends Heap {
    constructor(maxSize, key) {
        super(maxSize);
        this._key = key;
    }

    cmp(a, b) {
        const key = this._key;
        return a[key] < b[key];
    }
}

const AttrMaxHeap = exports.AttrMaxHeap = class AttrMaxHeap extends Heap {
    constructor(maxSize, key) {
        super(maxSize);
        this._key = key;
    }

    cmp(a, b) {
        const key = this._key;
        return a[key] > b[key];
    }
}
