// GLOBALS
var map = L.map('map');

// VIEW GLOBALS
var reditelstviLoc;
var mistaLoc;
var mistaIco = {};
var subjekty;

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

const clusterPoints = (lats, lons, n) => {
    let clustersLats = [];
    let clustersLons = [];

    let unclusteredLats = lats
    let unclusteredLons = lons;

    while (unclusteredLats.length > 0) {

        let clat = unclusteredLats.pop();
        let clon = unclusteredLons.pop();

        // If was last then lone cluster
        if (unclusteredLats.length <= 1) {
            clustersLats.push([clat]);
            clustersLons.push([clon]);
            break;
        }

        let distances = [];
        for (let i = 0; i < unclusteredLats.length; i++) {
            let lat = unclusteredLats[i];
            let lon = unclusteredLons[i];
            distances.push(euclideanDistance(clat, clon, lat, lon));
        }

        let clusterLats = [];
        let clusterLons = [];
        for (let i = 0; i < n; i++) {
            if (distances.length < 1)
                break;

            let min = Infinity;
            let minj = null;
            for (let j = 0; j < distances.length; j++) {
                let dist = distances[j];
                if (dist < min) {
                    min = dist;
                    minj = j;
                }
            }

            distances.splice(minj, 1);
            let lat = unclusteredLats.splice(minj, 1);
            let lon = unclusteredLons.splice(minj, 1);

            clusterLats.push(lat);
            clusterLons.push(lon);
        }

        let sumLats = 0;
        let sumLons = 0;
        for (let i = 0; i < clusterLats.length; i++) {
            let lat = clusterLats[i];
            let lon = clusterLons[i];

            sumLats += parseFloat(lat);
            sumLons += parseFloat(lon);
        }

        let centroidLat = sumLats / clusterLats.length;
        let centroidLon = sumLons / clusterLats.length;

        clustersLats.push(centroidLat);
        clustersLons.push(centroidLon);
    }
    return [clustersLats, clustersLons];
};

// VIEW

const viewDetail = (ico) => {
    let subjekt = subjekty[ico];
    console.log(subjekt);
    let detailElem = document.getElementById("detail");
    let detailInfoElem = document.getElementById("detail-info");
    detailInfoElem.innerHTML = `
        Detail: <br>
    `;

    subjekt.zarizeni.forEach((zarizeni) => {
        let content = `<b>${zarizeni.nazev}</b> <br>`;

        zarizeni.obory.forEach((obor) => {
            content += `${obor.nazev} <br>`;
        });


        detailInfoElem.innerHTML += content;
    });
    detailElem.style.display = "block";
}

const closeDetail = () => {
    let detailElem = document.getElementById("detail");
    detailElem.style.display = "none";
}

const fillMap = (idsMista, isReditelstvi) => {
    const clusterSize = 60;
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


        console.log(lats.length);
        let [cLats, cLons] = clusterPoints(lats, lons, clusterSize);
        console.log(cLats.length);

        for (let i = 0; i < cLats.length; i++) {
            let lat = cLats[i];
            let lon = cLons[i];
            L.marker([lat, lon], {
                icon: new L.DivIcon({
                    html: `<span style='font-size: 16px; font-weight: bold; color: red;'>${clusterSize}</span>`,
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
                        <a onclick="viewDetail(${obj.ico});" style="cursor: pointer";>Detail</a>
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
    console.log(druh, el.checked);
    if (el.checked) { // Add
        filterDruh.push(druh);
    } else { // Remove
        filterDruh = filterDruh.filter((x) => x != druh);
    }
    console.log(filterDruh);
    fillView();
};

const filterByKraj = (el) => {
    let kraj = el.value;
    console.log(kraj, el.checked);
    if (el.checked) { // Add
        filterKraj.push(kraj);
    } else { // Remove
        filterKraj = filterKraj.filter((x) => x != kraj);
    }
    console.log(filterKraj);
    fillView();
};

const filterByOkres = (el) => {
    let okres = el.value;
    console.log(okres, el.checked);
    if (el.checked) { // Add
        filterOkres.push(okres);
    } else { // Remove
        filterOkres = filterOkres.filter((x) => x != okres);
    }
    console.log(filterOkres);
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
        console.log(map.getBounds());
        console.log(map.getZoom());
        fillView();
    }, 500);
});