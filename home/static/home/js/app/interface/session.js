/**
 * @sessions 
 * Creates sets and trials and run them using asynchronous function
 */

/**
 * Generates and run a session.
 *
 * @param {boolean} training: Make the session a training session.
 */
function generateSet(param) {
    //Defining the parameters for the session/training session
    try {
        let training = param.currentsession.training;
        let number = param.currentsession.session;
        let s;
        if (training) {
            s = param.experiment.trainings[number - 1]
        } else {
            s = param.experiment.sessions[number - 1]
        }
        param.currentsession['basemap'] = s.basemap;
        param.currentsession['coordinates'] = [s.x, s.y];
        launchSet(param);

        //Defining a function to run each tests asynchronously
        async function launchSet(param) {
            let zooms;
            training ? zooms = [param.cartography.zoomLevels[2]] : zooms = param.cartography.zoomLevels
            for (let i = 0; i < zooms.length; ++i) {
                param.currenttest['zoom'] = zooms[i];
                param.currenttest['number'] = i + 1;
                param.currenttest['setid'] = parseInt(s.id);
                await generateTrial(param);
            }

            display('loading-container');
            //Defining the type and name of session
            if (training) {
                param.experiment.done.trainings[param.currentsession.session - 1] = true;
            } else {
                param.experiment.done.sessions[param.currentsession.session - 1] = true;
            }

            waitMap(1, function() {
                remove(document.getElementById("mask-container"));
                mapToDefault(param);
                waitMap(0.5, function() {
                    hide('loading-container');
                    display('menu-container');
                    //Reset the starting time for the time spent on page
                    param.timestart = new Date();
                    param.currentpage.page += 1;

                    if (param.currentpage.page === param.global.general.pages.total) {
                        param['results'] = { index: 0 }
                        endSession(param, function(results) {
                            param.results = results;
                            recreatePage(param);
                        })
                    } else {
                        recreatePage(param);
                    }

                    function recreatePage(param) {
                        constructPage(param);
                        constructFooter(param);
                        waitMap(0.5, function() {
                            addClass(document.getElementById('loading-container'), 'start-up');
                        })
                    }
                })
            })
        }

        //Defining a function to launch the tests asynchonously
        function generateTrial(param) {
            let ttime1 = new Date();
            return new Promise(function(resolve, reject) {
                launchTrial(param, function(r) {
                    if (r) {
                        //Put code to execute on test end
                        let ttime2 = new Date();
                        r['user'] = param.user;
                        r['zoom'] = param.currenttest.zoom;
                        r['setid'] = param.currenttest.setid;
                        r['start'] = ttime1;
                        r['end'] = ttime2;
                        r['duration'] = ttime2 - ttime1
                        postResults(r, function() {})
                    }
                    resolve('');
                });
            })
        }

        function postResults(results, callback) {
            $.ajax({
                url: "trial-results/",
                type: 'POST',
                data: {
                    csrfmiddlewaretoken: getCookie('csrftoken'),
                    data: JSON.stringify(results)
                },
                complete: function() {
                    callback();
                }
            })
        }
    } catch (e) {
        console.log(e);
    }
};

/**
 * Launches a trial.
 *
 * @callback callback: Use to launch an other test/function when the test ends.
 * 
 * @param {array} param: An array containing informations about the test.
 */
function launchTrial(param, callback_test) {
    //Retrieve parameters of the test.
    let p = param.currentsession;

    let loadingContainer = document.getElementById('loading-container');
    removeClass(loadingContainer, 'start-up');
    let loading = makeElement('loading hidden', false, 'loading');
    let progress = makeElement(false, false, 'progress-bar-container');
    loadingContainer.append(loading, progress);
    display('loading-container');
    let container = document.getElementById('container');
    let maskcontainer = makeElement('mask-container', false, 'mask-container');

    waitMap(1, function() {
        if (document.getElementById("mask-container")) {
            remove(document.getElementById("mask-container"));
        }
        container.appendChild(maskcontainer);
        display('loading');
        updateMap(param, {
            basemap: p.basemap,
            center: p.coordinates,
            zoom: param.currenttest.zoom
        });

        createProgressBar(progress, param, function(status, total, loadedTiles) {
            hide('loading');
            waitMap(0.5, function() {
                hide('loading-container');
                drawingMode(param, function(results) {
                    display('loading-container');
                    remove(loading, progress);
                    callback_test(results);
                });
            })
        })
    })
};

function assignLocation(param) {
    let exp = param.experiment;

    let firsts = [];
    Object.keys(exp.locations).forEach(function(key) {
        let value = exp.locations[key];
        if (value.basemap === 'osm') {
            firsts.push(value);
        }
    });
    let first = arrayRandomItem(firsts)

    let seconds = [];
    Object.keys(exp.locations).forEach(function(key) {
        let value = exp.locations[key];
        if (value.location !== first.location && value.basemap !== first.basemap) {
            seconds.push(value);
        }
    });
    let second = arrayRandomItem(seconds)

    param.experiment['sessions'] = shuffleArray([first, second]);
    param.experiment['trainings'] = [{
        id: '0',
        location: 'Lyon',
        basemap: 'osm',
        x: '537935.141185',
        y: '5741538.715755'
    }];
    return param
}

function sessionsPassed(param, session, training) {
    let trainingDone = [training];
    let sessionDone = [];
    for (let i = 0; i < 2; ++i) {
        sessionDone.push(session);
    }
    param.experiment['done'] = {
        sessions: sessionDone,
        trainings: trainingDone,
    };
    return param;
}