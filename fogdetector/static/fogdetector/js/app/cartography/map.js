/**
 * @map 
 * Defines OpenLayers's object and related functions.
 */

function constructMap(param) {
    param = createBasemapLayers(param);
    createMap(param);
    return param;
}

function getRandomLocation(array) {
    let randomStart = arrayRandomItem(array);
    let coordinates = [randomStart[0], randomStart[1]];
    let zoom = randomStart[2];
    let basemap = randomStart[3]
    return [basemap, coordinates, zoom];
}

function createMap(param) {
    let cartography = param.cartography;
    let randomStart = getRandomLocation(cartography.startView);

    //Definition of the target displayed throughout the experience
    let style = cartography.styles.target;
    let target = createTarget([], style, false, param);

    //View definition
    var view = new ol.View({
        center: randomStart[1],
        zoom: randomStart[2],
    })

    //Map definition
    var map = new ol.Map({
        target: 'map',
        layers: [
            cartography.basemaps[randomStart[0]].layer
        ],
        view: view,
        //Remove all interactions from the map
        interactions: getNoInteractions(),
    });

    param.cartography['target'] = target;
    param.cartography['view'] = view;
    param.cartography['map'] = map;
    return param;
}

function createBasemapLayers(param) {
    try {
        let basemaps = param.cartography.basemaps;
        let updated = {};

        for (let i = 0; i < basemaps.length; i++) {
            let item = basemaps.slice(i, i + 1)[0];
            let source = item.source;
            let preload = item.preload;
            let layer = returnBasemapLayer(source, preload, param);
            updated[item.name] = {
                layer: layer,
                source: source,
            }
        }
        param.cartography.basemaps = updated;
        return param;
    } catch (e) {
        console.log(e);
    }
}

function updateTarget(coordinates, param) {
    param.cartography.target.getSource().getFeatures()[0].getGeometry().setCoordinates(coordinates);
};

