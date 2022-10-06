/**
 * @drawing
 * Defines the drawing tools.
 */

function drawingMode(param) {
    let container = document.getElementById('container');
    param.cartography.drawing['currentBrushSize'] = param.cartography.drawing.defaultBrushSize;
    let height = container.offsetHeight;
    let width = container.offsetWidth;
    let mousedown = false;

    // Initialization of canvases properties to use throughout the session
    param.cartography['canvases'] = {
        // The number of layers containing at least one object
        layersContainingObjects: 0,
        canvas: {}
    };

    let popupmask = makeElement('popup-mask');
    let popucontainer = makeElement('popup-container');
    let popuptext = makeElement('popup-text', 'Getting back to navigation mode will erase your current drawing.<br>Continue?')
    let popupbuttoncontainer = makeElement('popup-button-container');
    let popupbuttonyes = makeElement('button popup-button', 'Yes');
    let popupbuttonno = makeElement('button popup-button', 'No');
    popupbuttoncontainer.append(popupbuttonyes, popupbuttonno);
    popucontainer.append(popuptext, popupbuttoncontainer);
    popupmask.appendChild(popucontainer);
    container.appendChild(popupmask);

    let navigationcontainer = makeElement('mode-container navigation-mode-container');
    let navigationbutton = makeElement('mode-button', `<img src='../static/mapdraw/img/navigation.svg' />`);
    let navigationtooltip = makeElement('drawing-control-tooltip', 'Navigation mode');
    navigationbutton.addEventListener('mouseenter', function(event) {
        addClass(navigationtooltip, 'active');
    })
    navigationbutton.addEventListener('mouseleave', function(event) {
        removeClass(navigationtooltip, 'active');
    })
    navigationcontainer.append(navigationtooltip, navigationbutton);
    container.appendChild(navigationcontainer);

    // Creation of the drawing area
    let drawing = makeElement('drawing displayed', false, 'drawing');
    container.appendChild(drawing);

    let downloadcontainer = makeElement('mode-container download-container');
    let downloadbutton = makeElement('mode-button button-download', `<img src='../static/mapdraw/img/download.svg' />`);
    let downloadtooltip = makeElement('drawing-control-tooltip', 'Download GeoJSON');
    downloadbutton.addEventListener('mouseenter', function(event) {
        addClass(downloadtooltip, 'active');
    })
    downloadbutton.addEventListener('mouseleave', function(event) {
        removeClass(downloadtooltip, 'active');
    })
    downloadcontainer.append(downloadtooltip, downloadbutton);
    container.appendChild(downloadcontainer);

    downloadbutton.addEventListener('click', function() {
        if (hasClass(downloadbutton, 'active')) {
            let results = {
                objects: [],
                layers: [],
                zoom: param.cartography.currentview.zoom,
                basemap: param.cartography.currentview.name,
            };
            let canvases = param.cartography.canvases;
            Object.keys(canvases.canvas).forEach(function(key) {
                let paths = [];
                let obj = canvases.canvas[key];
                let objects = obj.objects;
                for (o = 0; o < objects.length; ++o) {
                    paths.push({
                        geometry: objects[o].geometry,
                        timestamp: objects[o].timestamp,
                        thickness: objects[o].thickness,
                        buffer: pxToMeters(objects[o].thickness, param.cartography.currentview.zoom, param)
                    });
                }
                let layer = {
                    name: obj.name,
                    color: obj.color
                }
                results.objects.push(paths);
                results.layers.push(layer);
            });

            results['extent'] = [
                getCoordinatesFromPixel(0, 0, 0, 0, param),
                getCoordinatesFromPixel(width, height, 0, 0, param)
            ]

            sendResults(results);

            function sendResults(data) {
                $.ajax({
                    url: "download/",
                    type: 'POST',
                    data: {
                        csrfmiddlewaretoken: getCookie('csrftoken'),
                        data: JSON.stringify(data)
                    },
                    success: function(geojson) {
                        let date = new Date();
                        let year = date.getFullYear();
                        let month = padTime(date.getMonth() + 1);
                        let day = padTime(date.getDate());
                        let hour = padTime(date.getHours());
                        let minutes = padTime(date.getMinutes());
                        let seconds = padTime(date.getSeconds());
                        let element = document.createElement('a');
                        let filename = 'mapdraw-' + year.toString() + month.toString() + day.toString() + hour.toString() + minutes.toString() + seconds.toString() + '.geojson';
                        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(geojson));
                        element.setAttribute('download', filename);
                        element.style.display = 'none';
                        document.body.appendChild(element);
                        element.click();
                        element.remove();
                    }
                })
            }
        }
    });

    // Creation of a canvas that will contain the custom brush cursor
    let cursordiv = document.createElement('canvas');
    cursordiv.setAttribute('id', 'cursor');
    cursordiv.setAttribute('class', 'hidden');
    drawing.appendChild(cursordiv);

    // Creation of the colour container
    let colormanagement = makeElement('color-management displayed', false, 'color-container');
    let colorcontainer = makeElement('color-container');
    let drawingcontainer = makeElement('drawing-container');

    param.cartography.canvases['layernumber'] = 0;
    param.cartography.canvases['layertotal'] = 0;

    let layeradd = makeElement('add-layer', `<img src='../static/mapdraw/img/layer.svg' />`);
    layeradd.addEventListener('click', addLayerListener);
    colormanagement.append(colorcontainer, layeradd);
    container.appendChild(colormanagement);

    function addLayerListener() {
        layeradd.removeEventListener('click', addLayerListener);
        addLayer(param, function(layeroptions) {
            waitMap(0.01, function() {
                removeClass(layeroptions.divs[0], 'shrinked');
                waitMap(0.05, function() {
                    addClass(layeroptions.divs[0], 'slide');
                    layeroptions.divs[0].getElementsByClassName('color-select-container')[0].click();
                    layeradd.addEventListener('click', addLayerListener);
                });
            });
        });
    }

    addLayer(param, function(layeroptions) {
        param.cartography.drawing.currentColor = layeroptions.color;
        addClass(layeroptions.divs[1], 'active')
        waitMap(0.01, function() {
            removeClass(layeroptions.divs[0], 'shrinked');
            waitMap(0.2, function() {
                addClassList([layeroptions.divs[0], layeradd], 'slide');
                addClass(layeroptions.divs[0], 'active');
            });
        });
    });

    // Instanciation of a new canvas
    let cursor = new fabric.StaticCanvas('cursor', {
        height: height,
        width: width,
    });
    // Instanciation of a new circle for the brush
    let mousecursor = new fabric.Circle({
        left: -100,
        top: -100,
        radius: param.cartography.drawing.currentBrushSize / 2,
        fill: param.cartography.drawing.currentColor,
        stroke: 'white',
        strokeWidth: 2,
        originX: 'center',
        originY: 'center'
    });
    // Adding the circle object to the canvas
    cursor.add(mousecursor);

    waitMap(0.5, function() {
        addClass(navigationbutton, 'active');
        navigationbutton.addEventListener('click', navigationModeListener);

        function navigationModeListener(event) {
            if (param.cartography.canvases.layersContainingObjects > 0) {
                addClassList([popucontainer, popupmask], 'active');
                popupbuttonyes.addEventListener('click', yeslistener);
                popupbuttonno.addEventListener('click', nolistener);
            } else {
                returnNavigation();
            }

            function yeslistener(event) {
                navigationbutton.removeEventListener('click', navigationModeListener);
                popupbuttonyes.removeEventListener('click', yeslistener);
                popupbuttonno.removeEventListener('click', nolistener);
                removeClassList([popucontainer, popupmask], 'active');
                let clear = document.getElementsByClassName('clear-button');
                for (let i = 0; i < clear.length; ++i) {
                    clear[i].click();
                }
                returnNavigation();
            }

            function nolistener(event) {
                popupbuttonno.removeEventListener('click', nolistener);
                popupbuttonyes.removeEventListener('click', yeslistener);
                removeClassList([popucontainer, popupmask], 'active');
            }

            function returnNavigation() {
                let selection = document.getElementById('basemap-selection');
                let layers = document.getElementsByClassName('color-input-container');
                removeClassList(layers, 'slide');
                removeClassList(layers, 'active');
                removeClass(layeradd, 'slide');
                removeClassList([navigationbutton, navigationtooltip, downloadbutton, downloadtooltip], 'active');
                removeClass(selection, 'drawing-mode');
                navigationMode(param);
                waitMap(0.2, function() {
                    remove(drawing);
                });
                waitMap(0.5, function() {
                    remove(navigationcontainer, downloadcontainer, colormanagement, popupmask);
                });
            }
        }
    })

    function addLayer(param, callback) {
        let nb = param.cartography.canvases.layertotal + 1;
        let color = randomColour({ s: 0.8, v: 0.8, opacity: 0.7 });
        let placeholder = param.cartography.text.layer + ' ' + nb;

        // Creating a canvas object for the drawable area of the layer
        let canvasdiv = document.createElement('canvas');
        canvasdiv.setAttribute('id', 'canvas' + nb);
        canvasdiv.setAttribute('class', 'canvas');
        drawingcontainer.appendChild(canvasdiv);

        // Creating the color mark to switch to this layer
        let colorinput = makeElement('color-input-container shrinked', false, 'color-picker' + nb);
        colorinput.style.backgroundColor = color.rgba.text;

        let changecolorcontainer = makeElement('color-change-container');
        let changecolor = makeElement('color-change', `<img src='../static/mapdraw/img/change.svg' />`);
        changecolorcontainer.appendChild(changecolor);
        let rename = makeElement('color-rename color-input-items', `<img src='../static/mapdraw/img/rename.svg' />`);
        let selectcolorcontainer = makeElement('color-select-container color-input-items');
        let selectcolor = makeElement('color-select color-input-items placeholder', placeholder);
        let deletecolor = makeElement('color-delete color-input-items', `<img src='../static/mapdraw/img/clear.svg' />`);

        selectcolor.setAttribute('spellcheck', 'false');
        selectcolorcontainer.appendChild(selectcolor);
        changecolorcontainer.addEventListener('click', changeLayerColor);
        rename.addEventListener('click', renameLayer);
        selectcolorcontainer.addEventListener('click', activateLayer);
        deletecolor.addEventListener('click', deleteLayer);

        colorinput.append(changecolorcontainer, rename, selectcolorcontainer, deletecolor);
        colorcontainer.appendChild(colorinput);

        let controlcontainer = makeElement('drawing-control-container');
        let controls = param.cartography.text.controls;
        // Looping through the different controls
        for (c = 0; c < controls.length; ++c) {
            let name = controls[c].name;
            let layercolor = color.rgba.text;
            // Creating DOM elements of the control
            let cont = makeElement('drawing-control');
            let button = makeElement('drawing-control-button ' + name + '-button', `<img src='../static/mapdraw/img/${name}.svg' />`);
            // Setting the backgroung color of the button according to the layer's color
            button.style.backgroundColor = layercolor;
            // Defining the event triggered when clicking on the control button
            button.addEventListener('click', function(event) {
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
                            param.cartography.canvases.canvas['layer' + nb].objects = [];
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
                        param.cartography.canvases.canvas['layer' + nb].objects.pop();
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
                    controlwasactive = false;
                    if (param.cartography.canvases.layersContainingObjects > 0) {
                        --param.cartography.canvases.layersContainingObjects;
                    }
                    if (param.cartography.canvases.layersContainingObjects === 0) {
                        removeClass(downloadbutton, 'active');
                    }
                }
            })

            // Creating a tooltip for the controls with the same background color as the layer
            let tooltip = makeElement('drawing-control-tooltip', controls[c].label);
            tooltip.style.backgroundColor = color.rgba.text;
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
        let canvas = new fabric.Canvas('canvas' + nb, {
            // Activating free drawing mode
            isDrawingMode: true,
            // No cursor allowed, cursor is handled by an other canvas
            freeDrawingCursor: 'none',
            fireMiddleClick: true,
            height: height,
            width: width
        });

        // Setting the width and color of the free drawing brush
        canvas.freeDrawingBrush.width = param.cartography.drawing.currentBrushSize;
        canvas.freeDrawingBrush.color = color.rgba.text;

        canvas.on('mouse:down', function(event) {
            if (event.button === 1) mousedown = true;
        })

        canvas.on('mouse:up', function(event) {
            if (event.button === 1) {
                mousedown = false;
            } else if (event.button === 2) {
                if (mousedown === false) updateBrushSize(canvas, cursor, mousecursor, param.cartography.drawing.defaultBrushSize);
            }
        })

        // Defining the cursor behavior when moving over the canvas
        canvas.on('mouse:move', function(event) {
            displayE(cursordiv);
            // Setting the position of the cursor to the location of the mouse
            let mouse = canvas.getPointer(event);
            mousecursor.set({
                radius: param.cartography.drawing.currentBrushSize / 2,
                top: mouse.y,
                left: mouse.x
            }).setCoords().canvas.renderAll();
        });

        // Defining the cursor behavior when moving out of the canvas
        canvas.on('mouse:out', function() {
            hideE(cursordiv);
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
                let currentBrushSize = param.cartography.drawing.currentBrushSize;
                let maxBrushSize = param.cartography.drawing.maxBrushSize;
                let minBrushSize = param.cartography.drawing.minBrushSize;
                let brushSizeIncrement = param.cartography.drawing.brushSizeIncrement;

                // Assigning the current brush size to the new brush size
                let newvalue = currentBrushSize;
                // If the wheel is rotated upwards
                if (event.e.deltaY < 0) {
                    // Modifying the value only if its lower than the max allowed size
                    if (currentBrushSize < maxBrushSize) newvalue = currentBrushSize + brushSizeIncrement;
                }
                // If downwards
                else {
                    // Modifying the value only if its higher than the max allowed size
                    if (currentBrushSize > minBrushSize) newvalue = currentBrushSize - brushSizeIncrement;
                }
                updateBrushSize(canvas, cursor, mousecursor, newvalue);
            }
        })

        // Defining behavior when finishing a drawing
        canvas.on('path:created', function(event) {
            let date = new Date();
            let year = date.getFullYear();
            let month = padTime(date.getMonth() + 1);
            let day = padTime(date.getDate());
            let hour = padTime(date.getHours());
            let minutes = padTime(date.getMinutes());
            let seconds = padTime(date.getSeconds());
            let timestamp = year.toString() + '-' + month.toString() + '-' + day.toString() + ', ' + hour.toString() + ':' + minutes.toString() + ':' + seconds.toString();

            // Displaying control buttons
            addClassList(controlcontainer.getElementsByClassName('drawing-control-button'), 'active');
            addClass(downloadbutton, 'active');

            // Incrementing the number of layers containing at least one object if none were found for this layer
            if (param.cartography.canvases.canvas['layer' + nb].objects.length === 0) {
                ++param.cartography.canvases.layersContainingObjects;
            }

            let path = event.path;
            let offset = [drawing.offsetLeft, drawing.offsetTop];
            let geometry = pathToCoordinates(path.path, param, offset);

            // Inserting the path to the array of objects
            param.cartography.canvases.canvas['layer' + nb].objects.push({
                path: path,
                geometry: geometry,
                timestamp: timestamp,
                thickness: param.cartography.drawing.currentBrushSize / 2
            });
        })

        // Adding layer informations
        param.cartography.canvases.canvas['layer' + nb] = {
            color: color.rgba.text,
            name: placeholder,
            // Objects is an array that will contain drawn objects
            objects: []
        };

        param.cartography.canvases.layertotal += 1;
        param.cartography.canvases.layernumber += 1;
        let results = { divs: [colorinput, canvasdiv.parentElement], color: color.rgba.text }
        callback(results);

        function activateLayer(event) {
            // Modifications are made only if the layer is not already active
            if (hasClass(colorinput, 'active') === false) {
                // Deactivating layer buttons, canvas, controls, importance selectors
                removeClassList(document.getElementsByClassName('color-input-container'), 'active');
                removeClassList(document.getElementsByClassName('canvas-container'), 'active');
                removeClassList(document.getElementsByClassName('drawing-control-button'), 'active');

                // Changing the color of the cursor and the canvas brush
                mousecursor.setOptions({ fill: color.rgba.text });
                canvas.freeDrawingBrush.color = color.rgba.text;
                // Resetting the width of the drawing brush
                canvas.freeDrawingBrush.width = param.cartography.drawing.currentBrushSize;

                // Activating the canvas, the importance selector and the layer button
                addClass(canvasdiv.parentElement, 'active')
                addClass(colorinput, 'active');

                // Displaying the control buttons if objects are present on the canvas
                if (canvas.getObjects().length > 0) {
                    addClassList(controlcontainer.getElementsByClassName('drawing-control-button'), 'active');
                }
            }
        }

        function renameLayer(event) {
            let text;
            selectcolor.setAttribute('contenteditable', 'true');
            if (selectcolor.innerHTML === placeholder) {
                selectcolor.innerHTML = '';
                removeClass(selectcolor, 'placeholder');
            }

            $(selectcolor).focus(function() {
                selectTextInDiv(this);
            });
            $(selectcolor).keypress(function(event) {
                if (event.which === 13) {
                    event.preventDefault();
                    event.target.blur();
                }
            });
            $(selectcolor).focusout(function() {
                if (this.innerHTML === '' || selectcolor.innerHTML === '<br>' || selectcolor.innerHTML === '<empty string>') {
                    this.innerHTML = placeholder;
                    addClass(this, 'placeholder');
                }
                validateLayerName();
            });

            $(selectcolor).focus();

            function validateLayerName() {
                text = selectcolor.innerHTML.replace(/(<br>\s*)+$/, '');
                selectcolor.innerHTML = '';
                selectcolor.innerHTML = text;
                param.cartography.canvases.canvas['layer' + nb].name = text;
                $(selectcolor).unbind('focus');
                $(selectcolor).unbind('focusout');
                $(selectcolor).unbind('keypress');
                selectcolor.setAttribute('contenteditable', 'false');
            }
        }

        function changeLayerColor(event) {
            addClass(colorinput, 'colorselect');
            changecolorcontainer.removeEventListener('click', changeLayerColor);
            changecolorcontainer.style.width = '300px';
            addClass(changecolorcontainer, 'active');
            hideE(changecolor);

            let randomcolor = makeElement('random-color color-change-items hidden', `<img src='../static/mapdraw/img/random.svg' />`);
            let slidercontainer = makeElement('slider-container color-change-items hidden');
            let sliderhandle = makeElement('slider-handle');
            let validatecolor = makeElement('validate-color color-change-items hidden', `<img src='../static/mapdraw/img/validate.svg' />`);

            slidercontainer.appendChild(sliderhandle);
            changecolorcontainer.append(randomcolor, slidercontainer, validatecolor);

            waitMap(0.2, function() {
                remove(changecolor);
                displayE(randomcolor, slidercontainer, validatecolor);

                let minoffset = 0;
                let maxoffset = 210;
                let left = remapValue(color.hsv.h, 0, 360, 0, 210);
                let c = 0;
                let drag = false;
                sliderhandle.style.backgroundColor = color.rgba.text;
                sliderhandle.style.left = left + 'px';
                sliderhandle.addEventListener('mousedown', clickHandle);
                window.addEventListener('mousemove', dragging);
                window.addEventListener('mouseup', unclickHandle);

                function clickHandle(e) {
                    c = e.clientX - left;
                    drag = true;
                }

                function dragging(e) {
                    if (drag) {
                        let offset = e.clientX - c;
                        if (offset < minoffset) {
                            offset = minoffset;
                        } else if (offset > maxoffset) {
                            offset = maxoffset;
                        }
                        left = offset;
                        sliderhandle.style.left = left + 'px';
                        color = randomColour({ h: remapValue(left, 0, 210, 0, 360), s: 0.8, v: 0.8, opacity: 0.7 });
                        updateColor(color);
                    }
                }

                function unclickHandle() {
                    drag = false;
                }

                slidercontainer.addEventListener('click', clickContainer);

                function clickContainer(e) {
                    if (!drag) {
                        if (!hasClass(e.target, 'slider-handle')) {
                            let offset = e.offsetX;
                            if (offset < minoffset) {
                                offset = minoffset;
                            } else if (offset > maxoffset) {
                                offset = maxoffset;
                            }
                            left = offset;
                            sliderhandle.style.left = left + 'px';
                            color = randomColour({ h: remapValue(left, 0, 210, 0, 360), s: 0.8, v: 0.8, opacity: 0.7 });
                            updateColor(color);
                        }
                    }
                }

                function changeSlider() {

                }

                randomcolor.addEventListener('click', randomColorListener);

                function randomColorListener() {
                    color = randomColour({ s: 0.8, v: 0.8, opacity: 0.7 });
                    left = remapValue(color.hsv.h, 0, 360, 0, 210);
                    sliderhandle.style.left = left + 'px';
                    updateColor(color);
                }

                function updateColor(color) {
                    sliderhandle.style.backgroundColor = color.rgba.text;
                    canvas.freeDrawingBrush.color = color.rgba.text;
                    colorinput.style.backgroundColor = color.rgba.text;
                    let controls = controlcontainer.getElementsByClassName('drawing-control-button');
                    for (let k = 0; k < controls.length; ++k) { controls[k].style.backgroundColor = color.rgba.text; }
                    let tooltips = controlcontainer.getElementsByClassName('drawing-control-tooltip');
                    for (let k = 0; k < tooltips.length; ++k) { tooltips[k].style.backgroundColor = color.rgba.text; }
                    // Retrieving all objects from the active layer
                    let objects = canvas.getObjects();
                    // Looping through all the objects
                    for (let o = 0; o < objects.length; ++o) {
                        // Changing the color of all layer objects according to the selected importance
                        objects[o].set({
                            stroke: color.rgba.text
                        }).canvas.renderAll();
                    }
                    param.cartography.canvases.canvas['layer' + nb].color = color.rgba.text;

                    if (hasClass(colorinput, 'active')) {
                        mousecursor.setOptions({ fill: color.rgba.text });
                    }
                }

                validatecolor.addEventListener('click', validateColor);

                function validateColor() {
                    validatecolor.removeEventListener('click', validateColor);
                    sliderhandle.removeEventListener('mousedown', clickHandle);
                    window.removeEventListener('mousemove', dragging);
                    window.removeEventListener('mouseup', unclickHandle);
                    randomcolor.removeEventListener('click', randomColorListener);
                    hideE(randomcolor, slidercontainer, validatecolor);

                    waitMap(0.2, function() {
                        removeClass(colorinput, 'colorselect');
                        changecolor = makeElement('color-change hidden', `<img src='../static/mapdraw/img/change.svg' />`);
                        changecolorcontainer.appendChild(changecolor);

                        removeClass(changecolorcontainer, 'active');
                        changecolorcontainer.style.width = '28px';
                        remove(randomcolor, slidercontainer, validatecolor);
                        displayE(changecolor);
                        changecolorcontainer.addEventListener('click', changeLayerColor);
                    })
                }
            });
        }

        function deleteLayer(event) {
            let colcont = document.getElementsByClassName('color-input-container');
            if (colcont.length > 1) {
                deletecolor.removeEventListener('click', deleteLayer);
                param.cartography.canvases.layernumber -= 1;
                if (hasClass(colorinput, 'active')) {
                    let newactive;
                    for (let i = 0; i < colcont.length; ++i) {
                        if (!colorinput.isSameNode(colcont[i])) {
                            newactive = colcont[i];
                            break
                        }
                    }
                    newactive.getElementsByClassName('color-select-container')[0].click();
                }
                if (param.cartography.canvases.canvas['layer' + nb].objects.length > 0) {
                    let clear = controlcontainer.getElementsByClassName('clear-button')[0];
                    clear.click();
                }
                removeClass(colorinput, 'slide');

                if (hasClass(colorinput, 'colorselect')) {
                    changecolorcontainer.getElementsByClassName('validate-color')[0].click();
                }

                waitMap(0.3, function() {
                    addClass(colorinput, 'shrinked');
                    waitMap(0.1, function() {
                        remove(document.getElementById('canvas' + nb).parentElement, controlcontainer);
                        remove(colorinput);
                        delete param.cartography.canvases.canvas['layer' + nb];
                    });
                });
            }
        }
    }

    function updateBrushSize(canvas, cursor, brush, value) {
        canvas.freeDrawingBrush.width = value;
        brush.animate({
            radius: value / 2
        }, {
            onChange: cursor.renderAll.bind(cursor),
            duration: 100
        });
        // Updating the current brush size
        param.cartography.drawing.currentBrushSize = value;
    }
}

function randomColour(opt) {
    let hsv = randomHSVcolour(opt);
    let rgba = hsvToRgba(hsv, opt.opacity);
    let color = {
        rgba: {
            r: rgba.r,
            g: rgba.g,
            b: rgba.b,
            a: rgba.a,
            text: 'rgba(' + rgba.r + ', ' + rgba.g + ', ' + rgba.b + ', ' + rgba.a + ')'
        },
        hsv: {
            h: hsv.h,
            s: hsv.s,
            v: hsv.v,
        }
    }
    return color;
}