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
    if (el.checked) { // Add
        filterDruh.push(druh);
    } else { // Remove
        filterDruh = filterDruh.filter((x) => x != druh);
    }
    fillView();
};

const filterByKraj = (el) => {
    let kraj = el.value;
    if (el.checked) { // Add
        filterKraj.push(kraj);
    } else { // Remove
        filterKraj = filterKraj.filter((x) => x != kraj);
    }
    fillView();
};

const filterByOkres = (el) => {
    let okres = el.value;
    if (el.checked) { // Add
        filterOkres.push(okres);
    } else { // Remove
        filterOkres = filterOkres.filter((x) => x != okres);
    }
    fillView();
};

const setViewTyp = (el) => {
    let typ = el.value;
    if (typ != viewTyp) {
        viewTyp = typ;
        fillView();
    }
}

