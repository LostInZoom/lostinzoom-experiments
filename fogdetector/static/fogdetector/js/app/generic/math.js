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