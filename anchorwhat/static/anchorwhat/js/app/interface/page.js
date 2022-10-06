/**
 * @page 
 * Page creation
 */

/**
 * Create a page depending on the configuration file and the language
 *
 * @param {int} page: The page number.
 * @param {string} language: The language to use for the construction of the menu (only 'en' and 'fr' supported for now).
 */
function createPage(param) {
    try {
        //Variables handling the number of menu objects
        let nbCheckbox, nbForm, nbSpecial, nbMap, nbSkip, nbTimer, nbQuestion;
        nbCheckbox = nbForm = nbSpecial = nbMap = nbTimer = nbSkip = nbQuestion = 0;
        //The html object where to put the menu objects
        let menuDiv = document.getElementById('menu-container');

        //Depending on the selected language, we select the right object from the configuration file.
        let classLang;
        let page = param.currentpage.page;
        let language = param.currentpage.language;
        let text = param.global.pages[page - 1];

        if (language === 'en') {
            //configText = texts.en;
            classLang = 'lang-en';
        } else if (language === 'fr') {
            //configText = texts.fr;
            classLang = 'lang-fr';
        }

        //Creating a new div creating the container for the new page and setting classes to match language and if it is displayed or not
        let pageDiv = makeElement('menu-page ' + classLang + ' hidden', false, 'page');

        //Creating a new div where the object will be put
        let pageContent = makeElement('menu-page-content', false, 'page-content');

        //Launching the loop to create each object inside the page
        let nbDiv = text.length;
        var mandatoryHint = false;
        for (let j = 0; j < nbDiv; ++j) {
            constructDiv(param, pageDiv, pageContent, j);
        }

        //Check if a mandatory checkbox is present on the page
        if (mandatoryHint) {
            let hint = makeElement('menu-hint menu-text', '* ' + param.global.texts.mandatory[language]);
            pageContent.appendChild(hint);
        }

        //If dev mode is active, display the page number on top
        if (param.global.general.development.devmode) {
            let pageNumber = makeElement('page-number dev', '-- ' + param.global.texts.dev.page[language] + ' ' + page + ' --');
            pageDiv.appendChild(pageNumber);
            //pageContent.insertBefore(pageNumber, pageContent.firstChild);
        }

        //Appending the page content to the page
        pageDiv.appendChild(pageContent);

        //Apending the page to the menu
        menuDiv.appendChild(pageDiv);

        //Defining a loop for objects as they need the element to be appended to the page
        nbSpecial = 0;
        nbMap = 0;
        for (let k = 0; k < nbDiv; ++k) {
            //If a special element if found
            if (text[k].type === 'special') {
                //Incrementing the special object number on the page.
                ++nbSpecial;

                //Looping through the special objects array
                for (let l = 0; l < text[k].items.length; ++l) {
                    //Getting the special object from the configuration
                    let specialObj = text[k].items[l];
                    if (specialObj.type === 'map') {
                        ++nbMap;

                        //Defining the id of the div where the map will be put
                        let mapDiv = 'map-menu' + nbMap;
                        generateMenuMap(mapDiv, specialObj, param);

                        let mapEle = document.getElementById(mapDiv);
                        if (specialObj.shape === 'circle') {
                            for (let i = 0; i < mapEle.childNodes.length; ++i) {
                                mapEle.childNodes[i].style.setProperty('border-radius', '50%');
                            }
                        } else if (specialObj.shape === 'round') {
                            for (let i = 0; i < mapEle.childNodes.length; ++i) {
                                mapEle.childNodes[i].style.setProperty('border-radius', '15%');
                            }
                        }
                    } else if (specialObj.type === 'timer') {
                        //Incrementing the timer number on the page.
                        ++nbTimer;

                        //Creating an infinite timer 
                        let specialDiv = document.getElementById('special-menu-container' + nbSpecial);
                        infiniteCountdown(param.global.general.timers.timeLimitStart, specialDiv);

                        function infiniteCountdown(limit, target) {
                            new Countdown(limit, target, false, false, function() {
                                infiniteCountdown(limit, target);
                            })
                        };
                        //infiniteTimer(specialDiv, page, nbTimer, specialObj.duration, true);
                    } else {
                        throw 'Special menu object is not valid. Check your config.js file.';
                    }
                }
            }
            if (text[k].type === 'button' && text[k].effect === 'form') {
                let buttonForm = document.querySelectorAll('.button-form');
                if (buttonForm.length > 1) {
                    throw 'Only one form button per page is accepted.';
                } else {
                    buttonForm[0].addEventListener("click", createFormButton);

                    function createFormButton() {
                        if (!(document.getElementById('alert-container'))) {
                            if (!param.currentform) {
                                param['currentform'] = {};
                            }
                            param.currentform = {
                                page: page,
                                questions: {}
                            };
                            let alert = false;
                            document.querySelectorAll('.form-question-container').forEach(function(cont, key) {
                                cont.querySelectorAll('.form-question').forEach(function(q, questionNb) {
                                    if (questionNb > 1) {
                                        throw 'More than one question items in a question';
                                    } else {
                                        let question = q.innerHTML.replace('<br>', ' ');
                                        param.currentform.questions[(key + 1)] = {
                                            question: question
                                        };
                                    }
                                });
                                let answer = [];
                                cont.querySelectorAll('.form-item.selected').forEach(function(a) {
                                    let str;
                                    if (a.hasAttribute('value')) {
                                        str = a.getAttribute('value');
                                    } else {
                                        str = a.innerHTML.replace('<br>', ' ');
                                    }
                                    if (str !== '') {
                                        answer.push(str);
                                    } else {
                                        answer.push('not answered');
                                    }
                                });

                                let mandatory = param.global.forms['page' + page]['question' + (key + 1)].mandatory;
                                if (answer.length === 0) {
                                    param.currentform.questions[(key + 1)]['answer'] = 'no answer';
                                    if (mandatory) { alert = true; }
                                } else if (answer.length === 1) {
                                    param.currentform.questions[(key + 1)]['answer'] = answer[0];
                                } else {
                                    param.currentform.questions[(key + 1)]['answer'] = answer;
                                }
                            });

                            if (alert) {
                                let t = param.global.texts.alert.forms;
                                //Hiding the page and the footer
                                hide('page', 'footer');
                                if (param.currentpage.scroller) {
                                    hide('scroller-container');
                                }
                                displayAlert({
                                    alert: t.label[language],
                                    button: t.button[language]
                                }, param);
                            } else {
                                buttonForm[0].removeEventListener("click", createFormButton);
                                changePage(param, 'next', 'form');
                            }
                        }
                    }
                }
            }
            if (text[k].type === 'button' && text[k].effect === 'skip') {
                let className = 'button button-skip';
                let display;
                if (param.global.general.development.devmode === false && text[k].dev === false) {
                    //Display or not the button if session has already been done
                    let done;
                    if (param.currentsession.training) {
                        done = param.experiment.done.trainings[param.currentsession.session - 1];
                    } else {
                        done = param.experiment.done.sessions[param.currentsession.session - 1];
                    }
                    if (done) {
                        display = 'regular'
                    } else {
                        display = 'none'
                    }
                } else if (param.global.general.development.devmode) {
                    display = 'dev';
                } else {
                    display = 'none';
                }

                if (display !== 'none') {
                    if (display === 'regular') { className += ' displayed' } else if (display === 'dev') { className += ' button-development displayed dev' }
                    //For a 'skip' button, the button is added to the page, not the page content
                    skip = makeElement(className, text[k].texts[language]);
                    pageDiv.appendChild(skip);
                    //Defining the behavior of the button on click
                    onClickE(skip, true, function() {
                        //Go to the next page
                        changePage(param, 'next', false);
                    });
                }
            }
            if (text[k].type === 'results') {
                if (param.results) {
                    let mapContainer = document.getElementById('results-container');
                    let userMap = document.getElementById('map-results-user-container');
                    let otherMap = document.getElementById('map-results-other-container');
                    let userOverlay = makeElement('map-menu-overlay');
                    let otherOverlay = makeElement('map-menu-overlay');
                    userMap.appendChild(userOverlay);
                    otherMap.appendChild(otherOverlay);

                    generateResultsMaps(param, function() {
                        let refreshbutton = document.getElementById('refresh-results');
                        refreshbutton.addEventListener('click', function(event) {
                            ++param.results.index;
                            refreshResults(param, function(results) {
                                param['results'] = results;
                                generateResultsMaps(param, function() {});
                            })
                        })
                    });

                    function generateResultsMaps(param, callback) {
                        let results = param.results;
                        let refresh = document.getElementById('refresh-results');
                        let widthReal = param.global.general.canvas.width;
                        let heightReal = param.global.general.canvas.height;
                        let width = Math.floor((pageContent.clientWidth - 100) / 2);
                        let height = (width * heightReal) / widthReal;
                        let ratio = width / widthReal;

                        mapContainer.style.maxHeight = height + 'px';
                        userMap.style.width = widthReal + 'px';
                        userMap.style.height = heightReal + 'px';
                        userMap.style.transform = 'scale(' + ratio + ')';
                        otherMap.style.width = widthReal + 'px';
                        otherMap.style.height = heightReal + 'px';
                        otherMap.style.transform = 'translate(-' + (widthReal - width - 50) + 'px) scale(' + ratio + ')';
                        refresh.style.transform = 'translate(-' + (widthReal - width - 25) + 'px)';

                        userOverlay.style.width = widthReal + 'px';
                        userOverlay.style.height = heightReal + 'px';
                        otherOverlay.style.width = widthReal + 'px';
                        otherOverlay.style.height = heightReal + 'px';

                        param.results['current'] = {
                            usermap: { basemap: false, center: false, zoom: false, type: false, map: false, view: false, layer: false, objectlayer: false },
                            othermap: { basemap: false, center: false, zoom: false, type: false, map: false, view: false, layer: false, objectlayer: false }
                        }

                        let size = { height: heightReal, width: widthReal }

                        createResultsMap(userMap, 'map-results-user', results, 'usermap', size, param, function(r) {
                            createResultsMap(otherMap, 'map-results-other', results, 'othermap', size, r, function(p) {
                                callback();
                            });
                        });
                    }

                    function refreshResults(param, success) {
                        $.ajax({
                            url: "refresh-results/",
                            type: 'POST',
                            data: {
                                csrfmiddlewaretoken: document.querySelector('[name=csrfmiddlewaretoken]').value,
                                data: JSON.stringify({
                                    user: param.user,
                                    index: param.results.index
                                })
                            },
                            success: function(results) {
                                success(results);
                            }
                        })
                    }
                }
            }
        }

        //Set the scroll position to the top
        document.getElementById('page').scrollTo(0, 0);

        /**
         * Construct the html element depending on the page content of the configuration page
         *
         * @param {obj} texts: The object containing all the texts.
         * @param {int} pagenb: The number of the current page.
         * @param {ele} pageHTMLDiv: The html object of the page container.
         * @param {ele} object: The html object of the page content.
         */
        function constructDiv(param, page, content, element) {
            let checkboxes = param.global.checkboxes;
            let forms = param.global.forms;
            let pagenb = param.currentpage.page;
            let object = param.global.pages[pagenb - 1][element];
            let language = param.currentpage.language;
            let div = document.createElement('div');
            //Handling titles, subtitles and hints
            let type = object.type;
            if (type === 'title' || type === 'subtitle' || type === 'hint' || type === 'tips') {
                div = makeElement('menu-' + type + ' menu-text', object.texts[language]);
            }
            //Handling paragraphs
            else if (type === 'paragraph') {
                //Paragraph objects are stored inside a container
                div = makeElement('paragraph-container');
                //Paragraphs objects inside the array are appended to the container div
                for (let i = 0; i < object.texts[language].length; ++i) {
                    let paragraph = makeElement('menu-paragraph menu-text', object.texts[language][i]);
                    applyStyle(paragraph, { textAlign: object.alignment });
                    div.appendChild(paragraph);
                };

            }
            //Handling lists
            else if (type === 'list') {
                div = makeElement('list-container');
                div.appendChild(createList(object.texts[language], object.ordered, 1));
                if (object.duration) {
                    let totalDuration = object.duration.texts[language] + ' <b>' + round5(formatTime(estimateFullDuration(param), 's', 'mm')) + ' ' + object.duration.units[language] + '</b>.';
                    let dura = createListElement(totalDuration, 1);
                    div.childNodes[0].appendChild(dura);
                }
                if (object.header) {
                    let header = makeElement('list-header menu-text', object.header.texts[language]);
                    header.style.textAlign = object.header.alignment;
                    div.insertBefore(header, div.firstChild);
                }
            } else if (type === 'separator') {
                let separatorType = '';
                let style = { width: object.style.width + '%' };
                if (object.style.type === 'gradient') {
                    separatorType = ' separator-gradient';
                    style['height'] = object.style.thickness + 'px';
                } else {
                    style['borderTopWidth'] = object.style.thickness + 'px';
                    if (object.style.type === 'plain') {
                        separatorType = ' separator-plain';
                    } else if (object.style.type === 'dashed') {
                        separatorType = ' separator-dashed';
                    } else {
                        throw object.style.type + " separator type doesn't exists, check your text configuration file.";
                    }
                }
                div = makeElement('separator' + separatorType);
                div = applyStyle(div, style);
            } else if (type === 'checkbox') {
                //Incrementing the checkbox number on the page.
                ++nbCheckbox;
                //Checkbox is put inside a container
                div = makeElement('checkbox-container');
                //Creating the checkbox
                let checkbox = makeElement('checkbox', false, 'checkbox' + nbCheckbox);
                let c = false;
                //If checkbox(es) already exists on the page
                if (typeof checkboxes['page' + pagenb] !== "undefined") {
                    //If the current checkbox already exists
                    if ('checkbox' + nbCheckbox in checkboxes['page' + pagenb]) {
                        //If the current checkbox was checked
                        if (checkboxes['page' + pagenb]['checkbox' + nbCheckbox].checked) {
                            //Resetting checkbox to 'checked'
                            addClass(checkbox, 'checked');
                            c = true;
                        }
                    }
                }
                //There's no checkbox(es) on the page
                else {
                    //Creating an array for the page checkbox(es)
                    checkboxes['page' + pagenb] = {};
                }
                //Adding the checkbox to the parameters
                checkboxes['page' + pagenb]['checkbox' + nbCheckbox] = {
                    checked: c,
                    mandatory: object.mandatory,
                    stayChecked: object.stayChecked,
                };
                //Add an asterisk to the label if the checkbox is mandatory
                let labelCheckbox;
                let labelContent = object.texts[language];
                if (object.mandatory) {
                    mandatoryHint = true;
                    labelCheckbox = '* ' + labelContent;
                } else {
                    labelCheckbox = labelContent;
                }
                //Creating the checkbox label
                let label = makeElement('checkbox-label', labelCheckbox);
                //Setting the behavior of the checkbox on click
                let activeCheckbox = checkboxes['page' + pagenb]['checkbox' + nbCheckbox];
                onClickE(checkbox, false, function() {
                    if (hasClass(checkbox, 'checked')) {
                        removeClass(checkbox, 'checked');
                        activeCheckbox.checked = false;
                    } else {
                        addClass(checkbox, 'checked');
                        activeCheckbox.checked = true;
                    }
                });
                div.append(checkbox, label);
            } else if (type === 'form') {
                //Incrementing the choice number on the page.
                ++nbForm;
                div = makeElement('form-container');

                //If the form already exists
                if (typeof forms['page' + pagenb] === "undefined") {
                    //Creating an array for the page questions
                    forms['page' + pagenb] = {};
                }

                generateQuestions(object.content, false);

                function generateQuestions(content, hidden) {
                    for (let i = 0; i < content.length; ++i) {
                        ++nbQuestion;
                        let obj = content[i];
                        let cascading;
                        'cascading' in obj ? cascading = true : cascading = false;
                        createQuestion(obj, cascading, hidden);
                    }
                }

                function createQuestion(object, cascading, hidden) {
                    //Adding the question to the form if it doesn't already exists
                    if (!('question' + nbQuestion in forms['page' + pagenb])) {
                        forms['page' + pagenb]['question' + nbQuestion] = {
                            answers: {},
                            mandatory: object.mandatory,
                            stayChecked: object.stayChecked,
                        }
                    }
                    let answers = forms['page' + pagenb]['question' + nbQuestion].answers;

                    let classname = '';
                    if (hidden) { classname = ' hidden-question' }

                    let container = makeElement('form-question-container' + classname, false, 'question' + nbQuestion);
                    if (hidden) {
                        container.style.height = '0';
                        container.style.margin = '0';
                    }

                    let textQuestion;
                    let labelQuestion = object.question.text[language];
                    if (object.mandatory) {
                        mandatoryHint = true;
                        textQuestion = '* ' + labelQuestion;
                    } else {
                        textQuestion = labelQuestion;
                    }

                    if ('svg' in object.question) {
                        let name = object.question.svg;
                        let svgcontainer = makeElement('form-svg-container');
                        let svg = makeElement('form-svg form-svg-question', `<img src='../static/anchorwhat/img/${name}.svg' />`);
                        svgcontainer.appendChild(svg);
                        container.append(svgcontainer);
                    }

                    let question = makeElement('form-question menu-text', textQuestion);
                    container.append(question);

                    let cascadeAnswer, cascadeNumber, cascadeOverallNumber;
                    if (cascading) {
                        cascadeAnswer = object.cascading.answer;
                        cascadeNumber = object.cascading.content.length;
                        cascadeOverallNumber = getNumberOfCascades(object.cascading.content);
                    }

                    for (let j = 0; j < object.items.length; ++j) {
                        let e = object.items[j];
                        let nbItem = nbQuestion;
                        if (e.type === 'button' || e.type === 'svg') {
                            let classname, content, svg;
                            if (e.type === 'button') {
                                classname = 'form-button-container';
                                content = e.texts[language];
                                svg = false;
                            } else if (e.type === 'svg') {
                                classname = 'form-svg-container';
                                content = e.content;
                                svg = true;
                            }
                            let buttonContainer = makeElement(classname + ' form-items');
                            let active = true;
                            for (let k = 0; k < content.length; ++k) {
                                let answer = k + 1;
                                let id = 'question' + nbQuestion + '-items' + (j + 1) + '-button' + (k + 1);
                                let status = '';
                                if (!([id] in answers)) {
                                    answers[id] = false
                                } else {
                                    if (answers[id]) {
                                        status = ' selected';
                                    }
                                }

                                let button;
                                if (svg) {
                                    button = makeElement('form-svg-answer form-svg form-item form-item' + nbQuestion + status, `<img src='../static/anchorwhat/img/${content[k]}.svg' />`, id);
                                    button.setAttribute('value', content[k]);
                                } else {
                                    button = makeElement('button form-button form-item form-item' + nbQuestion + status, content[k], id);
                                }

                                button.setAttribute('multiple', e.multiple);
                                onClickE(button, false, function(el) {
                                    if (active) {
                                        active = false;
                                        let target;
                                        svg ? target = el.target.parentNode : target = el.target
                                        if (hasClass(target, 'selected')) {
                                            removeClass(target, 'selected');
                                            answers[id] = false;
                                            if (cascading) {
                                                if (answer === cascadeAnswer) {
                                                    handleHiddenQuestions(nbItem, cascadeOverallNumber, false, function() { active = true });
                                                } else {
                                                    waitMap(0.5, function() { active = true })
                                                }
                                            } else {
                                                active = true
                                            }
                                        } else {
                                            manageChoices(object.multiple, e.multiple, nbItem);
                                            addClass(target, 'selected');
                                            answers[id] = true;
                                            if (cascading) {
                                                if (answer === cascadeAnswer) {
                                                    handleHiddenQuestions(nbItem, cascadeNumber, true, function() { active = true });
                                                } else {
                                                    handleHiddenQuestions(nbItem, cascadeOverallNumber, false, function() { active = true });
                                                }
                                            } else {
                                                active = true
                                            };
                                        }
                                    }
                                })
                                buttonContainer.appendChild(button);
                            }
                            container.append(buttonContainer);
                        } else if (e.type === 'input') {
                            let screenWidth = document.getElementById('container').clientWidth;
                            let inputContainer = makeElement('form-input-container form-items');
                            let id = 'question' + nbQuestion + '-items' + (j + 1) + '-input';
                            let input = makeElement('form-input form-item form-item' + nbQuestion, false, id);
                            input.setAttribute('contenteditable', 'true');
                            input.setAttribute('placeholder', e.texts[language]);
                            input.setAttribute('spellcheck', 'false');
                            input.style.width = calculateTextWidth(e.texts[language], getComputedStyle(input)) + 'px';

                            if (!([id] in answers)) {
                                answers[id] = false;
                                addClass(input, 'placeholder');
                                resetInput(input);
                            } else {
                                if (answers[id]) {
                                    addClass(input, 'selected');
                                    input.innerHTML = answers[id];
                                } else {
                                    addClass(input, 'placeholder');
                                    resetInput(input);
                                }
                            }

                            $(input).focusin(function() {
                                if (this.innerHTML === e.texts[language]) {
                                    this.innerHTML = '';
                                    removeClass(this, 'placeholder');
                                    this.style.width = calculateTextWidth(this.innerHTML, getComputedStyle(this)) + 'px';
                                }
                            });
                            $(input).focusout(function() {
                                if (this.innerHTML === '' || input.innerHTML === '<br>' || input.innerHTML === '<empty string>') {
                                    this.innerHTML = e.texts[language];
                                    addClass(this, 'placeholder');
                                    removeClass(this, 'selected');
                                    this.style.width = calculateTextWidth(this.innerHTML, getComputedStyle(this)) + 'px';
                                    answers[id] = false;
                                } else {
                                    manageChoices(object.multiple, e.multiple, nbItem);
                                    addClass(this, 'selected');
                                    answers[id] = this.innerHTML;
                                }
                                clearSelection();
                            });
                            $(input).keypress(function(event) {
                                if (event.which == 13) {
                                    event.preventDefault();
                                    event.target.blur();
                                }
                            });
                            input.addEventListener('input', function(el) {
                                let width = calculateTextWidth(el.target.innerHTML, getComputedStyle(el.target))
                                if (width < ((screenWidth * 30) / 100)) {
                                    el.target.style.width = width + 'px';
                                }
                            })
                            inputContainer.append(input);
                            container.appendChild(inputContainer);
                        }
                    }
                    div.appendChild(container);

                    if (cascading) { generateQuestions(object.cascading.content, true); }
                }

                function manageChoices(multipleG, multipleS, itemNb) {
                    let elements = document.getElementsByClassName('form-item' + itemNb);
                    //Checking if multiple input is allowed
                    if (multipleG) {
                        //Checking if button can be in a multiple selection
                        if (multipleS) {
                            for (let k = 0; k < elements.length; ++k) {
                                if (elements[k].getAttribute('multiple') === 'false') {
                                    deselectItem(elements[k], itemNb);
                                }
                            }
                        } else {
                            for (let k = 0; k < elements.length; ++k) {
                                if (hasClass(elements[k], 'selected')) {
                                    deselectItem(elements[k], itemNb);
                                }
                            }
                        }
                    } else {
                        for (let k = 0; k < elements.length; ++k) {
                            if (hasClass(elements[k], 'selected')) {
                                deselectItem(elements[k], itemNb);
                            }
                        }
                    }
                }

                function deselectItems(items, nbQuest) {
                    for (let k = 0; k < items.length; ++k) {
                        deselectItem(items[k], nbQuest);
                    }
                }

                function deselectItem(item, nbQuest) {
                    if (hasClass(item, 'form-input')) {
                        resetInput(item);
                    }
                    removeClass(item, 'selected');
                    forms['page' + pagenb]['question' + nbQuest].answers[item.getAttribute('id')] = false;
                }

                function resetInput(el) {
                    el.innerHTML = el.getAttribute('placeholder');
                    el.style.width = calculateTextWidth(el.innerHTML, getComputedStyle(el)) + 'px';
                }

                function handleHiddenQuestions(question, increment, unfold, callback) {
                    let questions = [];
                    for (let q = 1; q < (increment + 1); ++q) {
                        questions.push(document.getElementById('question' + (question + q)));
                    }
                    if (unfold) {
                        for (let nb = 0; nb < questions.length; ++nb) {
                            questions[nb].style.height = questions[nb].scrollHeight + 'px';
                            questions[nb].style.margin = null;
                        }
                        waitMap(0.5, function() {
                            removeClassList(questions, 'hidden-question');
                            callback();
                        })
                    } else {
                        addClassList(questions, 'hidden-question');
                        waitMap(0.5, function() {
                            for (let nb = 0; nb < questions.length; ++nb) {
                                questions[nb].style.height = '0';
                                questions[nb].style.margin = '0';
                                deselectItems(document.getElementsByClassName('form-item' + (question + (nb + 1))), (question + (nb + 1)));
                            }
                            callback();
                        })
                    }
                }

                function getNumberOfCascades(content) {
                    let cascades = 0;
                    for (let n = 0; n < content.length; ++n) {
                        ++cascades;
                        if ('cascading' in content[n]) {
                            cascades += getNumberOfCascades(content[n].cascading.content);
                        }
                    }
                    return cascades;
                }
            } else if (type === 'button') {
                //handling 'back' button
                if (object.effect === 'back') {
                    if ((param.global.general.development.devmode === false && object.dev === false) || param.global.general.development.devmode) {
                        let className;
                        if (object.dev) { className = 'button button-back button-development dev'; } else { className = 'button button-back'; }
                        //For a 'back' button, the button is added to the page, not the page content
                        content = page;
                        div = makeElement(className, object.texts[language]);
                        //Defining the behavior of the button on click
                        onClickE(div, true, function() {
                            //Return to the previous page
                            changePage(param, 'back', false);
                        });
                    }
                }
                //handling 'next' button
                else if (object.effect === 'next') {
                    div = makeElement('button-container');
                    let button = makeElement('button', object.texts[language]);
                    button.addEventListener("click", createNextButton);

                    function createNextButton() {
                        button.removeEventListener("click", createNextButton);
                        changePage(param, 'next', false);
                    }
                    div.appendChild(button);
                }
                //handling 'registration' button
                else if (object.effect === 'registration') {
                    div = makeElement('button-container');
                    let button = makeElement('button', object.texts[language]);
                    button.addEventListener("click", createRegistrationButton);

                    function createRegistrationButton() {
                        if (!(document.getElementById('alert-container'))) {
                            let alrt = false;
                            //Checking if checkboxes are present on the page
                            if (typeof checkboxes['page' + pagenb] !== "undefined") {
                                //Looping through the page checkbox(es)
                                Object.keys(checkboxes['page' + pagenb]).forEach(function(key) {
                                    let ch = checkboxes['page' + pagenb][key];
                                    //Checking the presence of a mandatory checkbox
                                    if (ch.mandatory) {
                                        //Checking if the mandatory checkbox is checked
                                        if (ch.checked === false) {
                                            alrt = true;
                                        }
                                    }
                                });
                            }
                            if (alrt) {
                                let t = param.global.texts;
                                //Hiding the page and the footer
                                hide('page', 'footer');
                                if (param.currentpage.scroller) {
                                    hide('scroller-container');
                                }
                                displayAlert({
                                    alert: t.alert.conditions.label[language],
                                    button: t.alert.conditions.button[language]
                                }, param);

                            } else {
                                button.removeEventListener("click", createNextButton);
                                changePage(param, 'next', 'registration');
                            }
                        }
                    }
                    div.appendChild(button);
                }
                //handling 'form' button
                else if (object.effect === 'form') {
                    div = makeElement('button-container');
                    let button = makeElement('button button-form', object.texts[language]);
                    div.appendChild(button);
                }
                //handling 'start' button
                else if (object.effect === 'start') {
                    div = makeElement('button-container');
                    let button = makeElement('button', object.texts[language]);
                    let sessionEstimate;
                    let s = param.experiment;
                    if (object.training) {
                        param.currentsession['training'] = true;
                        param.currentsession['session'] = object.training;
                        sessionEstimate = s.trainings[object.training - 1];
                    } else if (object.session) {
                        param.currentsession['training'] = false;
                        param.currentsession['session'] = object.session;
                        sessionEstimate = s.sessions[object.session - 1];
                    }

                    param.currentsession['language'] = param.currentpage.language;

                    //Defining the behavior of the 'start' button
                    onClickE(button, true, function() {
                        updatePageTime(param);

                        //Generate a session or a training session
                        generateSet(param);

                        //Wait 0.5 sec before hiding the menu
                        waitMap(0.5, function() {
                            hide('menu-container');
                            //Wait 1 sec before destroying the page and the footer
                            waitMap(1, function() {
                                let pagehtml = document.getElementById('page');
                                pagehtml.remove();
                                let footer = document.getElementById('footer');
                                footer.remove();
                            });
                        });
                    });

                    //Calculating the duration of the session/training session
                    let estimation = estimateSessionDuration(param, sessionEstimate);
                    let timeEstimation = makeElement('menu-text-button duration', estimateDuration(estimation, language));
                    div.appendChild(button);
                    div.appendChild(timeEstimation);
                }
            }
            //Handling image type
            else if (type === 'image') {
                div = makeElement('menu-image-container');
                for (let img = 0; img < object.content.length; ++img) {
                    let image = object.content[img];
                    let file = image.name + '.' + image.format;
                    let imagecontent;
                    if ('link' in image) {
                        imagecontent = `<a href='${image.link}' target='_blank'><img src='../static/anchorwhat/img/${file}'/></a>`
                    } else {
                        imagecontent = `<img src='../static/anchorwhat/img/${file}'/>`
                    }
                    let imgDiv = makeElement('menu-image', imagecontent);
                    applyStyle(imgDiv, image.style);
                    div.appendChild(imgDiv);
                }
            }
            //Handling results type
            else if (type === 'results') {
                if (param.results) {
                    let mapContainer = makeElement('results-container map-results-container', false, 'results-container');
                    let mapUser = makeElement('map-results', false, 'map-results-user-container');
                    let refresh = makeElement('refresh', `<img src='../static/anchorwhat/img/refresh.svg' />`, 'refresh-results');
                    let mapOther = makeElement('map-results', false, 'map-results-other-container');
                    mapContainer.append(mapUser, refresh, mapOther);
                    pageContent.appendChild(mapContainer);
                } else {
                    console.log('no results');
                }
            }
            //Handling special objects type           
            else if (type === 'special') {
                //Incrementing the special object number on the page.
                ++nbSpecial;

                //Special objects are put inside a container
                div = makeElement('special-menu-container', false, 'special-menu-container' + nbSpecial);

                //Looping the special objects array
                for (let i = 0; i < object.items.length; ++i) {
                    //If a map object is found
                    if (object.items[i].type === 'map') {
                        //Incrementing the map number on the page.
                        ++nbMap;
                        //Creating the map container
                        let mapTutoID = 'map-menu' + nbMap;
                        let mapDiv = makeElement('map-menu map', false, mapTutoID);
                        mapDiv = applyStyle(mapDiv, object.items[i].style);

                        let overlay = makeElement('map-menu-overlay');
                        overlay = applyStyle(overlay, object.items[i].style)

                        if ('overlay' in object.items[i]) {
                            addClass(overlay, 'map-menu-overlay-' + object.items[i].overlay.alignment);
                            addClass(overlay, 'map-menu-overlay-hover');
                            if (object.items[i].overlay.background) {
                                addClass(overlay, 'map-menu-overlay-hover-back');
                            } else {
                                addClass(overlay, 'map-menu-overlay-hover-noback');
                            }
                            let overlayContent = makeElement('map-overlay-content', object.items[i].overlay.label[language]);
                            overlayContent = applyStyle(overlayContent, object.items[i].overlay.style)
                            overlay.appendChild(overlayContent);
                            mapDiv.appendChild(overlay);
                        }

                        mapDiv.appendChild(overlay);
                        div.appendChild(mapDiv);
                    }
                }
            } else {
                throw ('Menu object is not valid. ' + Object.keys(object)[0].toString() + " is not handled. Check your config.js file.");
            }

            //Appending the new div to the page element
            if ('span' in object) {
                addClass(div, object.span);
            }
            content.appendChild(div);
        }
    } catch (e) {
        console.log(e);
    }
};