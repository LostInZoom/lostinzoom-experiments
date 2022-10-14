//Return a random integer between an inclusive interval
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//Return a random real between an interval
function getRandomInterval(min, max) {
    return Math.random() * (max - min) + min;
};

//Round to the closest multiple of 5
function round5(x) {
    return Math.round(x / 5) * 5;
}

//Square the given value
function squared(x) {
    return x ** 2;
}

//Return a random item from an array
function arrayRandomItem(array) {
    let item = array[Math.floor(Math.random() * array.length)];
    return item;
}

//Return a random item from an array
function arrayRemoveRandomItem(array) {
    let item = array.splice(Math.floor(Math.random() * array.length), 1);
    return item;
}

//Mixes the items of an array
function shuffleArray(a) {
    let j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

//Returns a random combination of array items
function randomCombi(data) {
    let shuffled = data.map(row => shuffleArray([...row]));
    return shuffled[0].map((_, i) => shuffled.map(row => row[i]));
}

function remapValue(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}


function rgba2hex(orig) {
    let a, isPercent,
        rgb = orig.replace(/\s/g, '').match(/^rgba?\((\d+),(\d+),(\d+),?([^,\s)]+)?/i),
        alpha = (rgb && rgb[4] || "").trim(),
        hex = rgb ?
        (rgb[1] | 1 << 8).toString(16).slice(1) +
        (rgb[2] | 1 << 8).toString(16).slice(1) +
        (rgb[3] | 1 << 8).toString(16).slice(1) : orig;

    if (alpha !== "") {
        a = alpha;
    } else {
        a = 01;
    }
    // multiply before convert to HEX
    a = ((a * 255) | 1 << 8).toString(16).slice(1)
    hex = hex + a;

    return hex;
}

function randomHSVcolour(opt) {
    let h, s, v;
    if (opt.h !== undefined) { h = opt.h } else { h = getRandomInt(0, 360) }
    if (opt.s !== undefined) { s = opt.s } else { s = (getRandomInt(0, 100) / 100) }
    if (opt.v !== undefined) { v = opt.v } else { v = (getRandomInt(0, 100) / 100) }
    return { h: h, s: s, v: v }
}

function hsvToRgb(hsv) {
    let f = (n, k = (n + hsv.h / 60) % 6) => hsv.v - hsv.v * hsv.s * Math.max(Math.min(k, 4 - k, 1), 0);
    let r = remapValue(f(5), 0, 1, 0, 256).toFixed();
    let g = remapValue(f(3), 0, 1, 0, 256).toFixed();
    let b = remapValue(f(1), 0, 1, 0, 256).toFixed();
    return { r: r, g: g, b: b }
}