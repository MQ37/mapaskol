import argparse
import json
import os


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

    subjekty = read_json(subjekty_filepath)

    druhy = {}

    for subjekt in subjekty.values():
        for zarizeni in subjekt["zarizeni"]:
            nazev = zarizeni["nazev"]
            druh = zarizeni["druh"]
            if druh not in druhy:
                druhy[druh] = nazev

    print( json.dumps(druhy, indent=4, ensure_ascii=False) )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-sf", help="Subjekty JSON filepath", required=True, dest="subjekty_filepath")
    args = parser.parse_args()

    main(args)
