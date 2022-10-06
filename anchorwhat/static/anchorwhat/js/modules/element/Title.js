/**
 * @module menu/Title.js
 */

import Text from './Text.js';

class Title extends Text {
    constructor(options) {
        const opt = options ? options : {};
        super({
            content: opt.content,
            target: opt.target
        });
    }
}