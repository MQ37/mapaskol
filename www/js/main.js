// CONSTS

const formaVzdelani = {
    "10": "Denní",
    "22": "Dálková",
    "23": "Večerní",
    "24": "Distanční",
    "30": "Kombinovaná",
};

// GLOBALS
var map = L.map('map');

// VIEW GLOBALS
var reditelstviLoc;
var mistaLoc;
var mistaIco = {};
var subjekty;

// Reditelstvi
var gRCLats = null;
var gRCLons = null;
var gRCSizes = null;

// Mista
var gMCLats = null;
var gMCLons = null;
var gMCSizes = null;

// FILTER GLOBALS
var viewTyp = "reditelstvi";
var filterDruh = [];
var filterKraj = [];
var filterOkres = [];

// INIT

// Set view add tileLayer
map.setView([50.0773301, 14.4269236], 8);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

// Get data and fill map
getData().then((ret) => {
    fillMap(Object.keys(reditelstviLoc), true);
});

// Events
var viewTimeout;
map.on('moveend', () => {
    if (viewTimeout !== undefined) {
        clearTimeout(viewTimeout);
    }
    viewTimeout = setTimeout(() => {
        console.log(map.getZoom());
        fillView();
    }, 500);
});
