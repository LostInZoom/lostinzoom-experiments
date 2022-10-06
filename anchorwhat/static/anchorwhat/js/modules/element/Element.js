/**
 * @module menu/Element.js
 */

import Menu from '../Menu.js';

class Element extends Menu {
    constructor(options) {
        /* Prevent users from instantiating the class */
        if (this.constructor === Element) {
            throw new TypeError('Abstract class "Element" cannot be instantiated directly.');
        }
        const opt = options ? options : {};
        super({
            target: opt.target
        });
    }

    createWithClass() {

    }

    createWithId() {

    }

    makeElement(className, content, id) {
        let e = document.createElement('div');
        if (id) { e.setAttribute('id', id) }
        if (className) { e.setAttribute('class', className) }
        if (content) { e.innerHTML = content; }
        return e;
    }
}

export default Element;