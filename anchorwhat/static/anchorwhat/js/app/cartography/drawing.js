/**
 * @drawing
 * Defines the drawing tools.
 */

function drawingMode(param, callback) {
    let training = param.currentsession.training;
    // let training = false;
    // Retrieving the colors to use for the different canvas
    let colors = param.global.texts.experiment.layers.colors;

    // Definition of default properties
    let minHeight = param.global.general.canvas.height;
    let minWidth = param.global.general.canvas.width;

    let defaultBrushSize = 50;
    let minBrushSize = 10;
    let maxBrushSize = 150;
    let brushSizeIncrement = 5;
    let currentBrushSize = defaultBrushSize;
    let currentColor = colors[0];
    let currentLayer = 1;
    let currentImportance = 2;
    let mousedown = false;
    let time;

    // Activate recording to create a json file containing all the user's actions
    // Do not use with training active
    let recording = false;
    let record = [{
        type: 'start',
        time: new Date()
    }];

    // Selection of the current language
    let language = param.currentsession.language;

    let maskcontainer = document.getElementById('mask-container');
    let mask1 = makeElement('border-mask border-mask-area', false, 'border-mask-top');
    let mask2 = makeElement('border-mask border-mask-area', false, 'border-mask-bottom');
    let mask3 = makeElement('border-mask border-mask-area', false, 'border-mask-left');
    let mask4 = makeElement('border-mask border-mask-area', false, 'border-mask-right');
    let mask5 = makeElement('border-mask border-mask-tuto', false, 'border-mask-inner');
    let questioncontainer = makeElement('drawing-question-container hidden');
    let questionlabel = makeElement('drawing-question-label', param.global.texts.experiment.question.question[language], 'tutorial-main-label');
    let questionbutton = makeElement('drawing-question-button button', param.global.texts.experiment.question.button[language]);

    maskcontainer.append(mask5);

    if (param.currenttest.number === 1 || training) {
        questioncontainer.append(questionlabel, questionbutton);
        mask5.appendChild(questioncontainer);
        questionbutton.addEventListener('click', function(event) {
            hideE(questioncontainer);
            waitMap(0.5, function() {
                hideE(mask5);
                if (training) { launchTutorial(param) }
                waitMap(0.5, function() {
                    remove(mask5);
                })
            })
        })
        waitMap(0.5, function() {
            styleBorder();
            waitMap(0.5, function() {
                displayE(questioncontainer);
            })
        })
    } else {
        waitMap(0.5, function() {
            styleBorder();
            waitMap(0.5, function() {
                hideE(mask5);
                waitMap(0.5, function() {
                    remove(mask5);
                })
            })
        })
    }

    // Creation of the drawing area
    let drawing = makeElement(false, false, 'drawing');

    let hints = param.global.texts.experiment.hints;
    let hintcontainer = makeElement('hint-container hidden');
    let hintquestion = makeElement('hint-element tutorial-main-label hint-question', hints[0][language]);
    let hintlayer = makeElement('hint-element tutorial-main-label hint-layer', hints[1][language]);
    let hintimportance = makeElement('hint-element tutorial-main-label hint-importance', hints[2][language]);
    let hintundo = makeElement('hint-element tutorial-main-label hint-undo', hints[3][language]);
    let hintclear = makeElement('hint-element tutorial-main-label hint-clear', hints[4][language]);
    let hintvalidation = makeElement('hint-element tutorial-main-label hint-validation', hints[5][language]);
    hintcontainer.append(hintquestion, hintlayer, hintimportance, hintundo, hintclear, hintvalidation);
    drawing.appendChild(hintcontainer);

    maskcontainer.append(mask1, mask2, mask3, mask4, drawing);
    // Adding the drawing area to the container
    styleBorderNone();

    // Initialization of canvases properties to use throughout the session
    let canvases = {
        // The number of layers containing at least one object
        layersContainingObjects: 0,
        canvas: {}
    };

    // Creation of the hidden validation button
    let validation = makeElement('drawing-control validation-control');
    let validationcontainer = makeElement('validation-container');
    let validationprogress = makeElement('validation-progress', false, 'validation-progress');
    let inner = '5 ' + param.global.texts.experiment.progress.missing[language];
    let validationbutton = makeElement('validation-button button', inner);

    validationprogress.style.width = '0%';

    validationbutton.addEventListener('click', function(event) {
        if (hasClass(event.target, 'active')) {
            if (recording) {
                for (let r = 0; r < record.length; ++r) {
                    if (record[r].type === 'move') {
                        record[0]['coordinate'] = record[r].value[0];
                        break;
                    }
                }
                record.push({
                    type: 'end',
                    time: new Date()
                })
                let data = 'text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(record));
                let a = document.createElement('a');
                a.href = 'data:' + data;
                a.download = 'data.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }

            let results = {
                objects: []
            };
            Object.keys(canvases.canvas).forEach(function(key) {
                let paths = [];
                let objects = canvases.canvas[key].objects;
                for (o = 0; o < objects.length; ++o) {
                    paths.push({
                        geometry: objects[o].geometry,
                        thickness: objects[o].thickness,
                        buffer: pxToMeters(objects[o].thickness, param.currenttest.zoom, param),
                        importance: canvases.canvas[key].importance
                    });
                }
                results.objects.push(paths);
            });

            let inputs = document.getElementsByClassName('color-picker-input');
            results['layers'] = [];
            for (inp = 0; inp < inputs.length; ++inp) {
                let answer = inputs[inp];
                if (answer.innerHTML === param.global.texts.experiment.layers.placeholders[language]) {
                    answer = 'not named'
                } else {
                    answer = answer.innerHTML.replace('<br>', ' ');
                }
                results.layers.push(answer);
            }
            callback(results);
        }
    });

    validationcontainer.append(validationprogress, validationbutton);
    validation.appendChild(validationcontainer);
    drawing.appendChild(validation);

    let help = makeElement('help-button active', `<img src='../static/anchorwhat/img/help.svg' />`);
    let controlwasactive = false;
    help.addEventListener('mouseenter', function(event) {
        displayE(hintcontainer);
        let controlbuttons = document.getElementsByClassName('canvas-container active')[0].parentNode.getElementsByClassName('drawing-control-button');
        addClassList(controlbuttons, 'active');
    });
    help.addEventListener('mouseleave', function(event) {
        hideE(hintcontainer);
        if (controlwasactive === false) {
            let controlbuttons = document.getElementsByClassName('canvas-container active')[0].parentNode.getElementsByClassName('drawing-control-button');
            removeClassList(controlbuttons, 'active');
        }
    });
    drawing.appendChild(help);

    // Creation of the different layers
    let colorcontainer = makeElement('color-container', false, 'color-container');

    // Creation of a canvas that will contain the custom brush cursor
    let cur = document.createElement('canvas');
    cur.setAttribute('id', 'cursor');
    cur.setAttribute('class', 'hidden');
    drawing.appendChild(cur);
    // Instanciation of a new canvas
    let cursor = new fabric.StaticCanvas('cursor', {
        height: minHeight,
        width: minWidth,
    });
    // Instanciation of a new circle for the brush
    let mousecursor = new fabric.Circle({
        left: -100,
        top: -100,
        radius: currentBrushSize / 2,
        fill: currentColor,
        stroke: 'white',
        strokeWidth: 2,
        originX: 'center',
        originY: 'center'
    });
    // Adding the circle object to the canvas
    cursor.add(mousecursor);

    // Looping through all layers with our colors
    for (i = 0; i < colors.length; ++i) {
        // Storing the index to use with event listeners
        let index = i;
        // Creation of the drawing container
        let drawingcontainer = makeElement('drawing-container');

        // Adding layer informations
        canvases.canvas[index] = {
            color: colors[index],
            importance: 2,
            // Objects is an array that will contain drawn objects
            objects: []
        }

        // Creating a canvas object for the drawable area of the layer
        let can = document.createElement('canvas');
        can.setAttribute('id', 'canvas' + (i + 1));
        can.setAttribute('class', 'canvas');
        drawingcontainer.appendChild(can);

        // Creating the color mark to switch to this layer
        let colorinput = makeElement('color-input-container', false, 'color-picker' + (i + 1));
        let color = makeElement('color-picker', `<img src='../static/anchorwhat/img/validate.svg' />`);
        color.style.backgroundColor = canvases.canvas[index].color;

        let placeholder = param.global.texts.experiment.layers.placeholders[language];
        let inputContainer = makeElement('form-input-container');
        let input = makeElement('form-input color-picker-input placeholder', placeholder);
        input.setAttribute('contenteditable', 'true');
        input.setAttribute('placeholder', placeholder);
        input.setAttribute('spellcheck', 'false');
        input.style.backgroundColor = canvases.canvas[index].color;
        input.style.width = calculateTextWidth(placeholder, getComputedStyle(input)) + 'px';

        $(input).focusin(function() {
            if (this.innerHTML === placeholder) {
                this.innerHTML = '';
                removeClass(this, 'placeholder');
                this.style.width = calculateTextWidth(this.innerHTML, getComputedStyle(this)) + 'px';
            }
        });
        $(input).focusout(function() {
            if (this.innerHTML === '' || input.innerHTML === '<br>' || input.innerHTML === '<empty string>') {
                this.innerHTML = placeholder;
                addClass(this, 'placeholder');
                removeClass(this, 'selected');
                this.style.width = calculateTextWidth(placeholder, getComputedStyle(this)) + 'px';
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
            if (width < ((document.getElementById('drawing').clientWidth * 15) / 100)) {
                el.target.style.width = width + 'px';
            }
        })
        inputContainer.appendChild(input);
        colorinput.append(color, inputContainer);
        colorcontainer.appendChild(colorinput);

        // Creation of the controls for each layers
        let controls = param.global.texts.experiment.layers.controls;
        let controlcontainer = makeElement('drawing-control-container');
        // Looping through the different controls
        for (c = 0; c < controls.length; ++c) {
            let name = controls[c].name;
            let layercolor = canvases.canvas[index].color;
            // Creating DOM elements of the control
            let cont = makeElement('drawing-control');
            let button = makeElement('drawing-control-button ' + name + '-button', `<img src='../static/anchorwhat/img/${name}.svg' />`);
            // Setting the backgroung color of the button according to the layer's color
            button.style.backgroundColor = layercolor;
            // Defining the event triggered when clicking on the control button
            button.addEventListener('click', function(event) {
                let type;
                let time = new Date();
                // Variable to store the number of remaining objects on the layer
                let left;
                // Retrieving the objects in the canvas
                let o = canvas.getObjects();
                if (o.length > 0) {
                    if (name === 'clear') {
                        type = 'clear';
                        // If the button is of type 'clear', it removes all the objects...
                        for (let obj = 0; obj < o.length; ++obj) {
                            o[obj].animate({
                                opacity: 0
                            }, {
                                onChange: canvas.renderAll.bind(canvas),
                                duration: 200
                            })
                            waitMap(0.2, function() { canvas.remove(o[obj]); });
                            canvases.canvas[index].objects = [];
                        }
                        // ...so there is no object left
                        left = 0;
                    } else if (name === 'undo') {
                        type = 'undo';
                        // If the button if of type 'undo', it removes the last drawn object
                        o[o.length - 1].animate({
                            opacity: 0
                        }, {
                            onChange: canvas.renderAll.bind(canvas),
                            duration: 200
                        });
                        // It removes the last object from the canvases properties as well
                        canvases.canvas[index].objects.pop();
                        // Recounting the number of objects
                        left = o.length - 1;
                        waitMap(0.2, function() {
                            canvas.remove(o[o.length - 1]);
                        });
                    }
                } else {
                    left = 0;
                }

                // If no objects are left on the layer, deactivating control buttons
                if (left === 0) {
                    let buttons = controlcontainer.getElementsByClassName('drawing-control-button');
                    removeClassList(buttons, 'active');
                    removeClass(color, 'validated');
                    controlwasactive = false;
                    if (canvases.layersContainingObjects > 0) {
                        --canvases.layersContainingObjects;
                    }
                }

                // If the number of layers containing at least one object is lower than the actual number of layers
                if (canvases.layersContainingObjects < colors.length) {
                    // Deactivate the validation button
                    removeClass(validationbutton, 'active');
                    let inner = (colors.length - canvases.layersContainingObjects) + ' ' + param.global.texts.experiment.progress.missing[language];
                    validationbutton.innerHTML = inner;
                }

                let percent = (100 * canvases.layersContainingObjects) / colors.length;
                let progress = document.getElementById('validation-progress');
                progress.style.width = percent + '%';

                if (recording) {
                    record.push({
                        type: type,
                        time: time
                    })
                }
            })

            // Creating a tooltip for the controls with the same background color as the layer
            let tooltip = makeElement('drawing-control-tooltip', controls[c].text[language]);
            tooltip.style.backgroundColor = canvases.canvas[index].color;
            // Displaying the tooltip when the mouse is over the control button
            button.addEventListener('mouseenter', function(event) {
                addClass(tooltip, 'active');
            })
            button.addEventListener('mouseleave', function(event) {
                removeClass(tooltip, 'active');
            })
            cont.append(tooltip, button);
            controlcontainer.appendChild(cont);
        }
        drawingcontainer.appendChild(controlcontainer)
        drawing.appendChild(drawingcontainer);

        // Creating a canvas object
        let canvas = new fabric.Canvas('canvas' + (i + 1), {
            // Activating free drawing mode
            isDrawingMode: true,
            // No cursor allowed, cursor is handled by an other canvas
            freeDrawingCursor: 'none',
            fireMiddleClick: true,
            height: minHeight,
            width: minWidth
        });

        // Setting the width and color of the free drawing brush
        canvas.freeDrawingBrush.width = currentBrushSize;
        canvas.freeDrawingBrush.color = colors[index];

        // Creating the importance level selector
        let text = param.global.texts.experiment.importance;
        let importancecontainer = makeElement('importance-container');
        let importancelabel = makeElement('importance-label', text.label[language]);
        importancelabel.style.backgroundColor = canvases.canvas[index].color;
        let importancelevelcontainer = makeElement('importance-level-container');

        // Looping through the different importance levels
        for (j = 0; j < text.value[language].length; ++j) {
            // Storing the new index to use with event listeners
            let newindex = j;

            // Storing the importance color
            let importancecolor = colors[index].slice(0, -4) + text.opacity[newindex] + ')';
            let importancelevel = makeElement('importance-level', text.value[language][newindex]);
            importancelevelcontainer.appendChild(importancelevel);
            importancelevel.setAttribute('value', newindex);
            importancelevel.style.backgroundColor = importancecolor;

            // Setting default importance level to average
            if (newindex === 1) {
                addClass(importancelevel, 'active');
            }

            // Adding an event triggered by selecting an other importance level
            importancelevel.addEventListener('click', function(event) {
                let etarget = event.target;
                if (hasClass(etarget, 'active') === false) {
                    // Storing the new importance color
                    canvases.canvas[index].color = colors[index].slice(0, -4) + text.opacity[newindex] + ')';

                    // Changing the active importance level if not already selected
                    if (hasClass(etarget, 'active') === false) {
                        removeClassList(importancelevelcontainer.getElementsByClassName('importance-level'), 'active');
                        addClass(etarget, 'active');
                    }

                    // Retrieving all objects from the active layer
                    let objects = canvas.getObjects();
                    // Looping through all the objects
                    for (let o = 0; o < objects.length; ++o) {
                        // Changing the color of all layer objects according to the selected importance
                        objects[o].set({
                            stroke: canvases.canvas[index].color
                        }).canvas.renderAll();
                    }
                    // Changing the color of the cursor...
                    mousecursor.setOptions({ fill: canvases.canvas[index].color });
                    // ...and the drawing brush...
                    canvas.freeDrawingBrush.color = canvases.canvas[index].color;
                    // ...and the layer button...
                    color.style.backgroundColor = canvases.canvas[index].color;
                    // ...and the label background...
                    importancelabel.style.backgroundColor = canvases.canvas[index].color;
                    // ...and the controls of the layer
                    let controls = controlcontainer.getElementsByClassName('drawing-control-button');
                    for (let k = 0; k < controls.length; ++k) {
                        controls[k].style.backgroundColor = canvases.canvas[index].color;
                    }

                    let time = new Date();
                    currentImportance = newindex + 1;
                    if (recording) {
                        record.push({
                            type: 'importance',
                            value: currentImportance,
                            time: time
                        })
                    }

                    //Updating layer results importance
                    canvases.canvas[index].importance = currentImportance;
                }
            })
            importancelevel.addEventListener('mouseenter', function() {
                addClass(importancelabel, 'active');
            })
            importancelevel.addEventListener('mouseleave', function() {
                removeClass(importancelabel, 'active');
            })
        }
        importancecontainer.append(importancelabel, importancelevelcontainer);
        drawingcontainer.appendChild(importancecontainer);

        // Initializing the active layer to be the first in the list
        if (i === 0) {
            addClass(color, 'active');
            addClass(can.parentElement, 'active');
            addClass(importancecontainer, 'active');
        }

        // Adding an event when clicking on the layer button, e.g. changing layer
        color.addEventListener('click', function(event) {
            // Modifications are made only if the layer is not already active
            if (hasClass(color, 'active') === false) {
                // Deactivating layer buttons, canvas, controls, importance selectors
                removeClassList(document.getElementsByClassName('color-picker'), 'active');
                removeClassList(document.getElementsByClassName('canvas-container'), 'active');
                removeClassList(document.getElementsByClassName('drawing-control-button'), 'active');
                removeClassList(document.getElementsByClassName('importance-container'), 'active');

                // Changing the color of the cursor and the canvas brush
                mousecursor.setOptions({ fill: canvases.canvas[index].color });
                canvas.freeDrawingBrush.color = canvases.canvas[index].color;
                // Resetting the width of the drawing brush
                canvas.freeDrawingBrush.width = currentBrushSize;

                // Activating the canvas, the importance selector and the layer button
                addClass(can.parentElement, 'active')
                addClassList(drawingcontainer.getElementsByClassName('importance-container'), 'active')
                addClass(color, 'active');

                // Displaying the control buttons if objects are present on the canvas
                if (canvas.getObjects().length > 0) {
                    addClassList(controlcontainer.getElementsByClassName('drawing-control-button'), 'active');
                    controlwasactive = true;
                }

                let time = new Date();
                currentLayer = index + 1;
                if (recording) {
                    record.push({
                        type: 'layer',
                        value: currentLayer,
                        time: time
                    })
                }
            }
        });

        canvas.on('mouse:down', function(event) {
            if (event.button === 1) {
                mousedown = true;
                if (recording) {
                    let mouse = canvas.getPointer(event);
                    let time = new Date();
                    record.push({
                        type: 'draw',
                        value: [
                            [mouse.x, mouse.y, time]
                        ]
                    })
                }
            }
        })

        canvas.on('mouse:up', function(event) {
            if (event.button === 1) {
                mousedown = false;
                if (recording) {
                    let mouse = canvas.getPointer(event);
                    let lastindex = record.length - 1;
                    let time = new Date();
                    record[lastindex].value.push([mouse.x, mouse.y, time]);
                }
            } else if (event.button === 2) {
                updateBrushSize(canvas, cursor, mousecursor, defaultBrushSize);
            }
        })

        // Defining behavior when finishing a drawing
        canvas.on('path:created', function(event) {
            // Displaying control buttons
            addClassList(controlcontainer.getElementsByClassName('drawing-control-button'), 'active');
            controlwasactive = true;

            // Incrementing the number of layers containing at least one object if none were found for this layer
            if (canvases.canvas[index].objects.length === 0) {
                ++canvases.layersContainingObjects;
            }

            let path = event.path;
            let offset = [drawing.offsetLeft, drawing.offsetTop];
            let geometry = pathToCoordinates(path.path, param, offset);

            // Inserting the path to the array of objects
            canvases.canvas[index].objects.push({
                path: path,
                geometry: geometry,
                thickness: currentBrushSize / 2
            });

            let percent = (100 * canvases.layersContainingObjects) / colors.length;
            let progress = document.getElementById('validation-progress');
            progress.style.width = percent + '%';

            addClass(color, 'validated');

            // Displaying validation button if all layers have at least one object
            if (canvases.layersContainingObjects === colors.length) {
                addClass(validationbutton, 'active');
                let inner = param.global.texts.experiment.progress.validation[language];
                validationbutton.innerHTML = inner;
            } else {
                let inner = (colors.length - canvases.layersContainingObjects) + ' ' + param.global.texts.experiment.progress.missing[language];
                validationbutton.innerHTML = inner;
            }
        })

        // Defining the cursor behavior when moving over the canvas
        canvas.on('mouse:move', function(event) {
            displayE(cur);
            // Setting the position of the cursor to the location of the mouse
            let mouse = canvas.getPointer(event);
            mousecursor.set({
                radius: currentBrushSize / 2,
                top: mouse.y,
                left: mouse.x
            }).setCoords().canvas.renderAll();

            if (recording) {
                let lastindex = record.length - 1;
                let time = new Date();
                if (record[lastindex].type === 'move' || (record[lastindex].type === 'draw' && mousedown)) {
                    record[lastindex].value.push([mouse.x, mouse.y, time]);
                } else {
                    record.push({
                        type: 'move',
                        value: [
                            [mouse.x, mouse.y, time]
                        ]
                    })
                }
            }
        });

        // Defining the cursor behavior when moving out of the canvas
        canvas.on('mouse:out', function() {
            hideE(cur);
            mousecursor.animate({
                radius: 0
            }, {
                onChange: cursor.renderAll.bind(cursor),
                duration: 100
            })
        });

        // Defining the cursor behavior when using the mouse wheel
        canvas.on('mouse:wheel', function(event) {
            if (mousedown === false) {
                // Assigning the current brush size to the new brush size
                let newvalue = currentBrushSize;
                let recorded = false;
                // If the wheel is rotated upwards
                if (event.e.deltaY < 0) {
                    // Modifying the value only if its lower than the max allowed size
                    if (currentBrushSize < maxBrushSize) {
                        newvalue = currentBrushSize + brushSizeIncrement;
                        recorded = 'up';
                    }
                }
                // If downwards
                else {
                    // Modifying the value only if its higher than the max allowed size
                    if (currentBrushSize > minBrushSize) {
                        newvalue = currentBrushSize - brushSizeIncrement;
                        recorded = 'down';
                    }
                }

                updateBrushSize(canvas, cursor, mousecursor, newvalue);

                if (recording && recorded) {
                    let lastindex = record.length - 1;
                    if (record[lastindex].type === 'resize') {
                        record[lastindex].value.push(recorded);
                    } else {
                        record.push({
                            type: 'resize',
                            value: [recorded]
                        })
                    }
                }
            }
        })

        function updateBrushSize(canvas, cursor, brush, value) {
            canvas.freeDrawingBrush.width = value;
            brush.animate({
                radius: value / 2
            }, {
                onChange: cursor.renderAll.bind(cursor),
                duration: 100
            });
            // Updating the current brush size
            currentBrushSize = value;
        }
    }

    drawing.appendChild(colorcontainer);

    /**
     * The below code is used only if running a training session
     */

    // If this is a tutorial session
    function launchTutorial(param) {
        let tutomask = makeElement('border-mask border-mask-tuto', false, 'tuto-mask-top');
        drawing.appendChild(tutomask);

        let texts = param.global.texts.experiment.tutorial;

        let tutopointermask = makeElement('pointer-mask');
        let guidecontainer = makeElement('tutorial-guide-container hidden');
        let masklabel = makeElement('tutorial-main-label', false, 'tutorial-main-label');
        let nextbutton = makeElement('tutorial-button tutorial-button-next', `<img src='../static/anchorwhat/img/next.svg' />`);
        let previousbutton = makeElement('tutorial-button tutorial-button-previous', `<img src='../static/anchorwhat/img/previous.svg' />`);
        guidecontainer.append(previousbutton, masklabel, nextbutton);
        drawing.append(guidecontainer, tutopointermask);

        drawingPhase();

        function drawingPhase() {
            clearCanvas();
            waitMap(0.5, function() {
                remove(mask5);
                // Using a variable to cancel the animation if needed
                let cancel = false;

                autoDrawing(dataset, function() {
                    hideE(cur);
                    styleInitial();
                    tutoPhase1();
                    waitMap(0.5, function() { clearCanvas(); })
                });

                //Defining a function to run each tests asynchronously
                async function autoDrawing(dataset, callback) {
                    for (let i = 0; i < dataset.length; ++i) {
                        if (cancel) { break }
                        await draw(dataset[i]);
                    }
                    callback();
                }

                function draw(data) {
                    return new Promise(resolve => {
                        if (data.type === 'start') {
                            currentBrushSize = defaultBrushSize;
                            mousecursor.set({
                                radius: currentBrushSize / 2,
                                top: data.coordinate[1],
                                left: data.coordinate[0]
                            }).setCoords().canvas.renderAll();
                            displayE(cur);
                            waitMap(0.5, function() { resolve('done') })
                        } else if (data.type === 'move') {
                            moveCursor(data.value, false, function() { resolve('done') });
                        } else if (data.type === 'draw') {
                            moveCursor(data.value, true, function() { resolve('done') });
                        } else if (data.type === 'layer') {
                            let layerbutton = document.getElementById('color-picker' + data.value);
                            layerbutton.getElementsByClassName('color-picker')[0].click();
                            resolve('');
                        } else if (data.type === 'resize') {
                            resizeCursor(data.value, function() { resolve('done'); })
                        } else if (data.type === 'importance') {
                            let activeimportance = document.getElementsByClassName('importance-container active')[0].getElementsByClassName('importance-level');
                            for (j = 0; j < activeimportance.length; j++) {
                                let v = activeimportance[j].getAttribute('value');
                                if (parseInt(v) + 1 === data.value) {
                                    activeimportance[j].click();
                                    resolve('done');
                                }
                            }
                        } else if (data.type === 'end') {
                            hideE(cur);
                            resolve('done');
                        } else if (data.type === 'clear' || data.type === 'undo') {
                            let active = document.getElementsByClassName(data.type + '-button active')[0];
                            active.click();
                            resolve('done');
                        } else if (data.type === 'tips') {
                            resolve('done');
                        }
                    });
                }

                async function resizeCursor(values, callback) {
                    let activecanvas = document.getElementsByClassName('canvas-container active')[0].getElementsByClassName('upper-canvas')[0];
                    for (j = 0; j < values.length; j++) {
                        if (cancel) { break }
                        await rotate(activecanvas, values[j]);
                    }
                    callback();

                    function rotate(canvas, upOrDown) {
                        return new Promise(resolve => {
                            let deltaY;
                            if (upOrDown === 'up') { deltaY = -120 } else if (upOrDown === 'down') { deltaY = +120 }
                            simulateWheelEvent(canvas, { deltaY: deltaY });
                            waitMap(0.1, function() {
                                resolve('done');
                            })
                        })
                    }
                }

                async function moveCursor(moves, draw, callback) {
                    time = new Date(moves[0][2]);
                    let activecanvas = document.getElementsByClassName('canvas-container active')[0].getElementsByClassName('upper-canvas')[0];
                    if (draw) {
                        simulateMouseEvent(activecanvas, 'mousedown', {
                            clientX: drawing.offsetLeft + moves[0][0],
                            clientY: drawing.offsetTop + moves[0][1],
                            button: 0
                        });
                        stopPropagationOnAllEvent(tutopointermask, guidecontainer, mask1, mask2, mask3, mask4);
                    }
                    for (j = 0; j < moves.length; j++) {
                        if (cancel) { break }
                        await movement(moves[j], draw);
                    }
                    if (draw) {
                        simulateMouseEvent(activecanvas, 'mouseup', {
                            clientX: drawing.offsetLeft + moves[moves.length - 1][0],
                            clientY: drawing.offsetTop + moves[moves.length - 1][1],
                            button: 0
                        });
                    }
                    callback();

                    function movement(m, draw) {
                        return new Promise(resolve => {
                            let newtime = new Date(m[2]);
                            if (draw) {
                                simulateMouseEvent(activecanvas, 'mousemove', {
                                    clientX: drawing.offsetLeft + m[0],
                                    clientY: drawing.offsetTop + m[1],
                                    button: 0
                                });
                            }
                            mousecursor.set({
                                top: m[1],
                                left: m[0]
                            }).setCoords().canvas.renderAll();
                            waitMap((newtime - time) / 1000, function() {
                                time = newtime;
                                resolve('done')
                            });
                        })
                    }
                }
            })
        }

        function tutoPhase1() {
            hideE(guidecontainer);
            waitMap(0.5, function() {
                stylePhase1();
                waitMap(0.5, function() {
                    resetButtons(false, true);
                    masklabel.innerHTML = texts.main[0][language];
                    nextbutton.addEventListener('click', tutoPhase2);
                    displayE(guidecontainer);
                })
            })
        }

        function tutoPhase2() {
            hideE(guidecontainer);
            waitMap(0.5, function() {
                stylePhase2init();
                waitMap(0.5, function() {
                    stylePhase2();
                    let layers = document.getElementsByClassName('color-picker');
                    let index = 0;
                    for (let i = 0; i < layers.length; ++i) {
                        if (hasClass(layers[i], 'active')) {
                            i === 4 ? index = 0 : index = i + 1;
                        }
                    }
                    let interval = setInterval(function() {
                        layers[index].click();
                        index > 3 ? index = 0 : ++index;
                    }, 2000);

                    resetButtons(true, true);
                    masklabel.innerHTML = texts.main[1][language];
                    previousbutton.addEventListener('click', function() {
                        stylePhase2init();
                        clearInterval(interval);
                        tutoPhase1();
                    });
                    nextbutton.addEventListener('click', function() {
                        stylePhase2init();
                        clearInterval(interval);
                        tutoPhase3();
                    });
                    displayE(guidecontainer);
                })
            })
        }

        function tutoPhase3() {
            hideE(guidecontainer);
            waitMap(0.5, function() {
                stylePhase3init();
                waitMap(0.5, function() {
                    stylePhase3();
                    let importance = document.getElementsByClassName('importance-container active')[0];
                    let importancelevel = importance.getElementsByClassName('importance-level');
                    let index = 0;
                    for (let i = 0; i < importancelevel.length; ++i) {
                        if (hasClass(importancelevel[i], 'active')) {
                            i === 2 ? index = 0 : index = i + 1;
                        }
                    }
                    let interval = setInterval(function() {
                        importancelevel[index].click();
                        index > 1 ? index = 0 : ++index;
                    }, 2000);

                    resetButtons(true, true);
                    masklabel.innerHTML = texts.main[2][language];
                    previousbutton.addEventListener('click', function() {
                        stylePhase3init();
                        clearInterval(interval);
                        tutoPhase2();
                    });
                    nextbutton.addEventListener('click', function() {
                        stylePhase3init();
                        clearInterval(interval);
                        tutoPhase4();
                    });
                    displayE(guidecontainer);
                })
            })
        }

        function tutoPhase4() {
            hideE(guidecontainer);
            waitMap(0.5, function() {
                stylePhase4init();
                waitMap(0.5, function() {
                    stylePhase4();
                    let controlbuttons = document.getElementsByClassName('canvas-container active')[0].parentNode.getElementsByClassName('drawing-control-button');
                    addClassList(controlbuttons, 'active');
                    resetButtons(true, true);
                    masklabel.innerHTML = texts.main[3][language];
                    previousbutton.addEventListener('click', function() {
                        removeClassList(controlbuttons, 'active');
                        stylePhase4init();
                        tutoPhase3();
                    });
                    nextbutton.addEventListener('click', function() {
                        removeClassList(controlbuttons, 'active');
                        stylePhase4init();
                        tutoPhase5();
                    });
                    displayE(guidecontainer);
                })
            })
        }

        function tutoPhase5() {
            hideE(guidecontainer);
            waitMap(0.5, function() {
                stylePhase5init();
                removeClass(maskcontainer, 'bottom');
                waitMap(0.5, function() {
                    stylePhase5();
                    addClass(validationbutton, 'active');
                    resetButtons(true, true);
                    masklabel.innerHTML = texts.main[4][language];
                    previousbutton.addEventListener('click', function() {
                        removeClass(validationbutton, 'active');
                        stylePhase5init();
                        tutoPhase4();
                    });
                    nextbutton.addEventListener('click', function() {
                        removeClass(validationbutton, 'active');
                        stylePhase5init();
                        tutoPhase6();
                    });
                    displayE(guidecontainer);
                })
            })
        }

        function tutoPhase6() {
            hideE(guidecontainer);
            waitMap(0.5, function() {
                stylePhase6init();
                waitMap(0.5, function() {
                    stylePhase6();
                    addClass(maskcontainer, 'bottom');
                    waitMap(0.5, function() {
                        centerCursor();
                        displayE(cur);
                        tutomask.addEventListener('wheel', function(event) {
                            let activecanvas = document.getElementsByClassName('canvas-container active')[0].getElementsByClassName('upper-canvas')[0];
                            simulateWheelEvent(activecanvas, { deltaY: event.deltaY })
                        });
                        tutomask.addEventListener('auxclick', function(event) {
                            if (event.button === 1) {
                                let activecanvas = document.getElementsByClassName('canvas-container active')[0].getElementsByClassName('upper-canvas')[0];
                                simulateMouseEvent(activecanvas, 'mousedown', { button: 1 })
                                simulateMouseEvent(activecanvas, 'mouseup', { button: 1 })
                            }
                        });
                        resetButtons(true, true);
                        masklabel.innerHTML = texts.main[5][language];
                        previousbutton.addEventListener('click', function() {
                            mousecursor.dispose();
                            hideE(guidecontainer);
                            hideE(cur);
                            stylePhase6init();
                            tutoPhase5();
                        });
                        nextbutton.addEventListener('click', function() {
                            mousecursor.dispose();
                            hideE(cur);
                            stylePhase6init();
                            tutoPhase7();
                        });
                        displayE(guidecontainer);
                    })
                })
            })
        }

        function tutoPhase7() {
            hideE(guidecontainer);
            waitMap(0.5, function() {
                stylePhase7init();
                removeClass(maskcontainer, 'bottom');
                waitMap(0.5, function() {
                    stylePhase7();
                    resetButtons(true, true);
                    simulateMouseEvent(help, 'mouseenter');
                    masklabel.innerHTML = texts.main[6][language];
                    previousbutton.addEventListener('click', function() {
                        simulateMouseEvent(help, 'mouseleave');
                        stylePhase7init();
                        tutoPhase6();
                    });
                    nextbutton.addEventListener('click', function() {
                        simulateMouseEvent(help, 'mouseleave');
                        stylePhase7init();
                        tutoPhase8();
                    });
                    displayE(guidecontainer);
                })
            })
        }

        function tutoPhase8() {
            hideE(guidecontainer);
            waitMap(0.5, function() {
                removeClass(maskcontainer, 'bottom');
                waitMap(0.5, function() {
                    resetButtons(true, true);
                    masklabel.innerHTML = texts.main[7][language];
                    previousbutton.addEventListener('click', tutoPhase7);
                    nextbutton.addEventListener('click', function() {
                        hideE(guidecontainer);
                        waitMap(0.5, function() {
                            callback(false);
                        })
                    });
                    displayE(guidecontainer);
                })
            })
        }

        function resetButtons(previous, next) {
            if (previous) {
                addClass(previousbutton, 'active');
            } else {
                removeClass(previousbutton, 'active');
            }
            if (next) {
                addClass(nextbutton, 'active');
            } else {
                removeClass(nextbutton, 'active');
            }
            if (guidecontainer.contains(previousbutton)) {
                previousbutton = replaceByClone(previousbutton);
            }
            if (guidecontainer.contains(nextbutton)) {
                nextbutton = replaceByClone(nextbutton);
            }
        }

        function styleInitial() {
            applyStyle(tutomask, {
                bottom: '0px',
                left: '0px',
                height: '0px',
                width: '100%'
            });
        }

        function stylePhase1() {
            applyStyle(tutomask, {
                bottom: '0px',
                left: '0px',
                height: '100%',
                width: '100%'
            });
        }

        function stylePhase2init() {
            applyStyle(tutomask, {
                mask: 'radial-gradient(farthest-side,#fff 99%,transparent 100%) center -150px/0 0 no-repeat exclude, linear-gradient(#fff,#fff)',
            });
        }

        function stylePhase2() {
            applyStyle(tutomask, {
                mask: 'radial-gradient(farthest-side,#fff 99%,transparent 100%) center -150px/150% 300px no-repeat exclude, linear-gradient(#fff,#fff)',
            });
        }

        function stylePhase3init() {
            applyStyle(tutomask, {
                mask: 'radial-gradient(farthest-side,#fff 99%,transparent 100%) bottom -150px left -50px/0 0 no-repeat exclude, linear-gradient(#fff,#fff)',
            });
        }

        function stylePhase3() {
            applyStyle(tutomask, {
                mask: 'radial-gradient(farthest-side,#fff 99%,transparent 100%) bottom -150px left -50px/550px 350px no-repeat exclude, linear-gradient(#fff,#fff)',
            });
        }

        function stylePhase4init() {
            applyStyle(tutomask, {
                mask: 'radial-gradient(farthest-side, rgb(255, 255, 255) 99%, transparent 100%) right -30px bottom -40px / 0 0 no-repeat exclude, linear-gradient(rgb(255, 255, 255), rgb(255, 255, 255))',
            });
        }

        function stylePhase4() {
            applyStyle(tutomask, {
                mask: 'radial-gradient(farthest-side, rgb(255, 255, 255) 99%, transparent 100%) right -30px bottom -40px / 260px 180px no-repeat exclude, linear-gradient(rgb(255, 255, 255), rgb(255, 255, 255))',
            });
        }

        function stylePhase5init() {
            applyStyle(tutomask, {
                mask: 'radial-gradient(farthest-side,#fff 99%,transparent 100%) left 50% bottom -25px/0 0 no-repeat exclude, linear-gradient(#fff,#fff)',
            });
        }

        function stylePhase5() {
            applyStyle(tutomask, {
                mask: 'radial-gradient(farthest-side, rgb(255, 255, 255) 99%, transparent 100%) left 50% bottom -60px / 300px 200px no-repeat exclude, linear-gradient(rgb(255, 255, 255), rgb(255, 255, 255))',
            });
        }

        function stylePhase6init() {
            applyStyle(tutomask, {
                mask: 'radial-gradient(farthest-side,#fff 99%,transparent 100%) center/0 0 no-repeat exclude, linear-gradient(#fff,#fff)',
            });
        }

        function stylePhase6() {
            let size = maxBrushSize + 50;
            applyStyle(tutomask, {
                mask: 'radial-gradient(farthest-side,#fff 99%,transparent 100%) center/' + size + 'px ' + size + 'px no-repeat exclude, linear-gradient(#fff,#fff)',
            });
        }

        function stylePhase7init() {
            applyStyle(tutomask, {
                mask: 'radial-gradient(farthest-side,#fff 99%,transparent 100%) top right/0 0 no-repeat exclude, linear-gradient(#fff,#fff)',
            });
        }

        function stylePhase7() {
            applyStyle(tutomask, {
                mask: 'radial-gradient(farthest-side,#fff 99%,transparent 100%) top -50px right -50px/130px 130px no-repeat exclude, linear-gradient(#fff,#fff)',
            });
        }
    }

    function styleBorderNone() {
        applyStyle(mask1, {
            top: '0px',
            left: '0px',
            height: '0px',
            width: '100%'
        });
        applyStyle(mask2, {
            bottom: '0px',
            left: '0px',
            height: '0px',
            width: '100%'
        });
        applyStyle(mask3, {
            top: '0px',
            left: '0px',
            height: '100%',
            width: '0px'
        });
        applyStyle(mask4, {
            top: '0px',
            right: '0px',
            height: '100%',
            width: '0px'
        });
        applyStyle(drawing, {
            top: '0px',
            left: '0px',
            height: '100%',
            width: '100%'
        });
        applyStyle(mask5, {
            top: '0px',
            left: '0px',
            height: '100%',
            width: '100%'
        });
    }

    function styleBorder() {
        applyStyle(mask1, {
            top: '0px',
            left: 'calc(50% - ' + (minWidth / 2) + 'px)',
            height: 'calc(50% - ' + (minHeight / 2) + 'px)',
            width: minWidth + 'px'
        });
        applyStyle(mask2, {
            bottom: '0px',
            left: 'calc(50% - ' + (minWidth / 2) + 'px)',
            height: 'calc(50% - ' + (minHeight / 2) + 'px)',
            width: minWidth + 'px'
        });
        applyStyle(mask3, {
            top: '0px',
            left: '0px',
            height: '100%',
            width: 'calc(50% - ' + (minWidth / 2) + 'px)',
        });
        applyStyle(mask4, {
            top: '0px',
            right: '0px',
            height: '100%',
            width: 'calc(50% - ' + (minWidth / 2) + 'px)',
        });
        applyStyle(drawing, {
            top: 'calc(50% - ' + (minHeight / 2) + 'px)',
            left: 'calc(50% - ' + (minWidth / 2) + 'px)',
            height: minHeight + 'px',
            width: minWidth + 'px',
        });
        applyStyle(mask5, {
            top: 'calc(50% - ' + (minHeight / 2) + 'px)',
            left: 'calc(50% - ' + (minWidth / 2) + 'px)',
            height: minHeight + 'px',
            width: minWidth + 'px',
        });
    }

    function clearCanvas() {
        let clear = document.getElementsByClassName('clear-button');
        for (let i = 0; i < clear.length; ++i) {
            clear[i].click();
        }
        document.getElementsByClassName('color-picker')[0].click();
        let importance = document.getElementsByClassName('importance-container');
        for (let i = 0; i < importance.length; ++i) {
            importance[i].getElementsByClassName('importance-level')[1].click();
        }
        mousecursor.set({
            radius: defaultBrushSize / 2,
            fill: colors[0]
        }).setCoords().canvas.renderAll();
        currentBrushSize = defaultBrushSize;
        currentColor = colors[0];
        let activecanvas = document.getElementsByClassName('canvas-container active')[0].getElementsByClassName('upper-canvas')[0];
        simulateMouseEvent(activecanvas, 'mousedown', { button: 1 });
        simulateMouseEvent(activecanvas, 'mouseup', { button: 1 });
    }

    function centerCursor() {
        mousecursor.set({
            radius: defaultBrushSize / 2,
            top: minHeight / 2,
            left: minWidth / 2
        }).setCoords().canvas.renderAll();
        currentBrushSize = defaultBrushSize;
    }
}