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
    icos = []

    json = request.get_json()
    druhy = json.get("druhy")
    if druhy:
        for ico in json.get("icos", []):
            subjekt = SUBJEKTY.get(ico, {})
            for zarizeni in subjekt.get("zarizeni", []):
                if zarizeni["druh"] in druhy:
                    icos.append(ico)

    return icos

@app.route("/api/geo/mista/filter", methods=["POST"])
def api_geo_mista_filter():
    ids_mista = []

    json = request.get_json()
    druhy = json.get("druhy")
    view_ids_mista = json.get("idsMista", [])
    if druhy:
        for id_mista in view_ids_mista:
            ico = MISTA_ICO[id_mista]
            subjekt = SUBJEKTY.get(ico, {})
            for zarizeni in subjekt.get("zarizeni", []):
                if zarizeni["druh"] in druhy:
                    for misto in zarizeni.get("mista", []):
                        if misto["id_mista"] in view_ids_mista and \
                            misto["id_mista"] not in ids_mista:
                            ids_mista.append(misto["id_mista"])

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
