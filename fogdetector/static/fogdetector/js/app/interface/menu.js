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

    //Checking if the content of the page overflows
    adjustPageContent(param);
}

/**
 * Construct the footer
 *
 * @param {object} param: Global parameters loaded from json/csv files.
 */
function constructFooter(param) {
    //Creating the footer
    createFooter(param);
    //Dirty way for footer fading in effect (mystery...)
    waitMap(0.01, function() {
        display('footer');
    })
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

        //Hiding the current page
        hide('page');

        if (param.currentpage.scroller) {
            hide('scroller-container');
        }

        //Wait 0.5 sec for the page to disappear
        waitMap(0.5, function() {
            //Destroying the previous page
            document.getElementById('page').remove();

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

/**
 * Create the footer
 *
 * @param {object} param: Global parameters loaded from json/csv files.
 */
function createFooter(param) {
    try {
        //Creating the footer div
        let footer = makeElement('footer hidden', false, 'footer');
        //Getting the full year for the credits
        let year = new Date().getFullYear();
        //Creating the credits string
        let cred = `${year} - <a href='https://lostinzoom.github.io/home/' target='_blank'>ERC LostInZoom</a>`;
        //Creating the credits div
        let credits = makeElement('credits', cred);
        //Creating the language selection div
        let languages = makeElement('languages', false, 'lang-' + param.currentpage.language);

        //Getting the current language
        let current = param.currentpage.language;

        //Looping through supported languages
        let others = param.global.general.languages.supported;
        for (let i = 0; i < others.length; ++i) {
            let newLang = others[i];
            //If the language is not the current
            if (newLang !== current) {
                //Creating a container for the flag
                let container = makeElement('flag-container');
                //Creating the flag with the associated svg file
                let l = makeElement('flag', `<img src='../static/fogdetector/img/${newLang}.svg' />`);
                //Creating an overlay
                let overlay = makeElement('flag-overlay');
                //Defining behavior on click
                onClickE(overlay, false, function() {
                    //Changing the current language
                    param.currentpage.language = newLang;
                    languages.setAttribute('id', 'lang-' + newLang);
                    //Hiding page and footer
                    hide('page', 'footer');
                    //Waiting 0.5s for them to disappear
                    waitMap(0.5, function() {
                        //Removing the footer and the page
                        remove(footer, document.getElementById('page'));
                        //Reconstructing page and footer with the new language
                        constructPage(param);
                        constructFooter(param);
                    })
                });
                //Appending all div to the container
                container.append(overlay, l);
                languages.appendChild(container);
            }
        }
        let general = param.global.general;
        //If switch mode is allowed
        if (general.development.switch) {
            //creating a container for the development switch
            let devContainer = makeElement('button-development-container');
            let dev;
            let htmlContent;
            let menuMask = document.getElementById('menu-mask');
            //Checking if dev mode is active
            if (general.development.devmode) {
                //If dev mode is active, setting the variable to false for the click behavior
                dev = false;
                //Selecting out message to put on the button
                htmlContent = param.global.texts.dev.out[param.currentpage.language];
                //Adding development class to the menu mask
                addClass(menuMask, 'development');
            } else {
                //If dev mode is not active, setting the variable to true for the click behavior
                dev = true;
                //Selecting in message to put on the button
                htmlContent = param.global.texts.dev.in[param.currentpage.language];
                //Removing development class to the menu mask
                removeClass(menuMask, 'development');
            }
            //Creating the button with the new html text
            let devButton = makeElement('button button-development dev', htmlContent);
            //Defining on click behavior
            onClickE(devButton, true, function() {
                //Setting the new dev state
                general.development.devmode = dev;
                //Hiding page and footer
                hide('page', 'footer');
                if (param.currentpage.scroller) {
                    hide('scroller-container');
                }
                waitMap(0.5, function() {
                    //Destroying page and footer
                    remove(footer, document.getElementById('page'));
                    if (param.currentpage.scroller) {
                        remove(document.getElementById('scroller-container'));
                    }
                    //Reconstructing page and footer
                    constructPage(param);
                    constructFooter(param);
                })
            });
            //Appending the button to the footer
            devContainer.appendChild(devButton);
            footer.appendChild(devContainer);
        }
        //Appending credits and languages to footer, appending the footer to the menu container
        footer.append(credits, languages);
        document.getElementById('menu-container').appendChild(footer);
    } catch (e) {
        console.log(e);
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