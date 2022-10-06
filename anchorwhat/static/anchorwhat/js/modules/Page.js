/**
 * @module menu/Page.js
 */

import Menu from './Menu.js';

class Page extends Menu {
    constructor(options) {
        const opt = options ? options : {};
        super({
            development: opt.development,
            language: opt.language,
            target: opt.target,
        });
        this.number_ = opt.number;
        this.content_ = opt.content;
    }

    get number() {
        return this.number_;
    }
    set number(n) {
        this.number_ = n;
    }
    get content() {
        return this.content_;
    }
    set content(e) {
        this.content_ = e;
    }

    create() {
        for (let i = 0; i < this.elements.length; ++i) {
            switch (this.elements[i].type) {
                case 'title':
                    new DataTransferItemList();
                    break;
            }
        }
    }

    destroy() {

    }

    next() {

    }

    previous() {

    }
}

export default Page;