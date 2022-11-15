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
                let param = {
                    cartography: conf.cartography,
                    drawing: conf.drawing,
                    keys: conf.keys
                };

                let userInfo = JSON.stringify(getUserInfos());
                $.ajax({
                    url: 'registration/',
                    type: 'POST',
                    data: { data: userInfo },
                    success: function(user) {
                        param['user'] = user;
                        // Loading Google Maps API
                        let script = document.createElement('script');
                        script.src = `https://maps.googleapis.com/maps/api/js?key=${param.keys.google}&callback=startApp`;
                        document.head.appendChild(script);
                        window.startApp = function() {
                            createInterface(param);
                            waitMap(0.5, function() {
                                hide('loading');
                                waitMap(0.5, function() {
                                    remove(loading);
                                    hide('loading-container');
                                })
                            })
                        }
                    },
                    error: function() {
                        displayAlert({
                            alert: 'There was a problem when registering.',
                        });
                    }
                })
            },
            error: function() {
                displayAlert({
                    alert: 'There was a problem when loading the configuration.',
                });
            }
        })
    })
})