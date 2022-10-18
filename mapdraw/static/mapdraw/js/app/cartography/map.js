/**
 * @map 
 * Defines OpenLayers's object and related functions.
 */

function constructMap(param) {
    let start = param.cartography.currentview;
    start.name === 'google' ? display('google-map') : display('ol-map');
    param = createBasemapLayers(param);
    param = constructOpenLayersMap('ol-map', param, start);
    param = constructGoogleMap('google-map', param, start);
    return param;
}

function constructOpenLayersMap(target, param, opt) {
    let basemaps = param.cartography.basemaps;
    param.cartography['olmap'] = createOpenLayersMap(target, opt);
    for (let i = 0; i < basemaps.length; i++) {
        if (basemaps[i].name !== 'google') {
            param.cartography['olmap'].addLayer(basemaps[i].layer);
        }
    }
    setOpenLayersBasemap(opt.name, param);
    return param;
}

function createOpenLayersMap(target, opt) {
    let view = new ol.View({
        center: opt.center,
        zoom: opt.zoom,
        constrainResolution: true
    })
    return new ol.Map({
        target: target,
        view: view,
        interactions: getCustomInteractions(),
    });
}

function setOpenLayersBasemap(basemap, param) {
    let basemaps = param.cartography.basemaps;
    for (let i = 0; i < basemaps.length; i++) {
        if (basemaps[i].name === basemap) {
            basemaps[i].layer.setVisible(true);
        } else {
            if (basemaps[i].name !== 'google') {
                basemaps[i].layer.setVisible(false);
            }
        }
    }
}

function constructGoogleMap(target, param, opt) {
    param.cartography['googlemap'] = createGoogleMap(target, opt);
    return param;
}

function createGoogleMap(target, opt) {
    let div = document.getElementById(target);
    let center = olCoordinateToGoogle(opt.center);
    return new google.maps.Map(div, {
        center: { lat: center[1], lng: center[0] },
        zoom: opt.zoom,
        disableDefaultUI: true,
        keyboardShortcuts: true,
    });
}

function createSelectionMap(target, param, opt) {
    if (opt.name === 'google') {
        return createGoogleMap(target, opt);
    } else {
        let olmap = createOpenLayersMap(target, opt);
        let basemaps = param.cartography.basemaps;
        for (let i = 0; i < basemaps.length; i++) {
            if (basemaps[i].name === opt.name) {
                olmap.addLayer(returnBasemapLayer(basemaps[i].source, basemaps[i].preload, param));
            }
        }
        return olmap;
    }
}

function createMenuMap(div, object, param) {
    if (object.basemap === 'google') { object.basemap = 'pign' }

    let source = param.cartography.basemaps[object.basemap].source;
    let layer = returnBasemapLayer(source, false, param);

    let menuMap = new ol.Map({
        target: div,
        layers: [
            layer
        ],
        view: new ol.View({
            center: object.center,
            zoom: object.zoom,
        }),
        interactions: getNoInteractions(),
    });
    return menuMap;
};

function createBasemapLayers(param) {
    try {
        let basemaps = param.cartography.basemaps;
        for (let i = 0; i < basemaps.length; i++) {
            let source = basemaps[i].source;
            let preload = basemaps[i].preload;
            let layer = returnBasemapLayer(source, preload, param);
            if (layer) { basemaps[i]['layer'] = layer; }
        }
        return param;
    } catch (e) {
        console.log(e);
    }
}

