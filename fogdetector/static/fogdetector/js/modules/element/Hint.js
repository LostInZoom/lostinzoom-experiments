/**
 * @module menu/Hint.js
 */

import Text from './Text.js';

class Hint extends Text {
    constructor(options) {
        const opt = options ? options : {};
        super({
            content: opt.content,
            target: opt.target
        });
    }
}