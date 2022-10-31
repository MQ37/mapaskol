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


const groupByLoc = (idsMista, isReditelstvi) => {
    let locs = {};

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

            if ([lat, lon] in locs) {
                locs[[lat, lon]].push(idMista);
            } else {
                locs[[lat, lon]] = [idMista];
            }
        }
    });

    return locs;
};
