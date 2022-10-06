/**
 * @time
 * Defines the time-related objects/interactions.
 */

function getCurrentDate(date) {
    let d = padTime(date.getDate());
    let m = padTime(date.getMonth() + 1);
    let y = date.getFullYear();
    return y + '-' + m + '-' + d
}

function getCurrentTime(date) {
    let h = padTime(date.getHours());
    let m = padTime(date.getMinutes());
    let s = padTime(date.getSeconds());
    return h + ':' + m + ':' + s
}

function timeToSeconds(t) {
    var parts = t.split(':'),
        minutes = +parts[0],
        seconds = +parts[1];
    return parseInt(minutes * 60 + seconds);
}

function formatTime(time, entry, format) {
    try {
        let s;
        if (entry === 's') {
            s = time;
        } else if (entry === 'ms') {
            s = Math.round(time / 1000);
        }

        let secs = s % 60;
        s = (s - secs) / 60;
        let mins = s % 60;
        let hrs = (s - mins) / 60;

        let r;
        if (format === 'hh:mm:ss') {
            r = hrs + ':' + padTime(mins) + ':' + padTime(secs);
        } else if (format === 'mm:ss') {
            r = mins + ':' + padTime(secs);
        } else if (format === 'mm') {
            if (secs < 30) { r = mins } else { r = mins + 1 }
        } else {
            throw 'Time format ' + format + ' not supported.';
        }

        return r;
    } catch (e) {
        console.log(e);
    }
}

function padTime(n, z) {
    z = z || 2;
    return ('00' + n).slice(-z);
}

function updatePageTime(param) {
    if (param.registered) {
        let page = param.currentpage.page;
        let timeSpent = new Date() - param.timestart;
        $.ajax({
            url: "update-time/",
            type: 'POST',
            data: {
                csrfmiddlewaretoken: $('[name=csrfmiddlewaretoken]').attr('value'),
                data: JSON.stringify({
                    user: param.user,
                    page: page,
                    time: timeSpent
                })
            }
        })
    }
}

//Estimate the duration of a session.
function estimateSessionDuration(param, session) {
    let general = param.global.general;
    let t1 = timeToSeconds(general.timers.timeLimitStart) + timeToSeconds(general.timers.averageReaction) + timeToSeconds(general.timers.menuAnimationTime);

    let ss = [];
    let ls = [];

    //If small scale tests exists
    if (typeof session.smallScale !== "undefined") {
        ss.push(...session.smallScale);
    }

    //If large scale tests exists
    if (typeof session.largeScale !== "undefined") {
        ls.push(...session.largeScale);
    }

    let a = ss.concat(ls);
    let len = a.length;
    let duration = 0;
    for (let i = 0; i < len; i++) {
        let b = a[i].options.split(' ');
        let t2;
        if (b[0] === 'pan') {
            t2 = general.animations.duration.pan
        } else if (b[0] === 'zoomin') {
            if (b[1] === 'sg') {
                t2 = general.animations.duration.zoominSg
            } else if (b[1] === 'lg') {
                t2 = general.animations.duration.zoominLg
            }
        } else if (b[0] === 'zoomout') {
            if (b[1] === 'sg') {
                t2 = general.animations.duration.zoomoutSg
            } else if (b[1] === 'lg') {
                t2 = general.animations.duration.zoomoutLg
            }
        }
        duration = duration + t2 + t1
    }
    return duration;
};

function estimateFullDuration(param) {
    let s = param.experiment.sessions;
    let t = param.experiment.trainings;
    let time = timeToSeconds(param.global.texts.readingTimeEstimation);
    for (let i = 0; i < s.length; i++) {
        time = time + estimateSessionDuration(param, s[i]);
    }
    for (let k = 0; k < t.length; k++) {
        time = time + estimateSessionDuration(param, t[k]);
    }
    return time;
}

function estimateDuration(value, language) {
    let textPrior, textAfter;
    if (language === 'en') {
        textPrior = 'Estimated duration: ';
        textAfter = ' minutes';
    } else if (language === 'fr') {
        textPrior = 'Durée estimée: ';
        textAfter = ' minutes';
    }
    return textPrior + formatTime(value, 's', 'mm') + textAfter;
};