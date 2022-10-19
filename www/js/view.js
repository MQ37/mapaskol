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
    const clusterMaxDist = 0.125;
    console.log("Current count", idsMista.length);

    let limit = viewTyp == "reditelstvi" ? 200: 400;
    if (idsMista.length > limit) {
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

        let gCLats = viewTyp == "reditelstvi" ? gRCLats : gMCLats;

        if (gCLats === null) {
            console.log("Computing...");
            [cLats, cLons, cSizes] = clusterPoints(lats, lons,
                clusterMaxDist, clusterMinSize);
            console.log("DONE");

            if (viewTyp == "reditelstvi") {
                gRCLats = cLats;
                gRCLons = cLons;
                gRCSizes = cSizes;
            } else {
                gMCLats = cLats;
                gMCLons = cLons;
                gMCSizes = cSizes;
            }
        } else {
            if (viewTyp == "reditelstvi") {
                cLats = gRCLats;
                cLons = gRCLons;
                cSizes = gRCSizes;
            } else {
                cLats = gMCLats;
                cLons = gMCLons;
                cSizes = gMCSizes;
            }
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

