var map = L.map('map');
var subjekty;
var reditelstviLoc;

const callAPI = async (url) => {
    const response = await fetch(url);
    const data = await response.json(); 

    return data;
};

const getData = () => {
    let infoJsonResp = callAPI("/api/info/all");
    let geoJsonResp = callAPI("/api/geo/reditelstvi");
    let promise = new Promise((resolve) => {
        infoJsonResp.then( (obj) => {
            subjekty = obj;
            geoJsonResp.then( (obj) => {
                reditelstviLoc = obj;

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
        let [cLats, cLons] = clusterPoints(lats, lons, 30);
        console.log(cLats.length);

        for (let i = 0; i < cLats.length; i++) {
            let lat = cLats[i];
            let lon = cLons[i];
            L.marker([lat, lon]).addTo(map);
        }
    } else {
        idsMista.forEach( (idMista) => {
            let geo = reditelstviLoc[idMista];
            if (geo !== undefined) {
                let lat = geo.lat;
                let lon = geo.lon;
                let subjekt = subjekty[idMista];
                L.marker([lat, lon]).addTo(map).bindPopup(`
                ${subjekt.nazev} (${subjekt.ico})<br>
                ${subjekt.reditelstvi.nazev}
                `);
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

// INIT

// Set view add tileLayer
map.setView([50.0773301, 14.4269236], 8);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

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
