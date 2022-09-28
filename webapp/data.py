import os
import json

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

SUBJEKTY_FILEPATH = os.path.join("data", "subjekty.json") 
MISTA_LOC_FILEPATH = os.path.join("data", "mista_loc.json") 
REDITELSTVI_LOC_FILEPATH = os.path.join("data", "reditelstvi_loc.json") 

SUBJEKTY = read_json(SUBJEKTY_FILEPATH)
MISTA_LOC = read_json(MISTA_LOC_FILEPATH)
REDITELSTVI_LOC = read_json(REDITELSTVI_LOC_FILEPATH)

MISTA_ICO = {}

def build_mista_ico():
    for ico, subj in SUBJEKTY.items():
        for zar in subj.get("zarizeni", []):
            for misto in zar.get("mista", []):
                id_mista = misto["id_mista"]
                MISTA_ICO[id_mista] = ico

build_mista_ico()
