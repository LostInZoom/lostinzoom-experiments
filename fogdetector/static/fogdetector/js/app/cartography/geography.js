/**
 * @geography 
 * Defines functions that handles geographic features.
 */


/**
 * Proceduraly calculate a center for the view based on the target coordinates and the zoom level.
 *
 * @param {tuple} target: The pair of coordinates representing the target (please verify your CRS).
 * @param {integer} zoom: The level of zoom at which the view will be set.
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