function returnBasemapLayer(source, preload, param) {
    try {
        if (source.type === 'OSM') {
            return new ol.layer.Tile({
                preload: preload,
                source: new ol.source.OSM()
            });
        } else if (source.type === 'Google') {
            return false;
        } else if (source.type === 'WMTS') {
            let tileOptions;
            if (source.provider === 'IGN') {
                tileOptions = returnIGNTileGrid();
            } else {
                tileOptions = generateTileGrid();
            }
            return new ol.layer.Tile({
                preload: preload,
                source: new ol.source.WMTS({
                    url: source.url.replace('IGN_SECRET_KEY', param.keys.ign),
                    crossOrigin: 'anonymous',
                    layer: source.layer,
                    matrixSet: source.matrixSet,
                    format: source.format,
                    style: source.style,
                    dimensions: source.dimensions,
                    requestEncoding: source.requestEncoding,
                    tileGrid: new ol.tilegrid.WMTS({
                        origin: source.tileGrid.origin,
                        resolutions: tileOptions[0],
                        matrixIds: tileOptions[1],
                    })
                })
            })
        } else {
            throw source.type + ' basemap source type not handled.'
        }

        //Return a TileGrid suited for IGN WMTS source
        function returnIGNTileGrid() {
            let resolutions = [
                156543.03392804103, 78271.5169640205, 39135.75848201024, 19567.879241005125, 9783.939620502562,
                4891.969810251281, 2445.9849051256406, 1222.9924525628203, 611.4962262814101, 305.74811314070485,
                152.87405657035254, 76.43702828517625, 38.218514142588134, 19.109257071294063, 9.554628535647034,
                4.777314267823517, 2.3886571339117584, 1.1943285669558792, 0.5971642834779396, 0.29858214173896974,
                0.14929107086948493, 0.07464553543474241
            ];
            let matrixIds = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19"];
            return [resolutions, matrixIds];
        }

        //Generate a generic TileGrid
        function generateTileGrid() {
            let projection = ol.proj.get('EPSG:3857');
            let projectionExtent = projection.getExtent();
            let size = ol.extent.getWidth(projectionExtent) / 256;

            let resolutions = new Array(14);
            let matrixIds = new Array(14);
            for (let z = 0; z < 14; ++z) {
                resolutions[z] = size / Math.pow(2, z);
                matrixIds[z] = z;
            }
            return [resolutions, matrixIds];
        }
    } catch (e) {
        console.log(e);
    }
};

function getNoInteractions() {
    return new ol.interaction.defaults({
        altShiftDragRotate: false,
        doubleClickZoom: false,
        keyboard: false,
        mouseWheelZoom: false,
        shiftDragZoom: false,
        dragPan: false,
        pinchRotate: false,
        pinchZoom: false,
        pointerInteraction: true,
    });
}

function getCustomInteractions() {
    return new ol.interaction.defaults({
        altShiftDragRotate: false,
        doubleClickZoom: true,
        keyboard: false,
        mouseWheelZoom: true,
        shiftDragZoom: true,
        dragPan: true,
        pinchRotate: false,
        pinchZoom: true,
        pointerInteraction: true,
    });
}

function olCoordinateToGoogle(coordinates) {
    return project('3857', '4326', [parseInt(coordinates[0]), parseInt(coordinates[1])]);
}

function googleCoordinatesToOL(coordinates) {
    return project('4326', '3857', [coordinates.lng(), coordinates.lat()]);
}

function addMapListener(basemap, param) {
    basemap === 'google' ? createGoogleListener(param) : createOlListener(param);
}

function removeMapListener(basemap, param) {
    basemap === 'google' ? google.maps.event.removeListener(param.cartography.listeners.google) : ol.Observable.unByKey(param.cartography.listeners.ol)
}

function createOlListener(param) {
    if ('google' in param.cartography.listeners) { removeMapListener('google', param) }
    param.cartography.listeners['ol'] = param.cartography.olmap.on('postrender', function(event) {
        let view = event.map.getView();
        let center = view.getCenter();
        let zoom = view.getZoom();
        param.cartography.currentview.center = center;
        param.cartography.currentview.zoom = zoom;
        updateSelectionMaps(center, zoom, param);
        updateGoogleMap(param.cartography.googlemap, center, zoom);
        updateGeographicInformations(center, zoom, param);
    });
}

function createGoogleListener(param) {
    if ('ol' in param.cartography.listeners) { removeMapListener('ol', param) }
    param.cartography.listeners['google'] = param.cartography.googlemap.addListener('bounds_changed', function() {
        let map = param.cartography.googlemap;
        let center = googleCoordinatesToOL(map.getCenter());
        let zoom = map.getZoom();
        param.cartography.currentview.center = center;
        param.cartography.currentview.zoom = zoom;
        updateSelectionMaps(center, zoom, param);
        updateOpenLayersMap(param.cartography.olmap, center, zoom);
        updateGeographicInformations(center, zoom, param);
    });
}

function updateSelectionMaps(center, zoom, param) {
    let menumaps = param.cartography.menumaps;
    for (let i = 0; i < menumaps.length; ++i) {
        if (menumaps[i].name === 'google') {
            updateGoogleMap(menumaps[i].map, center, zoom);
        } else {
            updateOpenLayersMap(menumaps[i].map, center, zoom);
        }
    }
}

function updateOpenLayersMap(map, center, zoom) {
    if (center) { map.getView().setCenter(center); }
    if (zoom) { map.getView().setZoom(zoom); }
    map.updateSize();
}

function updateGoogleMap(map, center, zoom) {
    if (center) {
        let projcenter = olCoordinateToGoogle(center);
        map.moveCamera({ center: { lat: projcenter[1], lng: projcenter[0] } });
    }
    if (zoom) {
        map.moveCamera({ zoom: zoom });
    }
}

