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
    let currentsession = param.currentsession.session;
    let training = param.currentsession.training;
    let s;
    let sessHTML;
    let nbGuide = 0;
    try {
        if (training) {
            let trainings = param.experiment.trainings;
            s = trainings[currentsession - 1];
            nbGuide = s.guide;
            sessHTML = 'training' + currentsession;
        } else {
            let sessions = param.experiment.sessions;
            s = sessions[currentsession - 1];
            sessHTML = 'session' + currentsession.session;
        }

        param.currentsession['nbguide'] = nbGuide;

        let sS;
        if (typeof s.smallScale !== "undefined") {
            sS = [];
            for (let i = 0; i < s.smallScale.length; i++) {
                sS.push([s.smallScale[i], s.smallScale.targets[i]]);
            }
        }

        let lS;
        if (typeof s.largeScale !== "undefined") {
            lS = [];
            for (let i = 0; i < s.largeScale.length; i++) {
                lS.push([s.largeScale[i], s.largeScale.targets[i]]);
            }
        }

        let concatenated;
        if (typeof s.smallScale === "undefined") {
            if (typeof s.largeScale === "undefined") {
                throw 'No tests to run for ' + sessHTML;
            } else {
                concatenated = lS;
            }
        } else {
            if (typeof s.largeScale === "undefined") {
                concatenated = sS;
            } else {
                concatenated = sS.concat(lS);
            }
        }

        let mixed = shuffleArray(concatenated);
        let p = rearrangeParam(mixed);

        param.currentsession['tests'] = p;

        launchSet(param);

        //Defining a function to run each tests asynchronously
        async function launchSet(param) {
            let tests = param.currentsession.tests;
            for (let i = 0; i < tests.length; ++i) {
                tests[i]['guide'] = nbGuide;
                tests[i]['number'] = i + 1;
                param.currenttest = {
                    test: tests[i],
                    number: i + 1,
                };
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
                mapToDefault(param);
                waitMap(0.5, function() {
                    hide('loading-container');
                    display('menu-container');
                    //Reset the starting time for the time spent on page
                    param.timestart = new Date();
                    param.currentpage.page += 1;

                    if (param.currentpage.page === param.global.general.pages.total) {
                        endSession(param, function(results) {
                            param['results'] = results;
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
                    //Put code to execute on test end
                    let ttime2 = new Date();
                    r['user'] = param.user;
                    r['position'] = param.currenttest.number;
                    r['start'] = ttime1;
                    r['end'] = ttime2;
                    r['duration'] = ttime2 - ttime1
                    postResults(r, function() {})
                    resolve('');
                });
            })
        }

        function postResults(results, callback) {
            $.ajax({
                url: "trial-results/",
                type: 'POST',
                data: {
                    csrfmiddlewaretoken: $('[name=csrfmiddlewaretoken]').attr('value'),
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
 * @param {boolean} tutorial: Indicate whether the test is part of the tutorial.
 */
function launchTrial(param, callback_test) {
    //Determinate the zoom level depending on the type and subtype.
    let test = paramForTrial(param);
    param.currenttest['parameters'] = test;

    //Retrieve parameters of the test.
    let devmode = param.global.general.development.devmode;
    let p = param.currenttest.test;
    let training = param.currentsession.training;
    let language = param.currentsession.language;
    let texts = param.global.texts;
    let general = param.global.general;
    let testnumber = p.number;
    let guide = p.guide;
    let guidestate = false;
    let basemap = p.basemap;
    let targetXY = [p.target.x, p.target.y];
    let tutoHints = texts.tutoHints;
    let trialResults = {
        trialId: p.trialId,
        targetId: p.target.id,
    };

    let loadingContainer = document.getElementById('loading-container');
    removeClass(loadingContainer, 'start-up');
    let loading = makeElement('loading hidden', false, 'loading');
    let progress = makeElement(false, false, 'progress-bar-container');
    loadingContainer.append(loading, progress);
    display('loading-container');

    waitMap(1, function() {
        display('loading');

        let center1 = calculateCenter(targetXY, test.zoom1, param);
        let center3 = calculateCenter(targetXY, test.zoom1, param);

        let map = param.cartography.map;
        let view = param.cartography.view;
        let target = param.cartography.target;

        view.setCenter(center1);
        view.setZoom(test.zoom1);

        let source = changeMapBasemap(basemap, param).getSource();
        updateTarget(targetXY, param);
        map.addLayer(target);

        createProgressBar(progress, source, param, function(status, total, loadedTiles) {
            let targetLocation = map.getPixelFromCoordinate(targetXY);
            let mapDiv = document.getElementById('map');
            let contDiv = document.getElementById('container');
            contDiv.style.background = 'var(--main-dark)';
            mapDiv.style.clipPath = 'circle(50px at ' + targetLocation[0] + 'px ' + targetLocation[1] + 'px)';
            mapDiv.style.transition = 'none';
            if (training && testnumber <= guide) {
                guidestate = true;
                displayHint(tutoHints.tutoHint1.hint[language], tutoHints.tutoHint1.button[language], param, function() {
                    trialCountdown();
                });
            } else {
                hide('loading');
                waitMap(0.5, function() {
                    trialCountdown();
                })
            }

            function trialCountdown() {
                hide('loading-container');
                waitMap(1, function() {
                    mapDiv.style.transition = 'clip-path 1.5s ease-in';
                    mapDiv.style.clipPath = 'circle(100%)'
                    waitMap(1, function() {
                        new Countdown(param.global.general.timers.timeLimitStart, contDiv, true, devmode, function() {
                            mapDiv.style.clipPath = '';
                            mapDiv.style.transition = '';
                            contDiv.style.background = 'white';
                            trialResults['target-position-start'] = calculateBorderDistance(targetXY, map);
                            display('loading-container');
                            waitMap(1, function() {
                                display('loading');
                                map.removeLayer(target);
                                view.setCenter(test.center2);
                                if ('type' !== 'pan') { view.setZoom(test.zoom2) };
                                createProgressBar(progress, source, param, function() {
                                    if (training && testnumber <= guide) {
                                        displayHint(tutoHints.tutoHint2.hint[language], tutoHints.tutoHint2.button[language], param, function() {
                                            trialAnimation();
                                        });
                                    } else {
                                        hide('loading');
                                        waitMap(0.5, function() {
                                            trialAnimation();
                                        })
                                    }
                                });
                            });
                        });
                    })
                });
            };

            function trialAnimation() {
                hide('loading-container');
                waitMap(1.5, function() {
                    animInter(test.zoom1, center3, test.duration, test.easing, view, function() {
                        //disappearDiv('menu-container');
                        if (training && testnumber <= guide) {
                            waitMap(1, function() {
                                display('loading-container');
                                waitMap(0.5, function() {
                                    displayHint(tutoHints.tutoHint3.hint[language], tutoHints.tutoHint3.button[language], param, function() {
                                        hide('loading-container');
                                        trialChronometer();
                                    });
                                });
                            });
                        } else {
                            hide('loading');
                            trialChronometer();
                        }
                    });
                });
            }

            function trialChronometer() {
                let areaLayer;
                if (training && testnumber <= guide) {
                    infiniteClickEffectMap(targetXY, map);
                    areaLayer = createTargetArea(targetXY, param);
                    map.addLayer(areaLayer);
                }
                let time1 = new Date();
                trialResults['target-position-end'] = calculateBorderDistance(targetXY, map);
                let chonometer = new Chronometer(
                    param.global.general.timers.timeLimitClick,
                    contDiv,
                    '00:00',
                    function() {
                        trialResults['click-time'] = -1;
                        trialResults['distance-px'] = -1;
                        trialResults['distance-m'] = -1;
                        if (training && testnumber <= guide) {
                            display('loading-container');
                            displayHint(tutoHints.tutoHint6.hint[language], tutoHints.tutoHint6.button[language], param, function() {
                                restartTutoEnd(clickEvent);
                            });
                        } else {
                            endTrial(trialResults, clickEvent);
                        }
                    }
                );

                let clickEvent = map.on('click', (evt) => {
                    chonometer.destroy();
                    let time2 = new Date();
                    //Get pixel coordinates of the target
                    let tpx = map.getPixelFromCoordinate(targetXY);
                    //Getting pixel coordinates of the click
                    let cpx = [event.clientX, event.clientY];
                    //Getting map coordinates of the target
                    let tm = targetXY;
                    //Getting map coordinates of the click
                    let cm = map.getEventCoordinate(event);

                    //Calculating the pixel difference between the target and the click
                    let difpix = Math.sqrt(squared(tpx[0] - cpx[0]) + squared(tpx[1] - cpx[1]));

                    //Calculating the meter difference between the target and the click
                    let difmet = Math.sqrt(squared(tm[0] - cm[0]) + squared(tm[1] - cm[1]));

                    trialResults['click-time'] = (time2 - time1) / 1000;
                    trialResults['distance-px'] = Math.round(difpix);
                    trialResults['distance-m'] = Math.round(difmet);

                    if (training === false || testnumber > guide) { clickEffect(cpx[0], cpx[1]); }
                    ol.Observable.unByKey(clickEvent);
                    waitMap(1, function() {
                        if (training && testnumber <= guide) {
                            display('loading-container');
                            if (difpix > 50) {
                                waitMap(0.5, function() {
                                    displayHint(tutoHints.tutoHint5.hint[language], tutoHints.tutoHint5.button[language], param, function() {
                                        restartTutoEnd(clickEvent);
                                    });
                                });
                            } else {
                                displayHint(tutoHints.tutoHint4.hint[language], tutoHints.tutoHint4.button[language], param, function() {
                                    endTrial(trialResults, clickEvent);
                                });
                            }
                        } else {
                            endTrial(trialResults, clickEvent);
                        }
                    });
                });

                function endTrial(r, clickEvent) {
                    if (training && testnumber <= guide) {
                        document.getElementById('current-click-effect').remove();
                        map.removeLayer(areaLayer);
                    }
                    ol.Observable.unByKey(clickEvent);
                    remove(loading, progress);
                    r['guide'] = guidestate;
                    callback_test(r);
                };
            }

            function restartTutoEnd(clickEvent) {
                document.getElementById('current-click-effect').remove();
                hide('loading-container');
                ol.Observable.unByKey(clickEvent);
                trialChronometer();
            }

            function displayHint(hint, button, param, callback) {
                hide('loading');
                waitMap(0.5, function() {
                    let l = document.getElementById('loading');
                    l.setAttribute('class', 'loading-hints');
                    let hintDiv = makeElement('menu-tuto-hints menu-text', hint);
                    let buttonDiv = makeElement('button button-hints', button);
                    onClickE(buttonDiv, true, function() {
                        hide('loading');
                        waitMap(0.5, function() {
                            l.innerHTML = '';
                            l.setAttribute('class', 'loading hidden');
                            callback();
                        });
                    });
                    l.append(hintDiv, buttonDiv)
                    display('loading');
                })
            };

            function displayClickArea(targetXY, radius) {
                let target = map.getPixelFromCoordinate(targetXY);
                let container = document.getElementById('container');
                let tX = target[0] - (radius);
                let tY = target[1] - (radius);
                let area = document.createElement('div');
                area.setAttribute('id', 'click-area');
                area.style.height = radius * 2 + 'px';
                area.style.width = radius * 2 + 'px';
                area.style.top = tY + 'px';
                area.style.left = tX + 'px';
                container.appendChild(area);
            }
        })
    });
};

/**
 * Defines tests parameters depending on type and subtype.
 * 
 * @param {string} type: The main test type (pan, zoomin, zoomout).
 * @param {string} subType: The test subtype (ls: 'large scale', ss: 'small scale', lg: 'large gap', sg: 'small gap').
 * @param {tuple} targetXY: Coordinates of the target [x, y].
 *
 * @return {object}: An object containing the parameters to be used by the test. (zoom1, zoom2, center2, duration, easing).
 */
function paramForTrial(param) {
    try {
        let p = param.currenttest.test;
        let type = p.type1;
        let subType = p.type2;
        let targetXY = [p.target.x, p.target.y];
        let general = param.global.general;
        let carto = param.cartography;
        let zoom1, zoom2, center2, duration, easingText;
        if (type === 'pan') {
            if (subType === 'ls') {
                p.basemap === 'mign' ? zoom1 = 16 : zoom1 = carto.zoomLevels.zoom4
            } else if (subType === 'ss') {
                zoom1 = carto.zoomLevels.zoom1
            } else {
                throw (type + " " + subType + " type dosen't exist, check your configuration.");
            }
            zoom2 = zoom1;
            center2 = calculateCenterPan(targetXY, zoom2, param);
            duration = general.animations.duration.pan;
            easingText = general.animations.easing.pan;
        } else {
            if (type === 'zoomin') {
                p.basemap === 'mign' ? zoom1 = 16 : zoom1 = carto.zoomLevels.zoom4
                if (subType === 'lg') {
                    zoom2 = carto.zoomLevels.zoom1;
                    duration = general.animations.duration.zoominLg;
                } else if (subType === 'sg') {
                    zoom2 = carto.zoomLevels.zoom2;
                    duration = general.animations.duration.zoominSg;
                } else {
                    throw (type + " " + subType + " type dosen't exist, check your configuration.");
                }
                center2 = calculateCenter(targetXY, zoom2, param);
                easingText = general.animations.easing.zoomin;
            } else if (type === 'zoomout') {
                zoom1 = carto.zoomLevels.zoom1;
                if (subType === 'lg') {
                    p.basemap === 'mign' ? zoom2 = 16 : zoom2 = carto.zoomLevels.zoom4
                    duration = general.animations.duration.zoomoutLg;
                } else if (subType === 'sg') {
                    zoom2 = carto.zoomLevels.zoom3;
                    duration = general.animations.duration.zoomoutSg;
                } else {
                    throw (type + " " + subType + " type dosen't exist, check your configuration.");
                }
                center2 = calculateCenter(targetXY, zoom1, param);
                easingText = general.animations.easing.zoomout;
            } else {
                throw (type + " " + subType + " type dosen't exist, check your configuration.");
            }
        }

        return {
            "zoom1": zoom1,
            "zoom2": zoom2,
            "center2": center2,
            "duration": duration,
            "easing": getEasingAnimation(easingText),
        };
    } catch (e) {
        console.log(e);
    }
};

function sessionsPassed(param, session, training) {
    let trainingDone = [];
    for (let i = 0; i < param.experiment.trainings.length; ++i) {
        trainingDone.push(training);
    }
    let sessionDone = [];
    for (let i = 0; i < param.experiment.sessions.length; ++i) {
        sessionDone.push(session);
    }
    param.experiment['done'] = {
        sessions: sessionDone,
        trainings: trainingDone,
    };
    return param;
}

function assignTargets(param) {
    try {
        let targets = param.experiment.targets;
        let ss = [];
        let ls = [];
        Object.keys(targets).forEach(function(key) {
            if (targets[key].scale === 'small') {
                ss.push({
                    id: parseInt(key),
                    scale: targets[key].scale,
                    location: targets[key].location,
                    type: targets[key].type,
                    x: parseInt(targets[key].x),
                    y: parseInt(targets[key].y),
                });
            } else if (targets[key].scale === 'large') {
                ls.push({
                    id: parseInt(key),
                    scale: targets[key].scale,
                    location: targets[key].location,
                    type: targets[key].type,
                    x: parseInt(targets[key].x),
                    y: parseInt(targets[key].y),
                });
            }
        });
        param.experiment.targets = {
            large: ls,
            small: ss,
        }

        let l = param.experiment.targets.large.slice(0);
        let s = param.experiment.targets.small.slice(0);
        let sessions = param.experiment.sessions;
        let trainings = param.experiment.trainings;

        param = assignation(trainings, 'training');
        param = assignation(sessions, 'session');

        return param;

        function assignation(objects, type) {
            let exp;
            if (type === 'training') {
                exp = param.experiment.trainings;
            } else if (type === 'session') {
                exp = param.experiment.sessions;
            }
            for (let i = 0; i < objects.length; i++) {
                let object = objects[i];
                if (object.largeScale) {
                    exp[i].largeScale['targets'] = [];
                    for (let j = 0; j < object.largeScale.length; j++) {
                        if (l.length > 0) {
                            let target = arrayRemoveRandomItem(l);
                            exp[i].largeScale.targets.push(target[0]);
                        } else {
                            throw 'Not enough large scale targets.'
                        }
                    }
                }
                if (object.smallScale) {
                    exp[i].smallScale['targets'] = [];
                    for (let j = 0; j < object.smallScale.length; j++) {
                        if (s.length > 0) {
                            let target = arrayRemoveRandomItem(s);
                            exp[i].smallScale.targets.push(target[0]);
                        } else {
                            throw 'Not enough small scale targets.'
                        }
                    }
                }
            }
            return param
        }
    } catch (e) {
        console.log(e);
    }
}

function rearrangeParam(a) {
    let b = [];
    for (let i = 0; i < a.length; i++) {
        let type = a[i][0].options.split(' ');
        let target = a[i][1];
        let parameters = {
            trialId: a[i][0].id,
            type1: type[0],
            type2: type[1],
            basemap: type[2],
            target: target,
        };
        b.push(parameters);
    };
    return b;
};