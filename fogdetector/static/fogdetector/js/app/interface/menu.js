/**
 * @menu 
 * Defines the behavior and the display of the interface before, after and between tests.
 */

/**
 * Construct a page depending on the configuration file and the language
 *
 * @param {object} param: Global parameters loaded from json/csv files.
 */
function constructPage(param) {
    //Setting the timer start for the page
    param.timestart = new Date();
    //Creating the page
    createPage(param);
    //Displaying the page
    display('page');

    adjustPageContent(param)
}

/**
 * Construct the footer
 *
 * @param {object} param: Global parameters loaded from json/csv files.
 */
function constructFooter(param) {
    //Creating the footer
    createFooter(param);
    waitMap(0.001, function() { display('footer'); })
}

/**
 * Change page
 *
 * @param {object} param: Global parameters loaded from json/csv files.
 * @param {string} newPage: 'next' or 'back'. Specify if next or previous page is created.
 */
function changePage(param, newPage, waiting) {
    try {
        //Updating the time spent on the current page
        updatePageTime(param);
        let page = document.getElementById('page');
        let footer = document.getElementById('footer');

        //Hiding the current page
        hideE(page, footer);

        if (param.currentpage.scroller) {
            hide('scroller-container');
        }

        //Wait 0.5 sec for the page to disappear
        waitMap(0.5, function() {
            //Destroying the previous page
            remove(page, footer);

            if (waiting === 'registration' && param.registered) {
                waiting = false;
            }

            if (waiting) {
                let loadingContainer = document.getElementById('loading-container');
                let loading = makeElement('loading loading-start-up', false, 'loading');
                loadingContainer.append(loading);
                display('loading-container');
            }

            if (waiting === 'registration' && param.registered === false) {
                registration(param, function() {
                    waitMap(0.5, function() {
                        pagePhase1();
                    })
                });
            } else {
                pagePhase1();
            }

            function pagePhase1() {
                if (waiting === 'form') {
                    form(param, function() {
                        waitMap(0.5, function() {
                            pagePhase2();
                        })
                    })
                } else {
                    pagePhase2();
                }
            }

            function pagePhase2() {
                //Setting the new page number
                if (newPage === 'next') {
                    param.currentpage.page += 1;
                } else if (newPage === 'back') {
                    param.currentpage.page -= 1;
                }

                if (param.currentpage.page === param.global.general.pages.total) {
                    endSession(param, function(results) {
                        param['results'] = results;
                        pagePhase3();
                    })
                } else {
                    pagePhase3();
                }
            }

            function pagePhase3() {
                if (waiting) {
                    hide('loading-container');
                    waitMap(0.5, function() {
                        document.getElementById('loading').remove();
                        waiting = false;
                        displayNewPage();
                    })
                } else {
                    displayNewPage();
                }
            }

            function displayNewPage() {
                //Creating the new page
                constructFooter(param);
                constructPage(param);
                
                if (param.currentpage.scroller) {
                    display('scroller-container');
                }
            }

            function registration(param, success) {
                let userInfo = JSON.stringify(getUserInfos());
                $.ajax({
                    url: "registration/",
                    type: 'POST',
                    data: {
                        csrfmiddlewaretoken: $('[name=csrfmiddlewaretoken]').attr('value'),
                        data: userInfo
                    },
                    success: function(user) {
                        param['user'] = user;
                        param.registered = true;
                        success();
                    },
                    error: function() {
                        displayAlert({
                            alert: 'Registration problem.<br>Please reload the page.',
                        });
                    },
                })
            }

            function form(param, complete) {
                $.ajax({
                    url: "form-results/",
                    type: 'POST',
                    data: {
                        csrfmiddlewaretoken: $('[name=csrfmiddlewaretoken]').attr('value'),
                        data: JSON.stringify({
                            user: param.user,
                            data: param.currentform
                        })
                    },
                    complete: function() {
                        complete();
                    },
                })
            }
        });
    } catch (e) {
        console.log('There is a problem with the number of page in your config.js file. Cannot change page.');
    }
}

//Displays an alert
function displayAlert(text, param) {
    //Creating the container as an hidden element
    let alertMask = makeElement('mask hidden', false, 'alert-container');

    //Creating the label
    let alertLabel = makeElement('alert menu-text', text.alert);

    alertMask.appendChild(alertLabel);

    if ('button' in text) {
        //Creating the button to agree
        let backButton = makeElement('button - button-alert', text.button);

        //Defining the behavior when clicking the button to agree
        onClickE(backButton, true, function() {
            //Hiding the container
            hide('alert-container');
            //Waiting for the container to disappear
            waitMap(0.5, function() {
                //Displaying back the page and the footer
                display('page', 'footer');
                if (param.currentpage.scroller) {
                    display('scroller-container');
                }
                //Destroying the alert container
                document.getElementById('alert-container').remove();
            })
        });
        alertMask.appendChild(backButton);
    }

    document.getElementById('menu-container').appendChild(alertMask);

    //Waiting for the page and the footer to disappear
    waitMap(0.5, function() {
        //Displaying the alert container
        display('alert-container');
    })
}

function endSession(param, success) {
    $.ajax({
        url: "end-results/",
        type: 'POST',
        data: {
            csrfmiddlewaretoken: $('[name=csrfmiddlewaretoken]').attr('value'),
            data: JSON.stringify({
                user: param.user
            })
        },
        success: function(results) {
            success(results);
        }
    })
}