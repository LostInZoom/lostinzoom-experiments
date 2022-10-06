/**
 * @menu 
 * Create menu and parameters
 */

function createInterface(param) {
    param = constructMap(param);

    let carto = param.cartography;
    let basemaps = carto.basemaps;
    let current = carto.currentview;

    let container = document.getElementById('container');
    let selection = makeElement('basemap-selection', false, 'basemap-selection');
    container.appendChild(selection);

    param.cartography['menumaps'] = [];
    for (let i = 0; i < basemaps.length; i++) {
        let mapcontainer = makeElement('menu-map-container', false);
        let selectionmap = makeElement('selection-map-container', false, basemaps[i].name + '-selectionmap');

        if (basemaps[i].name === current.name) { addClass(mapcontainer, 'selected'); }
        let overlay = makeElement('map-menu-overlay map-menu-overlay-hover map-menu-overlay-hover-back');
        overlay.addEventListener('click', function(event) {
            let target = event.target.parentNode;
            if (!hasClass(target, 'selected')) {
                let mapconts = document.getElementsByClassName('menu-map-container');
                for (let j = 0; j < mapconts.length; j++) {
                    removeClass(mapconts[j], 'selected');
                }
                addClass(target, 'selected');
                switchBasemap(basemaps[i], param);
            }
        });

        let overlayContent = makeElement('map-overlay-content', basemaps[i].fullname);
        overlay.appendChild(overlayContent);
        mapcontainer.append(selectionmap, overlay);
        selection.append(mapcontainer);

        let map = createSelectionMap(basemaps[i].name + '-selectionmap', param, {
            name: basemaps[i].name,
            center: current.center,
            zoom: current.zoom
        });
        param.cartography.menumaps.push({
            name: basemaps[i].name,
            fullname: basemaps[i].fullname,
            map: map
        });

        let mapcanvas = document.getElementById(basemaps[i].name + '-selectionmap').childNodes[0];
        let mapstyle;
        if (basemaps[i].name === 'google') {
            mapstyle = {
                position: 'absolute',
                borderRadius: '50%',
                height: '200%',
                width: '200%',
                transform: 'translate(-25%, -25%)'
            }
        } else {
            mapstyle = {
                position: 'absolute',
                borderRadius: '50%',
                height: '100%',
                width: '100%'
            }
        }
        applyStyle(mapcanvas, mapstyle);
        applyStyle(selectionmap, {
            position: 'absolute',
            borderRadius: '50%',
            height: '150px',
            width: '150px'
        });
    }

    current['projection'] = '3857';
    current['bounds'] = {
        min: [-20026376.39, -20048966.1],
        max: [20026376.39, 20048966.1],
    };

    let geoinfoscontainer = makeElement('geo-infos-container');
    let geoinfos = makeElement('geo-infos', `<img src='../static/mapdraw/img/help.svg' />`);
    geoinfoscontainer.addEventListener('click', openInformations);
    geoinfoscontainer.append(geoinfos);

    let projectioncontainer = makeElement('select-projection-container');
    let projectioninfos = makeElement('projection-infos');
    let projectionchange = makeElement('projection-change', `<img src='../static/mapdraw/img/earth.svg' />`);
    projectioncontainer.append(projectioninfos, projectionchange);

    projectioninfos.innerHTML = 'Pseudo mercator';
    projectioninfos.style.width = calculateTextWidth('Pseudo-mercator', getComputedStyle(projectioninfos)) + 'px';
    projectionchange.addEventListener('click', swapProjectionDisplay);

    let x = makeElement('geographic-infos');
    let xlabel = makeElement('coordinates-label coordinates-text', 'x:', 'x-label');
    let xvalue = makeElement('coordinates-value coordinates-text', current.center[0], 'x-value');
    xvalue.setAttribute('contenteditable', 'true');
    let xunit = makeElement('coordinates-unit coordinates-text', 'meters', 'x-unit');
    x.append(xlabel, xvalue, xunit);
    let y = makeElement('geographic-infos');
    let ylabel = makeElement('coordinates-label coordinates-text', 'y:', 'y-label');
    let yvalue = makeElement('coordinates-value coordinates-text', current.center[1], 'y-value');
    yvalue.setAttribute('contenteditable', 'true');
    let yunit = makeElement('coordinates-unit coordinates-text', 'meters', 'y-unit');
    y.append(ylabel, yvalue, yunit);
    let zoom = makeElement('geographic-infos');
    let zoomlabel = makeElement('coordinates-label coordinates-text', 'zoom:', 'zoom-label');
    let zoomvalue = makeElement('coordinates-value coordinates-text', current.zoom, 'zoom-value');
    zoomvalue.setAttribute('contenteditable', 'true');
    zoom.append(zoomlabel, zoomvalue);


    let xval, yval, zoomval;
    $(xvalue).focus(function() { xval = selectTextInDiv(this); });
    $(xvalue).keypress(function(event) {
        if (event.which === 13) {
            event.preventDefault();
            event.target.blur();
        }
    });
    $(xvalue).focusout(function() {
        let val = xvalue.innerHTML;
        let bounds = current.bounds;
        if (isNaN(parseFloat(val)) || val < bounds.min[0] || val > bounds.max[0]) {
            xvalue.innerHTML = xval;
        } else {
            val = parseFloat(val);
            updateOpenLayersMap(param.cartography.olmap, [val, current.center[1]]);
            updateGoogleMap(param.cartography.googlemap, [val, current.center[1]]);
        }
    });

    $(yvalue).focus(function() { yval = selectTextInDiv(this); });
    $(yvalue).keypress(function(event) {
        if (event.which === 13) {
            event.preventDefault();
            event.target.blur();
        }
    });
    $(yvalue).focusout(function() {
        // change y
        let val = yvalue.innerHTML;
        let bounds = current.bounds;
        if (isNaN(parseFloat(val)) || val < bounds.min[1] || val > bounds.max[1]) {
            yvalue.innerHTML = yval;
        } else {
            val = parseFloat(val);
            updateOpenLayersMap(param.cartography.olmap, [current.center[0], val]);
            updateGoogleMap(param.cartography.googlemap, [current.center[0], val]);
        }
    });

    $(zoomvalue).focus(function() { zoomval = selectTextInDiv(this); });
    $(zoomvalue).keypress(function(event) {
        if (event.which === 13) {
            event.preventDefault();
            event.target.blur();
        }
    });
    $(zoomvalue).focusout(function() {
        let val = zoomvalue.innerHTML;
        if (isNaN(parseInt(val))) {
            zoomvalue.innerHTML = zoomval;
        } else {
            val = parseInt(val);
            updateOpenLayersMap(param.cartography.olmap, false, val);
            updateGoogleMap(param.cartography.googlemap, false, val);
        }
    });

    container.appendChild(geoinfoscontainer);

    param.cartography['listeners'] = {};
    addMapListener(current.name, param);

    navigationMode(param);

    waitMap(0.5, function() {
        let menumaps = param.cartography.menumaps;
        for (let i = 0; i < menumaps.length; ++i) {
            if (menumaps[i].name !== 'google') {
                menumaps[i].map.updateSize();
            }
        }
        let containerlist = document.getElementsByClassName('menu-map-container');
        for (let i = 0; i < containerlist.length; i++) {
            addClass(containerlist[i], 'active');
        }
        addClass(geoinfoscontainer, 'active');
    })

    function openInformations(event) {
        event.stopPropagation();
        geoinfoscontainer.removeEventListener('click', openInformations);
        addClass(geoinfoscontainer, 'opened');
        geoinfoscontainer.append(projectioncontainer, x, y, zoom);

        let values = current.center;
        if (current.projection === '4326') { values = project('3857', '4326', values); }
        xvalue.innerHTML = values[0];
        yvalue.innerHTML = values[1];
        zoomvalue.innerHTML = current.zoom;


        waitMap(0.3, function() {
            addClassList([projectioncontainer, x, y, zoom], 'active');
            geoinfos.addEventListener('click', closeInformations);
        })
    }

    function closeInformations(event) {
        event.stopPropagation();
        geoinfos.removeEventListener('click', closeInformations);
        removeClassList([projectioncontainer, x, y, zoom], 'active');

        waitMap(0.2, function() {
            removeClass(geoinfoscontainer, 'opened');
            waitMap(0.3, function() {
                remove(projectioncontainer, x, y, zoom);
                geoinfoscontainer.addEventListener('click', openInformations);
            })
        })
    }

    function swapProjectionDisplay() {
        projectionchange.removeEventListener('click', swapProjectionDisplay);
        let newproj, newtext, newlabel, newunit;
        if (current.projection === '3857') {
            newproj = '4326';
            newtext = 'WGS84 unprojected';
            newlabel = ['lat', 'long'];
            newunit = '°';
        } else {
            newproj = '3857';
            newtext = 'Pseudo mercator';
            newlabel = ['x', 'y'];
            newunit = 'meters';
        }

        current.bounds = {
            min: project(current.projection, newproj, current.bounds.min),
            max: project(current.projection, newproj, current.bounds.max),
        };
        let newcenter = project(current.projection, newproj, current.center);
        current.center = newcenter;

        current.projection = newproj;
        xvalue.innerHTML = newcenter[0];
        yvalue.innerHTML = newcenter[1];
        xlabel.innerHTML = newlabel[0];
        ylabel.innerHTML = newlabel[1];
        xunit.innerHTML = newunit;
        yunit.innerHTML = newunit;
        projectioninfos.innerHTML = '';
        projectioninfos.style.width = calculateTextWidth(newtext, getComputedStyle(projectioninfos)) + 'px';
        waitMap(0.2, function() {
            projectioninfos.innerHTML = newtext;
            projectionchange.addEventListener('click', swapProjectionDisplay);
        })
    }
}