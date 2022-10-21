// CLUSTERING

const clusterPoints = (lats, lons, walkMinDist, maxDist, minSize) => {
    let centroidLats = [];
    let centroidLons = [];
    let clusterSizes = [];

    let unclusteredLats = lats
    let unclusteredLons = lons;

    let pcount = 0;
    let ccount = 0;

    // Initial clusters
    while (unclusteredLats.length > 0) {
        colat = parseFloat(unclusteredLats.pop());
        colon = parseFloat(unclusteredLons.pop());

        let clusterLats = [colat];
        let clusterLons = [colon];


        let toRemove = [];

        for (let i = 0; i < unclusteredLats.length; i++) {
            let lat = parseFloat(unclusteredLats[i]);
            let lon = parseFloat(unclusteredLons[i]);


            let dist = euclideanDistance(colat, colon, lat, lon);
            if (dist < maxDist) {
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

    console.log("BEFORE WALK", centroidLats.length);

    // Walk and merge clusters
    let wCLa = [];
    let wCLo = []
    let wCS = [];

    while (centroidLats.length > 0) {

        let cLa = centroidLats.pop();
        let cLo = centroidLons.pop();
        let cS = clusterSizes.pop();

        let cCLa = [cLa];
        let cCLo = [cLo];
        let cCS = [cS];

        let tovisitLats = [cLa];
        let tovisitLons = [cLo];

        while (tovisitLats.length > 0) {
            let oLat = tovisitLats.pop();
            let oLon = tovisitLons.pop();

            let toRemove = [];

            for (let i = 0; i < centroidLats.length; i++) {
                let lat = centroidLats[i];
                let lon = centroidLons[i];

                let dist = euclideanDistance(oLat, oLon, lat, lon);
                if (dist < walkMinDist) {
                    let size = clusterSizes[i];
                    cCLa.push(lat);
                    cCLo.push(lon);
                    cCS.push(size);

                    tovisitLats.push(lat);
                    tovisitLons.push(lon);

                    toRemove.push(i);
                }
            }

            toRemove.reverse();
            toRemove.forEach( (i) => {
                centroidLats.splice(i, 1);
                centroidLons.splice(i, 1);
                clusterSizes.splice(i, 1);
            });

        }

        let sumLats = 0;
        let sumLons = 0;
        let ceSize = 0;
        for (let i = 0; i < cCLa.length; i++) {
            let lat = cCLa[i];
            let lon = cCLo[i];
            let size = cCS[i];

            sumLats += lat;
            sumLons += lon;
            ceSize += size;
        }

        let ceLat = sumLats / cCLa.length;
        let ceLon = sumLons / cCLa.length;

        wCLa.push(ceLat);
        wCLo.push(ceLon);
        wCS.push(ceSize);

    }

    console.log("AFTER WALK", wCLa.length);
    console.log("wcla", wCLa);
    console.log("wclo", wCLa);
    console.log("wcs", wCS);

    //return [centroidLats, centroidLons, clusterSizes];
    return [wCLa, wCLo, wCS];
};

