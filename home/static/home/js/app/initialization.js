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
                    var param = {
                        currentpage: {
                            page: conf.general.pages.start,
                            language: conf.general.languages.default,
                            scroller: false
                        },
                        cartography: conf.cartography,
                        global: {
                            general: conf.general,
                            pages: conf.pages
                        }
                    }

                    //Constructing the map
                    param = constructMap(param);

                    //Constructing the footer
                    constructFooter(param);

                    //Constructing the first page on load
                    constructPage(param);

                    //Behavior on window size changev
                    window.addEventListener('resize', function() {
                        adjustPageContent(param);
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