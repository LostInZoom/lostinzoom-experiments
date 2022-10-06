/**
 * @initialization
 * Defines the initialization of the experiment.
 */

$(document).ready(function() {
    let loadingContainer = document.getElementById('loading-container');
    let loading = makeElement('loading loading-start-up hidden', false, 'loading');
    loadingContainer.append(loading);
    display('loading-container', 'loading');
    waitMap(1, function() {
        $.ajax({
            url: 'configuration/',
            type: 'GET',
            success: function(conf) {
                hide('loading')
                waitMap(0.5, function() {
                    remove(loading);
                    hide('loading-container');
                    //Creating the parameters based on loaded json
                    var param = {
                        registered: false,
                        csrftoken: document.querySelector('[name=csrfmiddlewaretoken]').value,
                        currentpage: {
                            page: conf.general.pages.start,
                            language: conf.general.languages.default,
                            scroller: false
                        },
                        currentsession: {},
                        currenttest: {},
                        global: {
                            general: conf.general,
                            pages: conf.pages,
                            texts: conf.texts,
                            checkboxes: {},
                            forms: {}
                        },
                        cartography: conf.cartography,
                        experiment: {
                            locations: conf.locations,
                        },
                        keys: conf.keys,
                        timestart: 0
                    }

                    //Adding state of sessions and trainings
                    param = sessionsPassed(param, false, false);

                    param = assignLocation(param);

                    //Constructing the map
                    param = constructMap(param);

                    //Constructing the footer
                    constructFooter(param);

                    //Constructing the first page on load
                    constructPage(param);

                    //Behavior on window size changev
                    window.addEventListener('resize', function() {
                        handleScreenResize(param);
                    }, true);
                })
            },
            error: function() {
                displayAlert({
                    alert: 'There was a problem when loading the configuration.',
                });
            }
        })
    })
});