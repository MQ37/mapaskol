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
var gCLats = null;
var gCLons = null;
var gCSizes = null;

// FILTER GLOBALS
var viewTyp = "reditelstvi";
var filterDruh = [];
var filterKraj = [];
var filterOkres = [];

// UTILS

const getData = () => {
    const promise = new Promise((resolve) => {
        fetch('/data/reditelstvi_loc.json')
            .then((response) => response.json())
            .then((data) => {
                reditelstviLoc = data;
                resolve("done");
            });
    });


    fetch('/data/subjekty.json')
        .then((response) => response.json())
        .then((data) => {
            subjekty = data;

            fetch('/data/mista_loc.json')
                .then((response) => response.json())
                .then((data) => {
                    mistaLoc = data;

                    Object.keys(subjekty).forEach((ico) => {
                        let subj = subjekty[ico];

                        subj.zarizeni.forEach((zar) => {
                            zar.mista.forEach((misto) => {
                                mistaIco[misto.id_mista] = ico;
                            });
                        });

                    });

                });
        });

    return promise;
}


const clearMarkers = () => {
    map.eachLayer((layer) => {
        if (layer.options.alt == "Marker")
            layer.remove();
    });
}

const euclideanDistance = (lat1, lon1, lat2, lon2) => {
    return Math.sqrt((lat1 - lat2) * (lat1 - lat2) +
        (lon1 - lon2) * (lon1 - lon2))
};

const clusterPoints = (lats, lons, minDist, maxDist, minSize) => {
    let centroidLats = [];
    let centroidLons = [];
    let clusterSizes = [];

    let unclusteredLats = lats
    let unclusteredLons = lons;

    /*
    for (let i = 0; i < n; i++) {
        let idx = Math.floor(Math.random() * unclusteredLats.length);
        let lat = unclusteredLats.splice(idx, 1)[0];
        let lon = unclusteredLons.splice(idx, 1)[0];

        centroidLats.push(lat);
        centroidLons.push(lon);
        clusterSizes.push(0);
    }

    for (let i = 0; i < unclusteredLats.length; i++) {
        let lat = unclusteredLats[i];
        let lon = unclusteredLons[i];

        let minDistance = Infinity;
        let cIdx = 0;
        for (let j = 0; j < centroidLats.length; j++) {
            let clat = centroidLats[j];
            let clon = centroidLons[j];

            let dist = euclideanDistance(clat, clon, lat, lon);
            if (dist < minDistance) {
                minDistance = dist;
                cIdx = j;
            }
        }

        clusterSizes[cIdx] += 1;
    }
    */

    let count = 0;
    let ccount = 0;
    let bcount = 0
    while (unclusteredLats.length > 0) {
        count += 1

        colat = parseFloat(unclusteredLats.pop());
        colon = parseFloat(unclusteredLons.pop());

        let clusterLats = [colat];
        let clusterLons = [colon];

        let tovisitLats = [colat];
        let tovisitLons = [colon];

        while (tovisitLats.length > 0) {
            ccount += 1;
            let olat = tovisitLats.pop();
            let olon = tovisitLons.pop();

            let toRemove = [];

            for (let i = 0; i < unclusteredLats.length; i++) {
                let lat = parseFloat(unclusteredLats[i]);
                let lon = parseFloat(unclusteredLons[i]);


                let dist = euclideanDistance(olat, olon, lat, lon);
                let odist = euclideanDistance(colat, colon, lat, lon);
                if (dist < minDist && odist < maxDist) {
                    clusterLats.push(lat);
                    clusterLons.push(lon);

                    tovisitLats.push(lat);
                    tovisitLons.push(lon);

                    toRemove.push(i);
                }
            }

            toRemove.sort();
            toRemove.reverse();
            toRemove.forEach( (i) => {
                unclusteredLats.splice(i, 1);
                unclusteredLons.splice(i, 1);
            });
        }

        if (clusterLats.length > minSize) {
            bcount += 1;
            let sumLats = 0;
            let sumLons = 0;
            for (let i = 0; i < clusterLats.length; i++) {
                let lat = clusterLats[i];
                let lon = clusterLons[i];

                sumLats += lat;
                sumLons += lon;
            }

            let centroidLat = sumLats / clusterLats.length;
            let centroidLon = sumLons / clusterLats.length;

            centroidLats.push(centroidLat);
            centroidLons.push(centroidLon);
            clusterSizes.push(clusterLats.length);
        }

    }

    console.log("COUNT", bcount, count, ccount);

    return [centroidLats, centroidLons, clusterSizes];
};


