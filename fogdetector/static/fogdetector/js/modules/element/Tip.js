/**
 * @module menu/Tip.js
 */

import Text from './Text.js';

class Tip extends Text {
    constructor(options) {
        const opt = options ? options : {};
        super({
            content: opt.content,
            target: opt.target
        });
    }
}