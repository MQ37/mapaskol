from flask import Flask, request
from flask import render_template
from flask import send_from_directory
from data import SUBJEKTY, MISTA_LOC, MISTA_ICO, LOC_MISTA, REDITELSTVI_LOC


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

@app.route("/api/geo/view/<int:swlat>/<int:swlon>/<int:nelat>/<int:nelon>")
def api_geo_view(swlat, swlon, nelat, nelon):
    return "%s %s %s %s" % (swlat, swlon, nelat, nelon)

@app.route("/api/info/all")
def api_info_all():
    return SUBJEKTY

@app.route("/api/mapping/mistaico")
def api_mapping_mistaico():
    return MISTA_ICO

@app.route("/api/mapping/locmista")
def api_mapping_locmista():
    return LOC_MISTA


if __name__ == "__main__":
    app.run(debug=True)
