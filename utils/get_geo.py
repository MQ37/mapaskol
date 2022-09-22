from reader import read_xml, get_subjekty_n, subjekt_info
import argparse
import requests
import os
import json
import time
import sys

API_TOKEN = os.environ["API_TOKEN"]


def read_json(filepath):
    if os.path.exists(filepath):
        try:
            with open(filepath, "r") as f:
                obj = json.load(f)
            return obj
        except Exception as e:
            print("Error reading file %s - %s" % (filepath, e))

    return None

def write_json(filepath, obj):
    with open(filepath, "w") as f:
        json.dump(obj, f)

def geo_lookup(adr):
    r = requests.get("https://us1.locationiq.com/v1/search",
                    params={
                        "key": API_TOKEN,
                        "q": adr,
                        "countrycodes": ["CZ"],
                        "format": "json",
                        })
    try:
        r.raise_for_status()
    except Exception as e:
        print("API CALL Error - %s | %s" % (r.text, e))
        return None

    ret = r.json()[0]
    if "error" in ret:
        return None

    return {
            "lat": ret["lat"],
            "lon": ret["lon"],
            }

def main(args):
    filepath = args.filepath
    geo_filepath = args.geo_filepath
    failed_geo_filepath = args.failed_geo_filepath

    tree = read_xml(filepath)
    failed_geo = read_json(failed_geo_filepath)
    if not failed_geo:
        failed_geo = []
    geo_obj = read_json(geo_filepath)
    if not geo_obj:
        geo_obj = {}

    if not (args.n or args.all):
        print("Specify -n N or --all")
        exit()

    if args.n:
        n = args.n
        subjekty = get_subjekty_n(tree, n)
    elif args.all:
        subjekty = get_subjekty_all(tree, n)

    try:
        for subjekt in subjekty:
            info = subjekt_info(subjekt)

            for zarizeni in info.get("zarizeni", []):
                for misto in zarizeni.get("mista", []):
                    id_mista = misto["id_mista"]

                    if id_mista in geo_obj:
                        print("Skipping", id_mista)
                        continue
                    elif id_mista in failed_geo:
                        print("Skipping failed", id_mista)
                        continue

                    adr1 = misto["adr1"]
                    adr2 = misto["adr2"]
                    adr3 = misto["adr3"]

                    adr = ",".join(filter(None, [adr1, adr2, adr3]))

                    time.sleep(1)
                    geo_loc = geo_lookup(adr)
                    if not geo_loc:
                        failed_geo.append(id_mista)
                        print("Could not find skipping", id_mista)
                        continue
                    print(id_mista, geo_loc)

                    geo_obj[id_mista] = geo_loc
    except KeyboardInterrupt:
        write_json(failed_geo_filepath, failed_geo)
        write_json(geo_filepath, geo_obj)
        sys.exit()

    write_json(failed_geo_filepath, failed_geo)
    write_json(geo_filepath, geo_obj)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-f", help="XML filepth", required=True, dest="filepath")
    parser.add_argument("-gf", help="GeoJSON output filepath", required=True, dest="geo_filepath")
    parser.add_argument("-fgf", help="Failed GeoJSON output filepath (used for skipping)", required=True, dest="failed_geo_filepath")
    parser.add_argument("-n", help="Number of subjekts", type=int)
    parser.add_argument("--all", help="All subjekts", action="store_true")
    args = parser.parse_args()

    main(args)

