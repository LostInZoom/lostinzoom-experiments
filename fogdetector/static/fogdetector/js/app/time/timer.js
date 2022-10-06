/**
 * @timer
 * Defines timers, chronometers and countdown
 */

/**
 * Creates a countdown. Only accepts integer time limit in seconds
 * @callback callback: Use to define an other function when countdown ends.
 *
 * @param {int} limit: The number of seconds after which the timer is destroyed.
 * @param {dom element} target: Target where to create the countdown.
 */

class Timer {
    constructor(limit, target, complete) {
        this.limit = timeToSeconds(limit);
        this.target = target;
        this.complete = complete;
        this.elapsed = 0;
    }
    get remaining() {
        return this.limit - this.elapsed;
    }
    finished() {
        clearInterval(this.interval);
        addClass(this.div, 'timer-last-second');
        setTimeout(() => {
            this.end();
        }, 1000)
    }
    end() {
        this.container.remove();
        this.complete();
    }
}

class Countdown extends Timer {
    constructor(limit, target, absolute, dev, complete) {
        super(limit, target, complete);
        this.absolute = absolute;
        this.dev = dev;
        this.construct();
        if (this.dev) this.devmode();
        this.start();
    }

    construct() {
        this.container = makeElement('countdown-container hidden');
        this.div = makeElement('countdown');
        this.div.style.width = '100%';
        this.container.appendChild(this.div);
        if (this.absolute) this.container.style.position = 'absolute';
        else this.container.style.width = '100%';
        this.target.appendChild(this.container);
        displayE(this.container);
    }

    start() {
        this.interval = setInterval(() => {
            this.elapsed += 1;
            this.div.style.width = ((100 * this.remaining) / this.limit) + '%';
            if (this.remaining < 1) {
                this.finished();
                if (this.dev) { this.pauseContainer.remove() }
            }
        }, 1000);
    }

    devmode() {
        this.pauseContainer = makeElement('pause dev', false, 'button-status-container');
        this.pausediv = makeElement('button-status');
        this.pauseContainer.appendChild(this.pausediv);
        onClickE(this.pauseContainer, false, (evt) => {
            if (hasClass(evt.target, 'pause')) {
                removeClass(evt.target, 'pause');
                addClass(evt.target, 'play');
                this.pause();
            } else if (hasClass(evt.target, 'play')) {
                removeClass(evt.target, 'play');
                addClass(evt.target, 'pause');
                this.play();
            }
        })
        this.target.appendChild(this.pauseContainer);
    }

    pause() {
        clearInterval(this.interval);
    }

    play() {
        this.start();
    }
}

class Chronometer extends Timer {
    constructor(limit, target, starter, complete) {
        super(limit, target, complete);
        this.starter = starter;
        this.start();
    }

    start() {
        this.container = makeElement('chronometer-container');
        this.div = makeElement('chronometer');
        this.chrono = makeElement('chronometer-time');
        let seconds = parseInt(this.starter.substring(4, 5));
        let tenthseconds = parseInt(this.starter.substring(3, 4));
        let minutes = parseInt(this.starter.substring(1, 2));
        let tenthminutes = parseInt(this.starter.substring(0, 1));

        //setting the chronometer to right value
        let array = [
            [tenthminutes, 6],
            [minutes, 10],
            ':', [tenthseconds, 6],
            [seconds, 10]
        ];
        for (let i = 0; i < array.length; ++i) {
            let item = makeElement('chronometer-items');
            if (array[i] === ':') {
                //create separator
                item.innerHTML = array[i];
            } else {
                //create empty 
                let empty = makeElement('chronometer-numbers chronometer-first', '<br>');
                let first = makeElement('chronometer-numbers chronometer-current', array[i][0].toString());
                let second;
                if (array[i][0] + 1 === array[i][1]) {
                    second = makeElement('chronometer-numbers chronometer-last', '0');
                } else {
                    second = makeElement('chronometer-numbers chronometer-last', (array[i][0] + 1).toString());
                }
                item.append(empty, first, second);
            }
            this.div.appendChild(item);
        }

        document.getElementById('container').childNodes[0]
        this.container.appendChild(this.div);
        this.target.appendChild(this.container);
        this.interval = setInterval(() => {
            this.elapsed += 1;
            if (seconds === 9) {
                seconds = 0;
                if (tenthseconds === 5) {
                    tenthseconds = 0;
                    if (minutes === 9) {
                        minutes = 0;
                        if (tenthminutes === 5) {
                            tenthminutes = 0;
                        } else {
                            ++tenthminutes;
                        }
                        this.update(this, 6, 0);
                    } else {
                        ++minutes;
                    }
                    this.update(this, 10, 1);
                } else {
                    ++tenthseconds
                }
                this.update(this, 6, 3);
            } else {
                ++seconds;
            }
            this.update(this, 10, 4);
            if (this.remaining === 0) {
                this.finished();
            }
        }, 1000);
    }

    update(self, base, index) {
        let division = self.div.childNodes[index];
        let first = division.childNodes[0];
        let current = division.childNodes[1];
        let last = division.childNodes[2];
        let value = parseInt(last.innerHTML)
        if ((value + 1) === base) {
            value = '0';
        } else {
            ++value;
        }
        first.remove();
        removeClass(current, 'chronometer-current');
        removeClass(last, 'chronometer-last');
        addClass(current, 'chronometer-first');
        addClass(last, 'chronometer-current');
        division.appendChild(makeElement('chronometer-numbers chronometer-last', value));
    }

    destroy() {
        clearInterval(this.interval);
        addClass(this.div, 'timer-last-second');
        setTimeout(() => {
            this.container.remove();
        }, 1000)
    }
}