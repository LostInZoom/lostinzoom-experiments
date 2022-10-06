/**
 * Progress bar.
 */

function createProgressBar(target, source, param, callback) {
    let progress = makeElement('progress hidden', false, 'progress-bar');
    target.appendChild(progress);

    let cont = document.getElementById('progress-bar-container');
    let div = document.getElementById('progress-bar');

    let map = param.cartography.map;
    let tileGrid = source.getTileGrid();

    let total = getTileCount(map, tileGrid);
    let loaded = 0;

    let timeLimit = setTimeout(function() {
        endProgress(false);
    }, timeToSeconds(param.global.general.timers.loadingLimit) * 1000);

    let tileEnd = source.on('tileloadend', function() {
        addLoaded();
    });

    let tileError = source.on('tileloaderror', function() {
        addLoaded();
    });

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
        removemapListener(tileEnd, tileError);
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