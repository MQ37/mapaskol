var map = L.map('map');
var subjekty;
var mistaLoc;
var mistaIco = {};

const callAPI = async (url) => {
    const response = await fetch(url);
    const data = await response.json(); 

    return data;
};

const getData = () => {
    let infoJsonResp = callAPI("/api/info/all");
    let geoJsonResp = callAPI("/api/geo/all");
    let promise = new Promise((resolve) => {
        infoJsonResp.then( (obj) => {
            subjekty = obj;
            geoJsonResp.then( (obj) => {
                mistaLoc = obj;

                Object.keys(subjekty).forEach( (ico) => {
                    let obj = subjekty[ico];

                    obj["zarizeni"].forEach( (zarizeni) => {
                        zarizeni["mista"].forEach( (misto) => {
                            let idMista = misto["id_mista"];
                            mistaIco[idMista] = ico;
                        });
                    });

                });


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
        if (unclusteredLats.length < 2) {
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


const fillMap = (idsMista) => {
    /*
    Object.keys(subjekty).forEach( (ico) => {
        // Subjekt
        let obj = subjekty[ico];

        obj["zarizeni"].forEach( (zarizeni) => {
            zarizeni["mista"].forEach( (misto) => {
                let idMista = misto["id_mista"];
                let geo = mistaLoc[idMista];
                if (geo !== undefined) {
                    let lat = geo.lat;
                    let lon = geo.lon;

                    lats.push(lat);
                    lons.push(lon);
                }
            });
        });
    });
    */
    if (idsMista.length > 200) {
        let lats = [];
        let lons = [];
        idsMista.forEach( (idMista) => {
            let geo = mistaLoc[idMista];
            if (geo !== undefined) {
                let lat = geo.lat;
                let lon = geo.lon;

                lats.push(lat);
                lons.push(lon);
            }
        });


        console.log(lats.length);
        let [cLats, cLons] = clusterPoints(lats, lons, 30);
        console.log(cLats.length);

        for (let i = 0; i < cLats.length; i++) {
            let lat = cLats[i];
            let lon = cLons[i];
            L.marker([lat, lon]).addTo(map);
        }
    } else {
        idsMista.forEach( (idMista) => {
            /*
            let geo = mistaLoc[idMista];
            if (geo === undefined) {
                return;
            }
            let lat = geo.lat;
            let lon = geo.lon;
            */

            let ico = mistaIco[idMista];
            if (ico === undefined) {
                return;
            }
            let info = subjekty[ico];
            let subjektMista = {};

            info["zarizeni"].forEach( (zarizeni) => {
                zarizeni["mista"].forEach( (misto) => {
                    let zarIdMista = misto["id_mista"];
                    let geo = mistaLoc[zarIdMista];
                    if (geo !== undefined) {
                        let lat = geo.lat;
                        let lon = geo.lon;
                        if ([lat, lon] in subjektMista) {
                            subjektMista[[lat, lon]].push(`
                            ${info.nazev} (${info.ico})<br>
                            ${zarizeni.nazev} (${zarizeni.izo})<br>
                            ${misto.adr1}, ${misto.adr2}, ${misto.adr3} (${zarIdMista})
                            `);
                        } else {
                            subjektMista[[lat, lon]] = [`
                            ${info.nazev} (${info.ico})<br>
                            ${zarizeni.nazev} (${zarizeni.izo})<br>
                            ${misto.druh} | ${misto.adr1}, ${misto.adr2}, ${misto.adr3} (${zarIdMista})
                            `];
                        }
                    }
                });
            });

            Object.keys(subjektMista).forEach( (lat_lon) => {
                let [lat, lon] = lat_lon.split(",");
                let info = subjektMista[lat_lon];
                L.marker([lat, lon]).addTo(map).bindPopup(info.join("<hr>"));
            });
        });
    }

    /*
    Object.keys(obj_info).forEach( (key) => {
        // Subjekt
        let info = obj_info[key];
        let subjekt_mista = {};

        info["zarizeni"].forEach( (zarizeni) => {
            zarizeni["mista"].forEach( (misto) => {
                let id_mista = misto["id_mista"];
                let geo = obj_geo[id_mista];
                if (geo !== undefined) {
                    let lat = geo.lat;
                    let lon = geo.lon;
                    if ([lat, lon] in subjekt_mista) {
                        subjekt_mista[[lat, lon]].push(`
                        ${info.nazev} (${info.ico})<br>
                        ${zarizeni.nazev} (${zarizeni.izo})<br>
                        ${misto.adr1}, ${misto.adr2}, ${misto.adr3} (${id_mista})
                        `);
                    } else {
                        subjekt_mista[[lat, lon]] = [`
                        ${info.nazev} (${info.ico})<br>
                        ${zarizeni.nazev} (${zarizeni.izo})<br>
                        ${misto.druh} | ${misto.adr1}, ${misto.adr2}, ${misto.adr3} (${id_mista})
                        `];
                    }
                }
            });
        });

        Object.keys(subjekt_mista).forEach( (lat_lon) => {
            let [lat, lon] = lat_lon.split(",");
            let info = subjekt_mista[lat_lon];
            L.marker([lat, lon]).addTo(map).bindPopup(info.join("<hr>"));
        });
    });
    */
}

const fillView = () => {
    const bounds = map.getBounds();

    const swlat = bounds._southWest.lat;
    const swlon = bounds._southWest.lng;
    const nelat = bounds._northEast.lat;
    const nelon = bounds._northEast.lng;

    let viewIdsMista = [];
    Object.keys(mistaLoc).forEach( (idMista) => {
        let misto = mistaLoc[idMista];
        let lat = misto.lat;
        let lon = misto.lon;

        if (lat < nelat && lat > swlat
            && lon < nelon && lon > swlon) {
            viewIdsMista.push(idMista);
        }
    });

    console.log(viewIdsMista);
    clearMarkers();
    fillMap(viewIdsMista);
}

// INIT

// Set view add tileLayer
map.setView([50.0773301, 14.4269236], 8);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

getData().then((ret) => {
    fillMap( Object.keys(mistaLoc) );
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
        //clearMarkers();
    }, 200);
});
