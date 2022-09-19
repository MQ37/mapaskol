from flask import Flask, request
from flask import render_template
import json
import os

#### Load data ####
def read_json(filepath):
    if os.path.exists(filepath):
        try:
            with open(filepath, "r") as f:
                obj = json.load(f)
            return obj
        except Exception as e:
            print("Error reading file %s - %s" % (filepath, e))

    return None

obj_info = read_json( os.path.join("data", "skoly.json") )
obj_geo_loc = read_json( os.path.join("data", "geo_loc.json") )

#### Flask ####
app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/geo/all")
def api_geo_all():
    return obj_geo_loc

@app.route("/api/info/all")
def api_info_all():
    return obj_info


if __name__ == "__main__":
    app.run(debug=True)