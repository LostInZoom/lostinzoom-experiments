/**
 * @geography 
 * Defines functions that handles geographic features.
 */


/**
 * Proceduraly calculate a center for the view based on the target coordinates and the zoom level.
 *
 * @param {tuple} target: The pair of coordinates representing the target (please verify your CRS).
 * @param {integer} zoom: The level of zoom at which the view will be set.
 * @param {real} ratio: A number between 0 and 1 representing the ratio of the allowed spread of the target between the center of the screen and the border.
 *
 * @return {tuple}: return a set of coordinates representing the computed center of the view.
 */
function calculateCenter(target, zoom, param) {
    let mapDiv = document.getElementById('map');
    let width = mapDiv.clientWidth;
    let height = mapDiv.clientHeight;

    let resolution = param.cartography.map.getView().getResolutionForZoom(zoom);
    let area = param.global.general.targetArea;
    let halfWidth = width / 2;
    let halfHeight = height / 2;

    let xScatteringWest = (halfWidth - area.right) * resolution;
    let xScatteringEast = (halfWidth - area.left) * resolution;
    let yScatteringSouth = (halfHeight - area.top) * resolution;
    let yScatteringNorth = (halfHeight - area.bottom) * resolution;

    let x1 = target[0] + xScatteringEast;
    let x2 = target[0] - xScatteringWest;

    let y1 = target[1] + yScatteringNorth;
    let y2 = target[1] - yScatteringSouth;

    let x = getRandomInterval(x1, x2);
    let y = getRandomInterval(y1, y2);

    return [x, y];
};

/**
 * Proceduraly calculate a new center for the pan animation's beginning.
 *
 * @param {tuple} target: The pair of coordinates representing the target (please verify your CRS).
 * @param {integer} zoom: The level of zoom at which the view will be set.
 *
 * @return {tuple}: return a set of coordinates representing the new view center.
 */
function calculateCenterPan(target, zoom, param) {
    let view = param.cartography.view;

    let resolution = view.getResolutionForZoom(zoom);

    let radius = resolution * 3000;
    let angle = getRandomInterval(0, 360);

    //Calculate coordinates on the circle
    let x = target[0] + (radius * Math.sin(angle));
    let y = target[1] + (radius * Math.cos(angle));

    return [x, y];
};

function calculateBorderDistance(target, map) {
    let d = document.getElementById('map');
    let p = map.getPixelFromCoordinate(target);
    return {
        'top': Math.round(p[1]),
        'bottom': Math.round(d.offsetHeight - p[1]),
        'left': Math.round(p[0]),
        'right': Math.round(d.offsetWidth - p[0]),
    }
}

function pathToCoordinates(path, param, offset) {
    let xOffset, yOffset;
    xOffset = yOffset = 0;
    if (offset) {
        xOffset = offset[0];
        yOffset = offset[1];
    }
    let data = [];
    for (let p = 0; p < path.length; ++p) {
        let point = path[p];
        let coord;
        if (point[0] === 'M' || point[0] === 'L') {
            coord = getCoordinatesFromPixel(point[1], point[2], xOffset, yOffset, param);
        } else if (point[0] === 'Q') {
            coord = getCoordinatesFromPixel(point[3], point[4], xOffset, yOffset, param);
        }
        data.push(coord);
    }
    return data
};

function getCoordinatesFromPixel(x, y, offsetx, offsety, param) {
    let result;
    param.cartography.currentview.name === 'google' ? result = googlePixelToCoordinates(param.cartography.googlemap, x, y, offsetx, offsety) : result = olPixelToCoordinates(param.cartography.olmap, x, y, offsetx, offsety);
    return result;
}

function olPixelToCoordinates(map, x, y, offsetx, offsety) {
    return map.getCoordinateFromPixel([x + offsetx, y + offsety])
}

function googlePixelToCoordinates(map, x, y, offsetx, offsety) {
    let bounds = map.getBounds();
    let ne = bounds.getNorthEast();
    let sw = bounds.getSouthWest();
    let nePx = map.getProjection().fromLatLngToPoint(ne);
    let swPx = map.getProjection().fromLatLngToPoint(sw);
    let lngPx = (nePx.x - swPx.x) * ((x + offsetx) / window.innerWidth) + swPx.x;
    let latPx = (swPx.y - nePx.y) * ((y + offsety) / window.innerHeight) + nePx.y;
    let location = map.getProjection().fromPointToLatLng(new google.maps.Point(lngPx, latPx));
    return project('4326', '3857', [location.lng(), location.lat()]);
}

function pxToMeters(value, zoom, param) {
    let meters, map;
    if (param.cartography.currentview === 'google') {
        map = param.cartography.googlemap;
        let coord1 = googlePixelToCoordinates(map, 0, 0, 0, 0);
        let coord2 = googlePixelToCoordinates(map, value, 0, 0, 0);
        meters = parseInt(coord2[0] - coord1[0]);
    } else {
        map = param.cartography.olmap;
        let resolution = map.getView().getResolutionForZoom(zoom);
        meters = parseInt(parseInt(value) * resolution)
    }
    return meters;
}

function project(epsg1, epsg2, coordinates) {
    return proj4(proj4.defs('EPSG:' + epsg1), proj4.defs('EPSG:' + epsg2), coordinates);
}