function switchBasemap(basemap, param) {
    let current = param.cartography.currentview;
    if (basemap.name === 'google' && current.name !== 'google') {
        display('google-map');
        hide('ol-map');
        addMapListener(basemap.name, param);
    } else {
        if (current.name === 'google') {
            display('ol-map');
            hide('google-map');
            setOpenLayersBasemap(basemap.name, param);
            addMapListener(basemap.name, param);
        } else {
            setOpenLayersBasemap(basemap.name, param);
        }
    }
    param.cartography.currentview.name = basemap.name;
    param.cartography.currentview.fullname = basemap.fullname;
}

function updateGeographicInformations(center, zoom, param) {
    // if (param.cartography.currentview.projection === "4326") {
    //     center = olCoordinateToGoogle(center);
    // }
    let xvalue = document.getElementById('x-value');
    let yvalue = document.getElementById('y-value');
    let zoomvalue = document.getElementById('zoom-value');
    if (xvalue) { xvalue.innerHTML = center[0]; }
    if (yvalue) { yvalue.innerHTML = center[1]; }
    if (zoomvalue) { zoomvalue.innerHTML = parseInt(zoom); }
}

function downloadMapImage(data, param) {
    let container = document.getElementById('container');
    let width = container.offsetWidth;
    let height = container.offsetHeight;

    let mapCanvas = document.createElement('canvas');
    mapCanvas.width = width;
    mapCanvas.height = height;
    let mapContext = mapCanvas.getContext('2d');
    param.cartography.currentview.name === 'google' ? getGooglecanvas(printMap) : getOLcanvas(printMap)

    function printMap(layers) {
        layers.forEach(function(canvas) { mapContext.drawImage(canvas, 0, 0); })
        createLegend(data, function(legend) {
            mapContext.drawImage(legend, (width - (document.getElementById('legend-container').offsetWidth + 15)), 15);
            mapContext.globalAlpha = 1;
            mapContext.setTransform(1, 0, 0, 1, 0, 0);
            let link = document.createElement('a');
            link.style.display = 'none';
            document.body.appendChild(link);
            link.setAttribute('href', mapCanvas.toDataURL());
            link.setAttribute('download', data.filename + '.png');
            link.click();
            link.remove();
            document.getElementById('legend-container').remove();
        });
    }

    function getGooglecanvas(callback) {
        let googlemap = document.getElementById('google-map');
        html2canvas(googlemap, {
            useCORS: true,
            x: 25,
            y: 25,
            logging: false
        }).then(function(canvas) {
            callback(new Set([
                canvas,
                ...document.querySelectorAll('.canvas-container > canvas.lower-canvas')
            ]));
        })
    }

    function getOLcanvas(callback) {
        let map = param.cartography.olmap;
        map.once('rendercomplete', function() {
            callback(new Set([
                ...map.getViewport().querySelectorAll('.ol-layer canvas, canvas.ol-layer'),
                ...document.querySelectorAll('.canvas-container > canvas.lower-canvas')
            ]));
        });
        map.renderSync();
    }

    function createLegend(data, callback) {
        let container = document.getElementById('container');
        let layersdiv = document.getElementsByClassName('color-container')[0];
        let width = 307;
        let height = layersdiv.offsetHeight;

        let legendContainer = makeElement(false, false, 'legend-container');
        legendContainer.style.height = height + 'px';
        legendContainer.style.width = width + 'px';
        container.append(legendContainer);

        let time = makeElement('legend-items', 'time: <b>' + data.time + '</b>');
        if (data.layers.length > 1) { time.style.marginTop = '10px' }
        let basemap = makeElement('legend-items', 'basemap: <b>' + data.fullbasemap + '</b>');
        let zoom = makeElement('legend-items', 'zoom: <b>' + data.zoom + '</b>');

        let layers = makeElement('legend-layers-container');
        for (let i = 0; i < data.layers.length; ++i) {
            let layer = makeElement('legend-layers');
            let layercolor = makeElement('legend-layers-color');
            layercolor.style.backgroundColor = data.layers[i].colors.menu;
            let layername = makeElement('legend-layers-name', data.layers[i].name);
            layer.append(layercolor, layername);
            layers.append(layer);
        }

        legendContainer.append(time, basemap, zoom, layers);

        html2canvas(legendContainer, {
            useCORS: true,
            logging: false
        }).then(function(canvas) {
            callback(canvas);
        });
    }
}