// VIEW

const viewDetail = (ico) => {
    console.log("ICO", ico);
    let subjekt = subjekty[ico];
    console.log(subjekt);
    let detailElem = document.getElementById("detail");
    let detailInfoElem = document.getElementById("detail-info");
    let content = "";

    subjekt.zarizeni.forEach((zarizeni) => {
        content += `<b>${zarizeni.nazev}</b> <br>`;

        console.log(zarizeni);
        if (zarizeni.obory.length > 0) {
            content += "Obory:<br><ul>";
            zarizeni.obory.forEach((obor) => {
                content += `<li>${obor.nazev} - ${formaVzdelani[obor.forma]} forma (${parseInt(obor.delka[0], 16)}.${obor.delka[1]} roku)</li>`;
            });
            content += "</ul>";
        }
    });
    detailInfoElem.innerHTML = content;
    detailElem.style.display = "block";
}

const closeDetail = () => {
    let detailElem = document.getElementById("detail");
    detailElem.style.display = "none";
}

const fillMap = (idsMista, isReditelstvi) => {
    const clusterMinSize = 2;
    const clusterMinDist = 0.075;
    const clusterMaxDist = 0.125;
    console.log("Current count", idsMista.length);

    if (idsMista.length > 200) {
        let lats = [];
        let lons = [];
        idsMista.forEach((idMista) => {
            let geo;
            if (isReditelstvi) {
                geo = reditelstviLoc[idMista];
            } else {
                geo = mistaLoc[idMista];
            }

            if (geo !== undefined) {
                let lat = geo.lat;
                let lon = geo.lon;

                lats.push(lat);
                lons.push(lon);
            }
        });


        let [cLats, cLons, cSizes] = [null, null, null];
        if (gCLats === null) {
            console.log("Computing...");
            [cLats, cLons, cSizes] = clusterPoints(lats, lons,
                clusterMinDist, clusterMaxDist, clusterMinSize);
            console.log("DONE");

            gCLats = cLats;
            gCLons = cLons;
            gCSizes = cSizes;
        } else {
            cLats = gCLats;
            cLons = gCLons;
            cSizes = gCSizes;
        }

        console.log("clusters", cLats.length);

        for (let i = 0; i < cLats.length; i++) {
            let lat = cLats[i];
            let lon = cLons[i];
            let size = cSizes[i];
            L.marker([lat, lon], {
                icon: new L.DivIcon({
                    html: `<span style='font-size: 16px; font-weight: bold; color: red;'>${size}</span>`,
                })
            }).addTo(map);
        }
    } else {
        let locMarkers = {};
        idsMista.forEach((idMista) => {
            let geo;
            if (isReditelstvi) {
                geo = reditelstviLoc[idMista];
            } else {
                geo = mistaLoc[idMista];
            }
            if (geo !== undefined) {
                let lat = geo.lat;
                let lon = geo.lon;
                if (isReditelstvi) {
                    let ico = idMista;
                    let obj = subjekty[ico];
                    let content = `
                        ${obj.ico}<br>
                        ${obj.nazev} <br>
                        ${obj.reditelstvi.adr1} <br>
                        ${obj.reditelstvi.adr2} <br>
                        ${obj.reditelstvi.adr3} <br>
                        <a onclick="viewDetail('${obj.ico}');" style="cursor: pointer";>Detail</a>
                        <hr>
                        `;
                    if ([lat, lon] in locMarkers) {
                        let marker = locMarkers[[lat, lon]];
                        let popup = marker.getPopup();

                        popup.setContent(popup.getContent() + content);
                    } else {
                        let marker = L.marker([lat, lon]).addTo(map);
                        let obj = subjekty[ico];

                        marker.bindPopup(content);
                        locMarkers[[lat, lon]] = marker;
                    }
                } else {
                    let ico = mistaIco[idMista];
                    let obj = subjekty[ico];
                    let content;
                    obj.zarizeni.forEach((zarizeni) => {
                        zarizeni.mista.forEach((misto) => {
                            if (misto["id_mista"] == idMista) {
                                content = `
                                                ${obj.ico}<br>
                                                ${obj.nazev} <br>
                                                ${idMista} <br>
                                                ${misto.druh} <br>
                                                <hr>
                                                `;
                            }
                        });
                    });
                    if ([lat, lon] in locMarkers) {
                        let marker = locMarkers[[lat, lon]];
                        let popup = marker.getPopup();

                        popup.setContent(popup.getContent() + content);
                    } else {
                        let marker = L.marker([lat, lon]).addTo(map);

                        marker.bindPopup(content);
                        locMarkers[[lat, lon]] = marker;
                    }
                }
            }
        });
        Object.values(locMarkers).forEach((marker) => {
            let popup = marker.getPopup();
            popup.setContent("<div style='max-height: 30em; overflow-y: scroll;'>" + popup.getContent() + "<div>");
        });
    }

}

