import argparse
import os
import json

def write_json(filepath, obj, ensure_ascii=True):
    with open(filepath, "w") as f:
        json.dump(obj, f, ensure_ascii=ensure_ascii)

def read_json(filepath):
    if os.path.exists(filepath):
        try:
            with open(filepath, "r") as f:
                obj = json.load(f)
            return obj
        except Exception as e:
            print("Error reading file %s - %s" % (filepath, e))

    return None

def main(args):
    subjekty_filepath = args.subjekty_filepath
    mista_filepath = args.mista_filepath
    output_filepath = args.output_filepath

    subjekty = read_json(subjekty_filepath)
    mista_loc = read_json(mista_filepath)

    obj = {}

    for ico, subjekt in subjekty.items():
        radr1 = subjekt["reditelstvi"]["adr1"]
        radr2 = subjekt["reditelstvi"]["adr2"]
        radr3 = subjekt["reditelstvi"]["adr3"]

        to_break = False
        for zarizeni in subjekt["zarizeni"]:
            for misto in zarizeni["mista"]:
                id_mista = misto["id_mista"]
                adr1 = misto["adr1"]
                adr2 = misto["adr2"]
                adr3 = misto["adr3"]

                if adr1 == radr1 and adr2 == radr2 and adr3 == radr3:
                    if id_mista in mista_loc:
                        obj[ico] = mista_loc[id_mista]
                        to_break = True
                        break

            if to_break:
                break

    write_json(output_filepath, obj)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-sf", help="Subjekty JSON filepath", required=True, dest="subjekty_filepath")
    parser.add_argument("-mf", help="Mista loc JSON filepath", required=True, dest="mista_filepath")
    parser.add_argument("-o", help="JSON output filepath", required=True, dest="output_filepath")
    args = parser.parse_args()

    main(args)

