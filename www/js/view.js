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
    const clusterMinSize = 0;
    let modifier = (8/map.getZoom()) ** 6;
    let clusterMaxDist = 0.125 * modifier;
    let clusterWalkMinDist = 0.15 * modifier;
    console.log("Current count", idsMista.length);

    let limit = viewTyp == "reditelstvi" ? 50 : 100;

    let grouped = groupByLoc(idsMista, isReditelstvi);
    let groupedCount = Object.keys(grouped).length;
    console.log("Current grouped count", groupedCount);
    if (groupedCount > limit) {
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


        console.log("Computing...");
        [cLats, cLons, cSizes] = clusterPoints(lats, lons,
            clusterWalkMinDist, clusterMaxDist, clusterMinSize);
        console.log("DONE");


        console.log("clusters", cLats.length);

        let maxSize = Math.max(...cSizes);
        const minIconSize = 32;
        const maxIconSize = 64;


        for (let i = 0; i < cLats.length; i++) {
            let lat = cLats[i];
            let lon = cLons[i];
            let size = cSizes[i];
            let marker = L.marker([lat, lon], {
                icon: new L.DivIcon({
                    className: "cluster-icon",
                    html: `<span style='font-size: 16px; font-weight: bold; color: black;'>${size}</span>`,
                })
            }).addTo(map);
            let pxsize = minIconSize + maxIconSize*size/maxSize;
            marker._icon.style.height = `${pxsize}px`;
            marker._icon.style.width = `${pxsize}px`;
            marker._icon.style.left = `-${pxsize/4}px`;
            marker._icon.style.top = `-${pxsize/4}px`;
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

