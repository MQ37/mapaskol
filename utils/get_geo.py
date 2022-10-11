from reader import read_xml, get_subjekty_n, subjekt_info, get_subjekty_all
import argparse
import requests
import os
import json
import time
import sys

API_TOKEN = os.environ["API_TOKEN"]

KRAJE = {
        "CZ011": "Praha",
        "CZ021": "Středočeský kraj",
        "CZ031": "Jihočeský kraj",
        "CZ032": "Plzeňský kraj",
        "CZ041": "Karlovarský kraj",
        "CZ042": "Ústecký kraj",
        "CZ051": "Liberecký kraj",
        "CZ052": "Královéhradecký kraj",
        "CZ053": "Pardubický kraj",
        "CZ061": "Vysočina",
        "CZ062": "Jihomoravský kraj",
        "CZ071": "Olomoucký kraj",
        "CZ072": "Zlínský kraj",
        "CZ081": "Moravskoslezský kraj",
        }

OKRESY = {
        "CZ0100": "Hlavní město Praha",
        "CZ0201": "Benešov",
        "CZ0202": "Beroun",
        "CZ0203": "Kladno",
        "CZ0204": "Kolín",
        "CZ0205": "Kutná Hora",
        "CZ0206": "Mělník",
        "CZ0207": "Mladá Boleslav",
        "CZ0208": "Nymburk",
        "CZ0209": "Praha-východ",
        "CZ020A": "Praha-západ",
        "CZ020B": "Příbram",
        "CZ020C": "Rakovník",
        "CZ0311": "České Budějovice",
        "CZ0313": "Jindřichův Hradec",
        "CZ0314": "Písek",
        "CZ0315": "Prachatice",
        "CZ0316": "Strakonice",
        "CZ0317": "Tábor",
        "CZ0321": "Domažlice",
        "CZ0322": "Klatovy",
        "CZ0323": "Plzeň-město",
        "CZ0324": "Plzeň-jih",
        "CZ0325": "Plzeň-sever",
        "CZ0326": "Rokycany",
        "CZ0327": "Tachov",
        "CZ0411": "Cheb",
        "CZ0412": "Karlovy Vary",
        "CZ0413": "Sokolov",
        "CZ0421": "Děčín",
        "CZ0422": "Chomutov",
        "CZ0423": "Litoměřice",
        "CZ0424": "Louny",
        "CZ0425": "Most",
        "CZ0426": "Teplice",
        "CZ0427": "Ústí nad Labem",
        "CZ0511": "Česká Lípa",
        "CZ0512": "Jablonec nad Nisou",
        "CZ0513": "Liberec",
        "CZ0514": "Semily",
        "CZ0521": "Hradec Králové",
        "CZ0522": "Jičín",
        "CZ0523": "Náchod",
        "CZ0524": "Rychnov nad Kněžnou",
        "CZ0525": "Trutnov",
        "CZ0531": "Chrudim",
        "CZ0532": "Pardubice",
        "CZ0533": "Svitavy",
        "CZ0534": "Ústí nad Orlicí",
        "CZ0631": "Havlíčkův Brod",
        "CZ0632": "Jihlava",
        "CZ0633": "Pelhřimov",
        "CZ0634": "Třebíč",
        "CZ0635": "Žďár nad Sázavou",
        "CZ0641": "Blansko",
        "CZ0642": "Brno-město",
        "CZ0644": "Břeclav",
        "CZ0645": "Hodonín",
        "CZ0646": "Vyškov",
        "CZ0647": "Znojmo",
        "CZ0711": "Jeseník",
        "CZ0712": "Olomouc",
        "CZ0713": "Prostějov",
        "CZ0714": "Přerov",
        "CZ0715": "Šumperk",
        "CZ0721": "Kroměříž",
        "CZ0722": "Uherské Hradiště",
        "CZ0723": "Vsetín",
        "CZ0724": "Zlín",
        "CZ0801": "Bruntál",
        "CZ0802": "Frýdek-Místek",
        "CZ0803": "Karviná",
        "CZ0804": "Nový Jičín",
        "CZ0806": "Ostrava-město",
        }

cache = {}


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
        subjekty = get_subjekty_all(tree)

    try:
        for subjekt in subjekty:
            info = subjekt_info(subjekt)
            lau = info["reditelstvi"]["okres"]
            nuts = lau[:5]
            kraj = KRAJE.get(nuts)
            okres = OKRESY.get(lau)

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
                    if okres:
                        adr += ",%s" % okres
                    if kraj:
                        adr += ",%s" % kraj

                    if adr in cache:
                        geo_loc = cache[adr]
                    else:
                        time.sleep(1)
                        geo_loc = geo_lookup(adr)
                        if not geo_loc:
                            failed_geo.append(id_mista)
                            print("Could not find skipping", id_mista)
                            continue
                        cache[adr] = geo_loc

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