function returnBasemapLayer(source, preload, param) {
    try {
        let layer;
        if (source.type === 'OSM') {
            layer = new ol.layer.Tile({
                preload: preload,
                source: new ol.source.OSM()
            });
        } else if (source.type === 'WMTS') {
            let tileOptions;
            if (source.provider === 'IGN') {
                tileOptions = returnIGNTileGrid();
            } else {
                tileOptions = generateTileGrid();
            }
            layer = new ol.layer.Tile({
                preload: 0,
                source: new ol.source.WMTS({
                    url: source.url.replace('IGN_SECRET_KEY', param.keys.ign),
                    layer: source.layer,
                    matrixSet: source.matrixSet,
                    format: source.format,
                    style: source.style,
                    dimensions: source.dimensions,
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

        return layer;

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

function generateMenuMap(div, object, param) {
    try {
        let mapObj;
        if (object.display === 'empty') {
            //Type 'target' displays a target in the center of the map
            mapObj = createMenuMap(div, false, object, param);
        } else if (object.display === 'target') {
            //Type 'target' displays a target in the center of the map
            mapObj = createMenuMap(div, true, object, param);
        } else if (object.display === 'results') {
            //Type 'results' to display average distance
            mapObj = createMenuMap(div, param.results, object, param);
        } else if (object.display === 'animation') {
            //Type 'animation' creates an infinite zoom in animation
            mapObj = createMenuMap(div, false, object, param);
            infiniteZoomAnimation(mapObj, param);
        } else if (object.display === 'click') {
            //Type 'click' creates an infinite click animation in the center of the map
            mapObj = createMenuMap(div, false, object, param);
            infiniteClickEffect(div);
        } else {
            throw ('Map type is not valid. ' + object.display + ' is not handled. Check your config.js file.');
        }
    } catch (e) {
        console.log(e);
    }
}

/**
 * Create a small map for the tutorial.
 *
 * @param {string} div: The target id where the map will be created.
 * @param {target} boolean: If a target is created on the map.
 */
function createMenuMap(div, target, object, param) {
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

    if (target) {
        if (typeof(target) === 'object') {
            menuMap = resultsTargets(menuMap, param);
        } else {
            menuMap.addLayer(createTarget(param.cartography.defaultTarget, param.cartography.styles.target, false, param));
        }
    }

    return menuMap;

    function resultsTargets(menuMap, param) {
        let resolution = menuMap.getView().getResolution();
        let locationTarget = param.cartography.defaultTarget;

        let userStyle = param.cartography.styles.userResults;
        let allStyle = param.cartography.styles.allResults;

        let avgUser = param.results.user['distance-avg'];
        let avgAll = param.results.all['distance-avg'];

        let scatUser = avgUser / 4;
        let scatAll = avgAll / 4;

        let userY = locationTarget[1] + (scatUser * resolution);
        let userX = locationTarget[0] - (Math.sqrt(squared(avgUser) - squared(scatUser)) * resolution);

        let allY = locationTarget[1] - (scatAll * resolution);
        let allX = locationTarget[0] - (Math.sqrt(squared(avgAll) - squared(scatAll)) * resolution);

        let locationUser = [userX, userY];
        let locationAll = [allX, allY];
        let minX = Math.min(userX, allX);
        let newX = locationTarget[0] - ((locationTarget[0] - minX) / 2);

        menuMap.addLayer(createTargetArea(locationTarget, param));
        menuMap.addLayer(createSimpleLine(locationTarget, locationUser, userStyle.circles[0]))
        menuMap.addLayer(createSimpleLine(locationTarget, locationAll, allStyle.circles[0]))
        menuMap.addLayer(createTarget(locationTarget, param.cartography.styles.targetResults, true, param));
        menuMap.addLayer(createTarget(locationUser, userStyle, true, param));
        menuMap.addLayer(createTarget(locationAll, allStyle, true, param));

        menuMap.getView().setCenter([newX, locationTarget[1]]);
        return menuMap
    }
};

function createSimpleLine(start, end, style) {
    return new ol.layer.Vector({
        source: new ol.source.Vector({
            features: [
                new ol.Feature({
                    geometry: new ol.geom.LineString([start, end]),
                })
            ],
        }),
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: style.color,
                width: style.width,
            }),
        }),
    })
}

function createTarget(position, targetStyle, label, param) {
    let center = createCenter(targetStyle, label, param);
    let circles = createCircles(targetStyle.circles);
    layerStyle = center.concat(circles);

    let r = new ol.layer.Vector({
        source: new ol.source.Vector({
            features: [
                new ol.Feature({
                    geometry: new ol.geom.Point(position),
                })
            ],
        }),
        style: layerStyle
    })
    return r
}

function createCenter(s, label, param) {
    let r = new ol.style.Style({
        image: new ol.style.Circle({
            fill: new ol.style.Fill({ color: s.center.color }),
            radius: s.center.radius,
        }),
        zIndex: 10
    })

    if (label) {
        r.setText(createTextStyle(s.label, param));
    }
    return [r]
}

function createCircles(s) {
    let r = [];
    for (let i = 0; i < s.length; i++) {
        style = new ol.style.Style({
            image: new ol.style.Circle({
                radius: s[i].radius,
                stroke: new ol.style.Stroke({
                    color: s[i].color,
                    width: s[i].width,
                }),
            }),
            zIndex: (i + 2) * 10,
        })
        r.push(style)
    }
    return r;
}

function createTextStyle(s, param) {
    return new ol.style.Text({
        textAlign: s.align,
        textBaseline: s.baseline,
        font: 'bold ' + s.size + ' Ubuntu',
        text: s.text[param.currentpage.language],
        fill: new ol.style.Fill({ color: s.color }),
        backgroundFill: new ol.style.Fill({ color: s.backcolor }),
        padding: [s.padding, s.padding, s.padding, s.padding],
        offsetY: s.offsety,
        offsetX: s.offsetx,
    });
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

function changeMapBasemap(basemap, param) {
    let layers = param.cartography.basemaps;
    let map = param.cartography.map;
    Object.keys(layers).forEach(function(key) {
        map.removeLayer(layers[key].layer);
    })
    let layer = layers[basemap].layer;
    map.addLayer(layer);
    return layer;
}

function mapToDefault(param) {
    let view = param.cartography.view;
    let randomLocation = getRandomLocation(param.cartography.startView);
    changeMapBasemap(randomLocation[0], param);
    view.setCenter(randomLocation[1]);
    view.setZoom(randomLocation[2]);
}

function getTileCount(map, tileGrid) {
    let size = map.getSize();
    let view = map.getView();
    let extent = view.calculateExtent(size);
    let zoom = view.getZoom();
    let count = 0;
    tileGrid.forEachTileCoord(extent, zoom, function() {
        ++count;
    });
    return count
}

function createTargetArea(target, param) {
    let area = param.cartography.styles.clickArea;
    let r = new ol.layer.Vector({
        source: new ol.source.Vector({
            features: [
                new ol.Feature({
                    geometry: new ol.geom.Point(target),
                })
            ],
        }),
        style: [
            new ol.style.Style({
                image: new ol.style.Circle({
                    fill: new ol.style.Fill({ color: area.center.color }),
                    radius: area.center.radius,
                }),
                zIndex: 5,
            })
        ]
    })
    return r
}