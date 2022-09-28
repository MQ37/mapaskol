from flask import Flask, request
from flask import render_template
from flask import send_from_directory
from data import SUBJEKTY, MISTA_LOC, REDITELSTVI_LOC


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

@app.route("/api/info/reditelstvi/<ico>")
def api_info_reditelstvi(ico):
    return SUBJEKTY.get(ico, {})

if __name__ == "__main__":
    app.run(debug=True)
