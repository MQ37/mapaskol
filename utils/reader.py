from lxml import etree
import time
import json
import os

XPATH_NAZEV = etree.XPath("./Reditelstvi/RedPlnyNazev")
XPATH_ZARIZENI = etree.XPath("./SkolyZarizeni/SkolaZarizeni")
XPATH_MISTO = etree.XPath(
    "./SkolaMistaVykonuCinnosti/SkolaMistoVykonuCinnosti")
XPATH_MISTO_INFO = etree.XPath(
    "./IDMista | ./MistoDruhTyp | ./MistoAdresa1 | ./MistoAdresa2 | ./MistoAdresa3"
)
XPATH_SUBJEKT_SEARCH = etree.XPath("/ExportDat/PravniSubjekt[ICO = $ico]")
XPATH_SUBJEKTY_ALL = etree.XPath("/ExportDat/PravniSubjekt")
XPATH_SUBJEKTY_N = etree.XPath("/ExportDat/PravniSubjekt[position() <= $n]")

def read_xml(filepath):
    if os.path.exists(filepath):
        try:
            with open(filepath, "r") as f:
                tree = etree.parse(f)
            return tree
        except Exception as e:
            print("Error reading file %s - %s" % (filepath, e))

    return None


def print_subjekt(subjekt):
    ico = subjekt.xpath("./ICO")[0].text
    nazev = XPATH_NAZEV(subjekt)[0].text
    print("Nazev", nazev, "ICO", ico)

    for zarizeni in XPATH_ZARIZENI(subjekt):
        izo = zarizeni.xpath("./IZO")[0].text
        print("Zarizeni", izo)

        for misto in XPATH_MISTO(zarizeni):
            idm, druh, adr1, adr2, adr3 = XPATH_MISTO_INFO(misto)
            print("Misto", idm.text, druh.text, adr1.text, adr2.text,
                  adr3.text)

        print("********************")

    print("--------------------")

def benchmark_subjekt(subjekt):
    ico = subjekt.xpath("./ICO")[0].text
    nazev = XPATH_NAZEV(subjekt)[0].text

    for zarizeni in XPATH_ZARIZENI(subjekt):
        izo = zarizeni.xpath("./IZO")[0].text

        for misto in XPATH_MISTO(zarizeni):
            idm, druh, adr1, adr2, adr3 = XPATH_MISTO_INFO(misto)


def subjekt_info(subjekt):

    ico = subjekt.xpath("./ICO")[0].text
    nazev = XPATH_NAZEV(subjekt)[0].text

    info = {
        "ico": ico,
        "nazev": nazev,
        "zarizeni": [],
    }

    for zarizeni in XPATH_ZARIZENI(subjekt):
        izo = zarizeni.xpath("./IZO")[0].text
        nazev = zarizeni.xpath("./SkolaPlnyNazev")[0].text
        druh = zarizeni.xpath("./SkolaDruhTyp")[0].text
        kapacita = zarizeni.xpath("./SkolaKapacita")[0].text

        zar_info = {
            "izo": izo,
            "nazev": nazev,
            "druh": druh,
            "kapacita": kapacita,
            "mista": [],
        }

        for misto in XPATH_MISTO(zarizeni):
            id_mista, druh, adr1, adr2, adr3 = XPATH_MISTO_INFO(misto)

            misto_info = {
                "id_mista": id_mista.text,
                "druh": druh.text,
                "adr1": adr1.text,
                "adr2": adr2.text,
                "adr3": adr3.text,
            }

            zar_info["mista"].append(misto_info)

        info["zarizeni"].append(zar_info)

    return info


def get_subjekt(tree, ico):
    subjekt = XPATH_SUBJEKT_SEARCH(tree, ico=ico)[0]
    return subjekt


def get_subjekty_n(tree, n):
    subjekty = XPATH_SUBJEKTY_N(tree, n=n)
    return subjekty


def get_subjekty_all(tree):
    subjekty = XPATH_SUBJEKTY_ALL(tree)
    return subjekty


if __name__ == "__main__":
    filepath = os.path.join("data", "vrejcelk.xml")
    tree = read_xml(filepath)

    subjekty = get_subjekty_all(tree)

    s = time.time()
    for subjekt in subjekty:
        benchmark_subjekt(subjekt)

    print()
    sub = get_subjekt(tree, 25765710)
    info = subjekt_info(sub)
    print(json.dumps(info, indent=4, ensure_ascii=False))
    print("Took", time.time() - s)

    print("Mista pocet", len(tree.xpath("//SkolaMistoVykonuCinnosti")))
    print("Subjekty pocet", len(tree.xpath("//PravniSubjekt")))
