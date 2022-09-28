var map = L.map('map');
//var subjekty;
var reditelstviLoc;
var mistaLoc;
var filterDruh = [];

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
    //let subjektyResp = callAPI("/api/info/all");
    let reditelstviLocResp = callAPI("/api/geo/reditelstvi");
    let mistaLocResp = callAPI("/api/geo/mista");
    let promise = new Promise((resolve) => {
        //subjektyResp.then( (obj) => {
        //    subjekty = obj;
            reditelstviLocResp.then( (obj) => {
                reditelstviLoc = obj;
                mistaLocResp.then( (obj) => {
                    mistaLoc = obj;


                    resolve("done");
                });
            });
        //});
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
    const clusterSize = 30;
    let promise = new Promise( (resolve) => {
        if (filterDruh.length > 0) {
            callAPIJson("/api/geo/reditelstvi/filter",
            {
                "druhy": filterDruh,
                "icos": idsMista,

            }).then( (obj) => {
                idsMista = obj;
                resolve("done");
            });
        } else {
            resolve("done");
        }
    });
    promise.then( (ret) => {
        console.log("Current count", idsMista.length);

        if (idsMista.length > 200) {
            let lats = [];
            let lons = [];
            idsMista.forEach( (idMista) => {
                let geo = reditelstviLoc[idMista];
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
            idsMista.forEach( (idMista) => {
                let geo = reditelstviLoc[idMista];
                if (geo !== undefined) {
                    let lat = geo.lat;
                    let lon = geo.lon;
                    let marker = L.marker([lat, lon]).addTo(map);
                    let ico = idMista;
                    callAPI(`/api/info/reditelstvi/${ico}`).then(
                        (obj) => {
                            marker.bindPopup(`
                            ${obj.ico}<br>
                            ${obj.nazev} <br>
                            <hr>
                            `);
                        });
                }
            });
        }

    });
}

const fillView = () => {
    const bounds = map.getBounds();

    const swlat = bounds._southWest.lat;
    const swlon = bounds._southWest.lng;
    const nelat = bounds._northEast.lat;
    const nelon = bounds._northEast.lng;

    let viewIdsMista = [];
    Object.keys(reditelstviLoc).forEach( (idMista) => {
        let misto = reditelstviLoc[idMista];
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
    fillMap( Object.keys(reditelstviLoc) );
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
