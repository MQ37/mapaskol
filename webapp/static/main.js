var map = L.map('map');
var reditelstviLoc;
var mistaLoc;
var mistaIco;

var viewTyp = "reditelstvi";
var filterDruh = [];
var filterKraj = [];

const callAPI = async (url) => {
    const response = await fetch(url);

    return await response.json(); 
};

const callAPIJson = async (url, json) => {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(json)
     });

    return await response.json();
}

const getData = () => {
    let reditelstviLocResp = callAPI("/api/geo/reditelstvi");
    let mistaLocResp = callAPI("/api/geo/mista");
    let promise = new Promise((resolve) => {
            reditelstviLocResp.then( (obj) => {
                reditelstviLoc = obj;
                mistaLocResp.then( (obj) => {
                    mistaLoc = obj;

                    resolve("done");
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
    return Math.sqrt( (lat1 - lat2)*(lat1-lat2) +
        (lon1-lon2)*(lon1-lon2) )
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
            distances.push( euclideanDistance(clat, clon, lat, lon) );
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


const fillMap = (idsMista, isReditelstvi) => {
    const clusterSize = 30;
    console.log("Current count", idsMista.length);

    if (idsMista.length > 200) {
        let lats = [];
        let lons = [];
        idsMista.forEach( (idMista) => {
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
        idsMista.forEach( (idMista) => {
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
                    if ([lat, lon] in locMarkers) {
                        let [marker, promise] = locMarkers[[lat, lon]];
                        promise.then( (ret) => {
                            let popup = marker.getPopup();

                            callAPI(`/api/info/reditelstvi/${ico}`).then(
                                (obj) => {
                                    popup.setContent(popup.getContent() + `
                                    ${obj.ico}<br>
                                    ${obj.nazev} <br>
                                    ${obj.reditelstvi.adr1} <br>
                                    ${obj.reditelstvi.adr2} <br>
                                    ${obj.reditelstvi.adr3} <br>
                                    <hr>
                                    `);
                            });
                        })
                    } else {
                        let marker = L.marker([lat, lon]).addTo(map);
                        let promise = new Promise( (resolve) => {
                            callAPI(`/api/info/reditelstvi/${ico}`).then(
                                (obj) => {
                                    marker.bindPopup(`
                                    ${obj.ico}<br>
                                    ${obj.nazev} <br>
                                    ${obj.reditelstvi.adr1} <br>
                                    ${obj.reditelstvi.adr2} <br>
                                    ${obj.reditelstvi.adr3} <br>
                                    <hr>
                                    `);
                                    resolve("done");
                            });
                        });
                        locMarkers[[lat, lon]] = [marker, promise];
                    }
                } else {
                    if ([lat, lon] in locMarkers) {
                        let [marker, promise] = locMarkers[[lat, lon]];
                        promise.then( (ret) => {
                            let popup = marker.getPopup();

                            callAPI(`/api/info/mista/${idMista}`).then(
                                (obj) => {
                                    obj.zarizeni.forEach( (zarizeni) => {
                                        zarizeni.mista.forEach( (misto) => {
                                            if (misto["id_mista"] == idMista) {

                                                popup.setContent(popup.getContent() + `
                                                ${obj.ico}<br>
                                                ${obj.nazev} <br>
                                                ${idMista} <br>
                                                ${misto.druh} <br>
                                                <hr>
                                                `);

                                            }
                                        });
                                    });
                            });
                        })
                    } else {
                        let marker = L.marker([lat, lon]).addTo(map);
                        let promise = new Promise( (resolve) => {
                            callAPI(`/api/info/mista/${idMista}`).then(
                                (obj) => {
                                    obj.zarizeni.forEach( (zarizeni) => {
                                        zarizeni.mista.forEach( (misto) => {
                                            if (misto["id_mista"] == idMista) {

                                                marker.bindPopup(`
                                                ${obj.ico}<br>
                                                ${obj.nazev} <br>
                                                ${idMista} <br>
                                                ${misto.druh} <br>
                                                <hr>
                                                `);
                                                resolve("done");

                                            }
                                        });
                                    });
                            });
                        });
                        locMarkers[[lat, lon]] = [marker, promise];
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


    if ( viewTyp == "mista" ) {
        let viewIdsMista = [];
        Object.keys(mistaLoc).forEach( (idMista) => {
            let geo = mistaLoc[idMista];
            let lat = geo.lat;
            let lon = geo.lon;

            if (lat < nelat && lat > swlat
                && lon < nelon && lon > swlon) {
                viewIdsMista.push(idMista);
            }
        });
        if (filterDruh.length > 0 || filterKraj.length > 0) {
            callAPIJson("/api/geo/mista/filter",
            {
                "druhy": filterDruh,
                "kraje": filterKraj,
                "idsMista": viewIdsMista,

            }).then( (obj) => {
                clearMarkers();
                // intersection
                fillMap(obj.filter( (x) => viewIdsMista.includes(x)), false);
            });
        } else {
            clearMarkers();
            fillMap(viewIdsMista, false);
        }
    } else if ( viewTyp == "reditelstvi" ) {
        let viewIdsMista = [];
        Object.keys(reditelstviLoc).forEach( (idMista) => {
            let geo = reditelstviLoc[idMista];
            let lat = geo.lat;
            let lon = geo.lon;

            if (lat < nelat && lat > swlat
                && lon < nelon && lon > swlon) {
                viewIdsMista.push(idMista);
            }
        });
        if (filterDruh.length > 0 || filterKraj.length > 0) {
            callAPIJson("/api/geo/reditelstvi/filter",
            {
                "druhy": filterDruh,
                "kraje": filterKraj,
                "icos": viewIdsMista,

            }).then( (obj) => {
                clearMarkers();
                // intersection
                fillMap(obj.filter( (x) => viewIdsMista.includes(x)), true);
            });
        } else {
            clearMarkers();
            fillMap(viewIdsMista, true);
        }
    }
}

const filterByDruh = (el) => {
    let druh = el.value;
    console.log(druh, el.checked);
    if (el.checked){ // Add
        filterDruh.push(druh);
    } else { // Remove
        filterDruh = filterDruh.filter( (x) => x != druh );
    }
    console.log(filterDruh);
    fillView();
};

const filterByKraj = (el) => {
    let kraj = el.value;
    console.log(kraj, el.checked);
    if (el.checked){ // Add
        filterKraj.push(kraj);
    } else { // Remove
        filterKraj = filterKraj.filter( (x) => x != kraj );
    }
    console.log(filterKraj);
    fillView();
};

const setViewTyp = (el) => {
    let typ = el.value;
    if (typ != viewTyp) {
        viewTyp = typ;
        fillView();
    }
}

const detailView = (ico) => {
    let subjekt = subjekty[ico];
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
    fillMap( Object.keys(reditelstviLoc), true );
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
    }, 200);
});
