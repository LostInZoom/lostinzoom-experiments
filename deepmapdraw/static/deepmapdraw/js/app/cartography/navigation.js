/**
 * @navigation
 * Defines the navigation tools.
 */

function navigationMode(param) {
    param['mode'] = 'navigation';
    let container = document.getElementById('container');

    let drawingcontainer = makeElement('mode-container drawing-mode-container');
    let drawingbutton = makeElement('mode-button', `<img src='../static/mapdraw/img/drawing.svg' />`);
    let tooltip = makeElement('drawing-control-tooltip', 'Drawing mode');
    drawingbutton.addEventListener('mouseenter', function(event) {
        addClass(tooltip, 'active');
    })
    drawingbutton.addEventListener('mouseleave', function(event) {
        removeClass(tooltip, 'active');
    })
    drawingcontainer.append(tooltip, drawingbutton);
    container.appendChild(drawingcontainer);

    waitMap(0.5, function() {
        addClass(drawingbutton, 'active');
        drawingbutton.addEventListener('click', drawingModeListener);
    })

    function drawingModeListener(event) {
        drawingbutton.removeEventListener('click', drawingModeListener);
        let selection = document.getElementById('basemap-selection');
        let geoinfos = document.getElementsByClassName('geo-infos-container')[0];
        removeClassList([drawingbutton, tooltip, geoinfos], 'active');
        addClass(selection, 'drawing-mode');
        drawingMode(param);
        waitMap(0.5, function() {
            remove(drawingcontainer);
        });
    }
}