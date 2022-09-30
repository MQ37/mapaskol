from flask import Flask, request
from flask import render_template
from flask import send_from_directory
from data import SUBJEKTY, MISTA_LOC, REDITELSTVI_LOC, MISTA_ICO


#### Flask ####
app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route('/static/<path:path>')
def send_report(path):
    return send_from_directory('static', path)

@app.route("/api/geo/mista")
def api_geo_mista():
    return MISTA_LOC

@app.route("/api/geo/reditelstvi")
def api_geo_reditelstvi():
    return REDITELSTVI_LOC

@app.route("/api/geo/reditelstvi/filter", methods=["POST"])
def api_geo_reditelstvi_filter():
    json = request.get_json()

    icos = json.get("icos", [])
    druhy = json.get("druhy")
    kraje = json.get("kraje")
    okresy = json.get("okresy")

    if druhy:
        to_remove = []
        for ico in icos:
            subjekt = SUBJEKTY.get(ico, {})
            found = False
            for zarizeni in subjekt.get("zarizeni", []):
                if zarizeni["druh"] in druhy:
                    found = True
            if not found:
                to_remove.append(ico)
        for ico in to_remove:
            icos.remove(ico)

    if kraje:
        to_remove = []
        for ico in icos:
            subjekt = SUBJEKTY.get(ico, {})
            reditelstvi = subjekt["reditelstvi"]
            okres = reditelstvi["okres"]
            kraj = okres[:5]
            if kraj not in kraje:
                to_remove.append(ico)
        for ico in to_remove:
            icos.remove(ico)

    if okresy:
        to_remove = []
        for ico in icos:
            subjekt = SUBJEKTY.get(ico, {})
            reditelstvi = subjekt["reditelstvi"]
            okres = reditelstvi["okres"]
            if okres not in okresy:
                to_remove.append(ico)
        for ico in to_remove:
            icos.remove(ico)

    return icos

@app.route("/api/geo/mista/filter", methods=["POST"])
def api_geo_mista_filter():
    json = request.get_json()

    ids_mista = json.get("idsMista", [])
    druhy = json.get("druhy")
    kraje = json.get("kraje")
    okresy = json.get("okresy")

    if druhy:
        to_remove = []
        for id_mista in ids_mista:
            ico = MISTA_ICO[id_mista]
            subjekt = SUBJEKTY.get(ico, {})
            found = False
            for zarizeni in subjekt.get("zarizeni", []):
                for misto in zarizeni.get("mista", []):
                    if misto["id_mista"] == id_mista:
                        if zarizeni["druh"] not in druhy:
                            to_remove.append(id_mista)
                            found = True
                            break
                if found:
                    break
        for id_mista in to_remove:
            ids_mista.remove(id_mista)

    if kraje:
        to_remove = []
        for id_mista in ids_mista:
            ico = MISTA_ICO[id_mista]
            subjekt = SUBJEKTY.get(ico, {})
            reditelstvi = subjekt["reditelstvi"]
            okres = reditelstvi["okres"]
            kraj = okres[:5]
            if kraj not in kraje:
                to_remove.append(id_mista)
        for id_mista in to_remove:
            ids_mista.remove(id_mista)

    if okresy:
        to_remove = []
        for id_mista in ids_mista:
            ico = MISTA_ICO[id_mista]
            subjekt = SUBJEKTY.get(ico, {})
            reditelstvi = subjekt["reditelstvi"]
            okres = reditelstvi["okres"]
            if okres not in okresy:
                to_remove.append(id_mista)
        for id_mista in to_remove:
            ids_mista.remove(id_mista)

    return ids_mista

@app.route("/api/info/reditelstvi/<ico>")
def api_info_reditelstvi(ico):
    return SUBJEKTY.get(ico, {})

@app.route("/api/info/mista/<id_mista>")
def api_info_misto(id_mista):
    ico = MISTA_ICO[id_mista]
    return SUBJEKTY.get(ico, {})

if __name__ == "__main__":
    app.run(debug=True)