const fillView = () => {
    const bounds = map.getBounds();

    const swlat = bounds._southWest.lat;
    const swlon = bounds._southWest.lng;
    const nelat = bounds._northEast.lat;
    const nelon = bounds._northEast.lng;


    if (viewTyp == "mista") {
        let viewIdsMista = [];
        Object.keys(mistaLoc).forEach((idMista) => {
            let geo = mistaLoc[idMista];
            let lat = geo.lat;
            let lon = geo.lon;

            if (lat < nelat && lat > swlat &&
                lon < nelon && lon > swlon) {
                viewIdsMista.push(idMista);
            }
        });
        if (filterDruh.length > 0 || filterKraj.length > 0 || filterOkres.length > 0) {
            let filters = {
                "druhy": filterDruh,
                "kraje": filterKraj,
                "okresy": filterOkres,
                "idsMista": viewIdsMista,

            }
            let toView = filterMista(filters);
            clearMarkers();
            fillMap(toView, false);
        } else {
            clearMarkers();
            fillMap(viewIdsMista, false);
        }
    } else if (viewTyp == "reditelstvi") {
        let viewIdsMista = [];
        Object.keys(reditelstviLoc).forEach((idMista) => {
            let geo = reditelstviLoc[idMista];
            let lat = geo.lat;
            let lon = geo.lon;

            if (lat < nelat && lat > swlat &&
                lon < nelon && lon > swlon) {
                viewIdsMista.push(idMista);
            }
        });
        if (filterDruh.length > 0 || filterKraj.length > 0 || filterOkres.length > 0) {
            let filters = {
                "druhy": filterDruh,
                "kraje": filterKraj,
                "okresy": filterOkres,
                "icos": viewIdsMista,

            }
            let toView = filterReditelstvi(filters);
            clearMarkers();
            fillMap(toView, true);
        } else {
            clearMarkers();
            fillMap(viewIdsMista, true);
        }
    }
}


// FILTERING

