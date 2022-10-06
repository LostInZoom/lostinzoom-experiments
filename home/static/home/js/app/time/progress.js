/**
 * Progress bar.
 */

function createProgressBar(target, param, callback) {
    let progress = makeElement('progress hidden', false, 'progress-bar');
    target.appendChild(progress);

    let cont = document.getElementById('progress-bar-container');
    let div = document.getElementById('progress-bar');

    let c = param.cartography;

    let timeLimit = setTimeout(function() {
        endProgress(false);
    }, timeToSeconds(param.global.general.timers.loadingLimit) * 1000);

    let total, tileEnd, tileError, interval;
    let loaded = 0;
    if (c.layer) {
        let map = c.map;
        let source = c.layer.getSource();
        let tileGrid = source.getTileGrid();
        total = getTileCount(map, tileGrid);

        tileEnd = source.on('tileloadend', function() { addLoaded(); });
        tileError = source.on('tileloaderror', function() { addLoaded(); });
    } else {
        total = 10;
        interval = setInterval(function() {
            addLoaded();
        }, 100);
    }

    cont.style.width = '400px';
    display('progress-bar');

    function addLoaded() {
        waitMap(0.1, function() {
            ++loaded;
            update();
        })
    }

    function update() {
        div.style.width = Math.round((100 * loaded) / total) + '%';
        if (loaded === total) {
            endProgress(true);
        }
    }

    function endProgress(status) {
        clearTimeout(timeLimit);
        if (c.layer) {
            removemapListener(tileEnd, tileError);
        } else {
            clearInterval(interval);
        }

        div.style.width = '100%';
        waitMap(0.5, function() {
            cont.style.width = '0';
            waitMap(0.5, function() {
                remove(div);
                callback(status, total, loaded);
            })
        })
    }
}