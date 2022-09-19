from reader import read_xml, get_subjekty_all, subjekt_info
from reader import get_subjekty_n
import argparse
import os
import json

def write_json(filepath, obj, ensure_ascii=True):
    with open(filepath, "w") as f:
        json.dump(obj, f, ensure_ascii=ensure_ascii)

def main(args):
    filepath = args.filepath
    json_filepath = args.json_filepath
    ensure_ascii = not args.no_ensure_ascii

    tree = read_xml(filepath)
    obj = {}

    subjekty = get_subjekty_all(tree)
    #subjekty = get_subjekty_n(tree, 3)

    for subjekt in subjekty:
        info = subjekt_info(subjekt)
        ico = info["ico"]

        obj[ico] = info

    write_json(json_filepath, obj, ensure_ascii)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-f", help="XML filepth", required=True, dest="filepath")
    parser.add_argument("-jf", help="JSON output filepath", required=True, dest="json_filepath")
    parser.add_argument("--no-ascii", help="No ASCII output", action="store_true", dest="no_ensure_ascii")
    args = parser.parse_args()

    main(args)