const filterMista = (filters) => {

    let idsMista = filters.idsMista;
    let druhy = filters.druhy;
    let kraje = filters.kraje;
    let okresy = filters.okresy;

    if (druhy.length > 0) {
        let toRemove = [];

        idsMista.forEach((idMista) => {
            let ico = mistaIco[idMista];
            let subjekt = subjekty[ico];
            if (subjekt !== undefined || subjekt != null) {

                for (let i = 0; i < subjekt.zarizeni.length; i++) {
                    let zarizeni = subjekt.zarizeni[i];

                    if (!druhy.includes(zarizeni.druh)) {
                        zarizeni.mista.forEach((misto) => {
                            toRemove.push(misto.id_mista);
                        });
                    }
                }
            }
        });

        idsMista = idsMista.filter(item => !toRemove.includes(item));
    }

    if (kraje.length > 0) {
        let toRemove = [];

        idsMista.forEach((idMista) => {
            let ico = mistaIco[idMista];
            let subjekt = subjekty[ico];
            if (subjekt !== undefined || subjekt != null) {

                let reditelstvi = subjekt.reditelstvi;
                let okres = reditelstvi.okres;
                let kraj = okres.slice(0, 5);

                if (!kraje.includes(kraj)) {
                    toRemove.push(idMista);
                }
            }
        });

        idsMista = idsMista.filter(item => !toRemove.includes(item));
    }

    if (okresy.length > 0) {
        let toRemove = [];

        idsMista.forEach((idMista) => {
            let ico = mistaIco[idMista];
            let subjekt = subjekty[ico];
            if (subjekt !== undefined || subjekt != null) {

                let reditelstvi = subjekt.reditelstvi;
                let okres = reditelstvi.okres;

                if (!okresy.includes(okres)) {
                    toRemove.push(idMista);
                }
            }
        });

        idsMista = idsMista.filter(item => !toRemove.includes(item));
    }


    return idsMista;
}

const filterReditelstvi = (filters) => {

    let icos = filters.icos;
    let druhy = filters.druhy;
    let kraje = filters.kraje;
    let okresy = filters.okresy;

    if (druhy.length > 0) {
        let toRemove = [];

        icos.forEach((ico) => {
            let subjekt = subjekty[ico];
            if (subjekt !== undefined || subjekt != null) {

                let found = false;
                for (let i = 0; i < subjekt.zarizeni.length; i++) {
                    let zarizeni = subjekt.zarizeni[i];
                    if (druhy.includes(zarizeni.druh)) {
                        found = true;
                        break
                    }
                }

                if (!found) {
                    toRemove.push(ico);
                }
            }
        });

        icos = icos.filter(item => !toRemove.includes(item));
    }

    if (kraje.length > 0) {
        let toRemove = [];

        icos.forEach((ico) => {
            let subjekt = subjekty[ico];
            if (subjekt !== undefined || subjekt != null) {

                let reditelstvi = subjekt.reditelstvi;
                let okres = reditelstvi.okres;
                let kraj = okres.slice(0, 5);

                if (!kraje.includes(kraj)) {
                    toRemove.push(ico);
                }
            }
        });

        icos = icos.filter(item => !toRemove.includes(item));
    }

    if (okresy.length > 0) {
        let toRemove = [];

        icos.forEach((ico) => {
            let subjekt = subjekty[ico];
            if (subjekt !== undefined || subjekt != null) {

                let reditelstvi = subjekt.reditelstvi;
                let okres = reditelstvi.okres;

                if (!okresy.includes(okres)) {
                    toRemove.push(ico);
                }
            }
        });

        icos = icos.filter(item => !toRemove.includes(item));
    }


    return icos;
}

const filterByDruh = (el) => {
    let druh = el.value;
    if (el.checked) { // Add
        filterDruh.push(druh);
    } else { // Remove
        filterDruh = filterDruh.filter((x) => x != druh);
    }
    fillView();
};

const filterByKraj = (el) => {
    let kraj = el.value;
    if (el.checked) { // Add
        filterKraj.push(kraj);
    } else { // Remove
        filterKraj = filterKraj.filter((x) => x != kraj);
    }
    fillView();
};

const filterByOkres = (el) => {
    let okres = el.value;
    if (el.checked) { // Add
        filterOkres.push(okres);
    } else { // Remove
        filterOkres = filterOkres.filter((x) => x != okres);
    }
    fillView();
};

const setViewTyp = (el) => {
    let typ = el.value;
    if (typ != viewTyp) {
        viewTyp = typ;
        fillView();
    }
}

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
