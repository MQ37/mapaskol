// CLUSTERING

const clusterPoints = (lats, lons, maxDist, minSize) => {
    let centroidLats = [];
    let centroidLons = [];
    let clusterSizes = [];

    let unclusteredLats = lats
    let unclusteredLons = lons;

    let pcount = 0;
    let ccount = 0;

    while (unclusteredLats.length > 0) {
        colat = parseFloat(unclusteredLats.pop());
        colon = parseFloat(unclusteredLons.pop());

        let clusterLats = [colat];
        let clusterLons = [colon];


        let toRemove = [];

        for (let i = 0; i < unclusteredLats.length; i++) {
            let lat = parseFloat(unclusteredLats[i]);
            let lon = parseFloat(unclusteredLons[i]);


            let odist = euclideanDistance(colat, colon, lat, lon);
            if (odist < maxDist) {
                clusterLats.push(lat);
                clusterLons.push(lon);

                toRemove.push(i);
            }
        }

        toRemove.reverse();
        toRemove.forEach( (i) => {
            unclusteredLats.splice(i, 1);
            unclusteredLons.splice(i, 1);
        });

        pcount += 1;
        if (clusterLats.length > minSize) {
            ccount += 1;
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

    console.log("CLUSTER COUNT", pcount, ccount);

    return [centroidLats, centroidLons, clusterSizes];
};

