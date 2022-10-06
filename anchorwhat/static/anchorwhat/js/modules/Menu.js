/**
 * @module menu/Menu.js
 */

class Menu {
    constructor(options) {
        const opt = options ? options : {};
        this.target_ = opt.target;
        this.language_ = opt.language;
        this.development_ = opt.development;
    }

    get target() {
        console.log('get target');
        return this.target_;
    }
    set target(t) {
        console.log('set target');
        this.target_ = t;
    }
    get developmentState() {
        return this.development_;
    }
    set developmentState(s) {
        this.development_ = s;
    }
    get language() {
        return this.language_;
    }
    set language(l) {
        this.language_ = l;
    }
}

export default Menu;