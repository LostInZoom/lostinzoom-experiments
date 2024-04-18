/**
 * Wait x seconds without doing anything.
 *
 * @callback callback: Use to define an other function when waiting ends.
 *
 * @param {integer} duration: Duration to wait in seconds.
 */
function waitMap(duration, callback) {
    duration = duration * 1000;
    setTimeout(callback, duration);
};

function onClickE(e, once, callback) {
    e.addEventListener('click', function(e) {
        callback(e);
    }, { once: once });
};

//Verify if html element has a given class
function hasClass(el, className) {
    if (el.classList)
        return el.classList.contains(className)
    else
        return !!el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'))
};

//Add a class to an html element if not already present
function addClass(el, className) {
    if (el.classList)
        el.classList.add(className)
    else if (!hasClass(el, className)) el.className += " " + className
};

//Add a class to an html element if not already present
function addClassList(elements, className) {
    for (let i = 0; i < elements.length; ++i) {
        let el = elements[i];
        if (el.classList)
            el.classList.add(className)
        else if (!hasClass(el, className)) el.className += " " + className
    }
};

//Remove a class from an html element if class exists
function removeClass(el, className) {
    if (el.classList)
        el.classList.remove(className)
    else if (hasClass(el, className)) {
        var reg = new RegExp('(\\s|^)' + className + '(\\s|$)')
        el.className = el.className.replace(reg, ' ')
    }
};

//Remove a class from a list of html elements
function removeClassList(elements, className) {
    for (let i = 0; i < elements.length; ++i) {
        removeClass(elements[i], className)
    }
};

function selectItems(...arg) {
    for (let i = 0; i < arg.length; i++) {
        addClass(div, 'selected');
    }
}

function deselectItems(...arg) {
    for (let i = 0; i < arg.length; i++) {
        removeClass(div, 'selected');
    }
}

function display(...arg) {
    for (let i = 0; i < arg.length; i++) {
        let div = document.getElementById(arg[i]);
        removeClass(div, 'hidden');
        addClass(div, 'displayed');
    }
}

function displayE(...arg) {
    for (let i = 0; i < arg.length; i++) {
        removeClass(arg[i], 'hidden');
        addClass(arg[i], 'displayed');
    }
}

//Hide a div
function hide(...arg) {
    for (let i = 0; i < arg.length; i++) {
        let div = document.getElementById(arg[i]);
        removeClass(div, 'displayed');
        addClass(div, 'hidden');
    }
};

function hideE(...arg) {
    for (let i = 0; i < arg.length; i++) {
        removeClass(arg[i], 'displayed');
        addClass(arg[i], 'hidden');
    }
}

function hideEList(array) {
    for (let i = 0; i < array.length; i++) {
        hideE(array[i]);
    }
}

//Create a div with specified attributes
function makeElement(className, content, id) {
    let e = document.createElement('div');
    if (id) { e.setAttribute('id', id) }
    if (className) { e.setAttribute('class', className) }
    if (content) { e.innerHTML = content; }
    return e;
}

//Apply a style to a dom element
function applyStyle(e, s) {
    Object.keys(s).forEach(function(key) {
        let k = s[key];
        e.style[key] = k;
    });
    return e;
}

//Remove elements from dom
function remove(...args) {
    for (let i = 0; i < args.length; i++) {
        args[i].remove();
    }
}

//Remove map listeners
function removemapListener(...arg) {
    for (let i = 0; i < arg.length; i++) {
        ol.Observable.unByKey(arg[i]);
    }
}

function replaceByClone(e) {
    let clone = e.cloneNode(true);
    e.parentNode.replaceChild(clone, e);
    return clone;
}

function simulateMouseEvent(e, eventName, params) {
    let properties = {
        view: window,
        bubbles: true,
        cancelable: true
    }
    if (params) {
        Object.keys(params).forEach(function(key) {
            let value = params[key];
            properties[key] = value;
        });
    }
    let mouseE = new MouseEvent(eventName, properties);
    e.dispatchEvent(mouseE);
}

function simulateWheelEvent(e, params) {
    let wheelevent = new WheelEvent('wheel', params);
    e.dispatchEvent(wheelevent);
}

function stopPropagationOnAllEvent(...arg) {
    let events = [
        'mousemove', 'click', 'dblclick', 'mousedown',
        'mouseup', 'mouseover', 'mouseout'
    ]
    for (let e = 0; e < arg.length; e++) {
        for (let i = 0; i < events.length; ++i) {
            arg[e].addEventListener(events[i], function(event) {
                event.stopPropagation();
            })
        }
    }
}

function createListElement(content, level) {
    let e = document.createElement('li');
    e.setAttribute('class', 'list-entry-' + level);
    e.innerHTML = content;
    return e;
}

function createList(array, ordered, level) {
    let list;
    if (ordered) {
        list = document.createElement('ol');
    } else {
        list = document.createElement('ul');
    }
    list.setAttribute('class', 'list-level-' + level);
    for (let i = 0; i < array.length; i++) {
        if (Object.prototype.toString.call(array[i]) === '[object Object]') {
            let sublist = createList(array[i].texts, array[i].ordered, level + 1);
            list.appendChild(sublist);
        } else {
            let li = createListElement(array[i], level);
            list.appendChild(li);
        }
    }
    return list;
}

function selectTextInDiv(e) {
    let range = document.createRange();
    range.selectNodeContents(e);
    let sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    return e.innerHTML.replace(/(<br>\s*)+$/, '');
}

function clearSelection() {
    if (window.getSelection) {
        if (window.getSelection().empty) {
            window.getSelection().empty();
        } else if (window.getSelection().removeAllRanges) {
            window.getSelection().removeAllRanges();
        }
    } else if (document.selection) {
        document.selection.empty();
    }
}

function updateObject(object, key, value) {
    object[key] = value;
}

function setIntervalAndExecute(fn, t) {
    fn();
    return (setInterval(fn, t));
}

function calculateTextWidth(text, style) {
    let dummy = document.createElement('div');
    dummy.style.fontFamily = style.fontFamily;
    dummy.style.fontSize = style.fontSize;
    dummy.style.fontWeight = style.fontWeight;
    dummy.style.fontStyle = style.fontStyle;
    dummy.style.height = 'auto';
    dummy.style.width = 'auto';
    dummy.style.position = 'absolute';
    dummy.style.whiteSpace = 'nowrap';
    dummy.innerHTML = text;
    document.body.appendChild(dummy);
    let width = Math.ceil(dummy.clientWidth);
    remove(dummy);
    return width;
}

function getUserInfos() {
    let container = document.getElementById('menu-container');
    let user = {
        userAgent: navigator.userAgent,
        resolution: [container.clientWidth, container.clientHeight]
    }
    return user
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}