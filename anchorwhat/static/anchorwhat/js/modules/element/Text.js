/**
 * @module menu/Text.js
 */

import Element from "./Element";

class Text extends Element {
    constructor(options) {
        const opt = options ? options : {};
        const content = opt.content;
        super({
            content: content,
            target: opt.target
        });
    }

    get text() {
        return this.content;
    }
    set text(t) {
        this.content = t;
    }
}

export default Text;