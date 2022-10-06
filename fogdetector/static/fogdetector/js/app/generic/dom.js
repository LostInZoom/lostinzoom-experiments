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

//Remove a class from an html element if class exists
function removeClass(el, className) {
    if (el.classList)
        el.classList.remove(className)
    else if (hasClass(el, className)) {
        var reg = new RegExp('(\\s|^)' + className + '(\\s|$)')
        el.className = el.className.replace(reg, ' ')
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

function adjustPageContent(param) {
    let pageDiv = document.getElementById('page');
    if (pageDiv) {
        let pageContent = document.getElementById('page-content');
        removeClass(pageDiv, 'page-overflow');
        removeClass(pageDiv, 'page-underflow');
        if (pageContent.offsetHeight < pageDiv.offsetHeight) {
            //If the page content doesn't overflow the page, we set the proper class 
            addClass(pageDiv, 'page-underflow');
            param.currentpage.scroller = false;
            handleSideScroller(param);
        } else {
            //If the page content overflow the page, we set the proper class
            addClass(pageDiv, 'page-overflow');
            param.currentpage.scroller = true;
            handleSideScroller(param);
        }
    }
}

function handleSideScroller(param) {
    if (param.currentpage.scroller) {
        if (document.getElementById('scroller-container')) {
            displayScroller();
        } else {
            createScrollerElements(function() {
                displayScroller();
            });
        }
    } else {
        let container = document.getElementById('scroller-container');
        if (container) {
            remove(container);
        }
    }

    function createScrollerElements(callback) {
        let menu = document.getElementById('menu-container');
        let container = makeElement(false, false, 'scroller-container');
        let scroller = makeElement(false, false, 'scroller');
        container.appendChild(scroller);
        menu.appendChild(container);
        waitMap(0.1, function() {
            container.style.width = '20px';
            callback();
        });
    }

    function displayScroller() {
        let scroller = document.getElementById('scroller');
        let page = document.getElementById('page');
        let pageContent = document.getElementById('page-content');
        let pCHeight = pageContent.offsetHeight;
        let pHeight = page.offsetHeight;
        let height = ((100 * pHeight) / pCHeight);
        scroller.style.height = height + '%';
        scroller.style.top = '0%';

        page.addEventListener('scroll', function(event) {
            moveSideScroller(event, height);
        }, { passive: true });
    }

    function moveSideScroller(e, height) {
        let scroller = document.getElementById('scroller');
        let scrollTop = e.target.scrollTop;
        let scrollMax = e.target.scrollTopMax;
        let scrolled = (((100 - height) * scrollTop) / scrollMax);

        scroller.style.top = scrolled + '%';
    }
}

function calculateTextWidth(text, style) {
    let dummy = document.createElement('span');
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

function createTable(object) {

}