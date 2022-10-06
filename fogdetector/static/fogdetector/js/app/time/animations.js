/**
 * @animations 
 * Defines functions that creates animations or calculate animation-related values.
 */


/**
 * Animate the OpenLayers' view.
 *
 * @callback callback: Use to define an other function when animation ends.
 *
 * @param {integer} zoom: The new zoom level of the view.
 * @param {tuple} center: The new center of the view.
 * @param {int} duration: Duration of the animation in seconds.
 * @param {method} easing: OpenLayers method defining the behavior of the animation.
 *
 * @return {real}: a number between 0 and 1.
 */
function animInter(zoom, center, duration, easing, view, callback) {
    view.animate({
        zoom: zoom,
        center: center,
        easing: easing,
        duration: duration * 1000,
    }, callback);
};

//Function to run an infinite zoom animation for the tutorial
function infiniteZoomAnimation(map, param) {
    let v = map.getView();
    let z = v.getZoom();
    v.setZoom(z - 3);
    waitMap(1, function() {
        v.animate({
            zoom: z,
            easing: getEasingAnimation(param.global.general.animations.easing.zoomin),
            duration: 2000,
        }, function() {
            waitMap(1, function() {
                infiniteZoomAnimation(map, param);
            });
        });
    });
}

function getEasingAnimation(easing) {
    try {
        let e;
        if (easing === 'in') {
            e = ol.easing.easeIn;
        } else if (easing === 'out') {
            e = ol.easing.easeOut;
        } else if (easing === 'inOut') {
            e = ol.easing.easeInAndOut;
        } else {
            throw ("Easing type (" + easing + ") doesn't exist, check your configuration.");
        }
        return e;
    } catch (e) {
        console.log(e);
    }
}

function infiniteClickEffect(target) {
    let t = document.getElementById(target);
    let d = document.createElement('div');
    d.setAttribute('class', 'click-effect click-infinite');
    t.appendChild(d);
    d.addEventListener('animationend', function() {
        d.parentElement.removeChild(d);
        infiniteClickEffect(target);
    }.bind(this));
}

function infiniteClickEffectMap(coordinates, map) {
    let t = document.getElementById('container');
    let d = document.createElement('div');
    let xy = map.getPixelFromCoordinate(coordinates);
    d.setAttribute('id', 'current-click-effect');
    d.setAttribute('class', 'click-effect click-infinite');
    d.style.position = 'absolute';
    d.style.top = xy[1] + 'px';
    d.style.left = xy[0] + 'px';
    t.appendChild(d);
    d.addEventListener('animationend', function() {
        d.parentElement.removeChild(d);
        infiniteClickEffectMap(coordinates, map);
    }.bind(this));
}

function clickEffect(x, y) {
    let d = document.createElement('div');
    d.setAttribute('class', 'click-effect click-standard');
    d.style.position = 'absolute';
    d.style.top = y + 'px';
    d.style.left = x + 'px';
    document.body.appendChild(d);
    d.addEventListener('animationend', function() {
        d.parentElement.removeChild(d);
    }.bind(this));
}