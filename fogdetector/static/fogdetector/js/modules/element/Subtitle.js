/**
 * @module menu/Subtitle.js
 */

import Text from './Text.js';

class Subtitle extends Text {
    constructor(options) {
        const opt = options ? options : {};
        super({
            content: opt.content,
            target: opt.target
        });
    }
}