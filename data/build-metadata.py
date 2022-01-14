#!/usr/bin/env python3

"""
Builds per-DRUID metadata .json files and a catalog.json file listing rolls
available for consumption by the Pianolatron app, downloading metadata files
(if not already cached) and incorporating data from the rolls' MIDI files, if
available. Writes JSON and MIDI files to the proper locations to be used by
the app.
"""

import argparse
from csv import DictReader
import json
import logging
from pathlib import Path
import re
from shutil import copy

from lxml import etree
from mido import MidiFile, tempo2bpm
import requests

WRITE_TEMPO_MAPS = False

# These are either duplicates of existing rolls, or rolls that are listed in
# the DRUIDs files but have mysteriously disappeared from the catalog
ROLLS_TO_SKIP = ["rr052wh1991", "hm136vg1420"]

ROLL_TYPES = {
    "Welte-Mignon red roll (T-100)": "welte-red",
    "Welte-Mignon red roll (T-100).": "welte-red",
    "Welte-Mignon red roll (T-100)..": "welte-red",
    "Scale: 88n.": "88-note",
    "Scale: 65n.": "65-note",
    "88n": "88-note",
    "standard": "88-note",
    "non-reproducing": "88-note",
    "Welte-Mignon green roll (T-98)": "welte-green",
    "Welte-Mignon green roll (T-98).": "welte-green",
    "Welte-Mignon licensee roll": "welte-licensee",
    "Welte-Mignon licensee roll.": "welte-licensee",
    "Duo-Art piano rolls": "duo-art",
    "Duo-Art piano rolls.": "duo-art",
}

PURL_BASE = "https://purl.stanford.edu/"
STACKS_BASE = "https://stacks.stanford.edu/file/"
NS = {"x": "http://www.loc.gov/mods/v3"}

MIDI_DIR = "input/midi"
TXT_DIR = "input/txt"
IIIF_DIR = "input/manifests"


def get_metadata_for_druid(druid, redownload_mods):
    def get_value_by_xpath(xpath):
        try:
            return xml_tree.xpath(
                xpath,
                namespaces=NS,
            )[0]
        except IndexError:
            return None

    # Takes an array of potential xpaths, returns the first one that matches,
    # or None
    def get_value_by_xpaths(xpaths):
        for xpath in xpaths:
            value = get_value_by_xpath(xpath)
            if value is not None:
                return value
        return value

    mods_filepath = Path(f"input/mods/{druid}.mods")

    if not mods_filepath.exists() or redownload_mods:
        response = requests.get(f"{PURL_BASE}{druid}.mods")
        xml_tree = etree.fromstring(response.content)
        with mods_filepath.open("w") as _fh:
            _fh.write(
                etree.tostring(xml_tree, encoding="unicode", pretty_print=True)
            )
    else:
        xml_tree = etree.parse(mods_filepath.open())

    # The representation of the roll type in the MODS metadata continues to
    # evolve, but this logic should work
    roll_type = "NA"
    type_note = get_value_by_xpath(
        "x:physicalDescription/x:note[@displayLabel='Roll type']/text()"
    )
    if type_note is not None and type_note in ROLL_TYPES:
        roll_type = ROLL_TYPES[type_note]
    else:
        for note in xml_tree.xpath("(x:note)", namespaces=NS):
            if note is not None and note.text in ROLL_TYPES:
                roll_type = ROLL_TYPES[note.text]

    metadata = {
        "title_prefix": get_value_by_xpath("(x:titleInfo/x:nonSort)[1]/text()"),
        "title": get_value_by_xpath("(x:titleInfo/x:title)[1]/text()"),
        "title_part_number": get_value_by_xpath(
            "(x:titleInfo/x:partNumber)[1]/text()"
        ),
        "title_part_name": get_value_by_xpath(
            "(x:titleInfo/x:partName)[1]/text()"
        ),
        "subtitle": get_value_by_xpath("(x:titleInfo/x:subTitle)[1]/text()"),
        "composer": get_value_by_xpaths(
            [
                "x:name[descendant::x:roleTerm[text()='composer']]/x:namePart[not(@type='date')]/text()",
                "x:name[descendant::x:roleTerm[text()='Composer']]/x:namePart[not(@type='date')]/text()",
                "x:name[descendant::x:roleTerm[text()='composer.']]/x:namePart[not(@type='date')]/text()",
                "x:name[descendant::x:roleTerm[text()='cmp']]/x:namePart[not(@type='date')]/text()",
            ]
        ),
        "performer": get_value_by_xpaths(
            [
                "x:name[descendant::x:roleTerm[text()='instrumentalist']]/x:namePart[not(@type='date')]/text()",
                "x:name[descendant::x:roleTerm[text()='instrumentalist.']]/x:namePart[not(@type='date')]/text()",
            ]
        ),
        "arranger": get_value_by_xpaths(
            [
                "x:name[descendant::x:roleTerm[text()='arranger of music']]/x:namePart[not(@type='date')]/text()",
                "x:name[descendant::x:roleTerm[text()='arranger']]/x:namePart[not(@type='date')]/text()",
            ]
        ),
        "original_composer": get_value_by_xpaths(
            [
                "x:relatedItem[@otherType='Based on (work) :']/x:name[@type='personal']/x:namePart[not(@type='date')]/text()",
                "x:relatedItem[@otherType='Based on']/x:name[@type='personal']/x:namePart[not(@type='date')]/text()",
                "x:relatedItem[@otherType='Adaptation of (work) :']/x:name[@type='personal']/x:namePart[not(@type='date')]/text()",
                "x:relatedItem[@otherType='Adaptation of']/x:name[@type='personal']/x:namePart[not(@type='date')]/text()",
                "x:relatedItem[@otherType='Arrangement of :']/x:name[@type='personal']/x:namePart[not(@type='date')]/text()",
                "x:relatedItem[@otherType='Arrangement of']/x:name[@type='personal']/x:namePart[not(@type='date')]/text()",
            ]
        ),
        "label": get_value_by_xpaths(
            [
                "x:identifier[@type='issue number' and @displayLabel='Roll number']/text()",
                "x:identifier[@type='issue number']/text()",
            ]
        ),
        "publisher": get_value_by_xpaths(
            [
                "x:identifier[@type='publisher']/text()",
                "x:originInfo[@eventType='publication']/x:publisher/text()",
                "x:name[@type='corporate']/x:nameType/text()",
                "x:name[descendant::x:roleTerm[text()='publisher.']]/x:namePart/text()",
            ]
        ),
        "number": get_value_by_xpath(
            "x:identifier[@type='publisher number']/text()"
        ),
        "publish_date": get_value_by_xpaths(
            [
                "x:originInfo[@eventType='publication']/x:dateIssued[@keyDate='yes']/text()",
                "x:originInfo[@eventType='publication']/x:dateIssued/text()",
                "x:originInfo/x:dateIssued[@point='start']/text()",
                "x:originInfo[@displayLabel='publisher']/x:dateIssued/text()",
            ]
        ),
        "publish_place": get_value_by_xpaths(
            [
                "x:originInfo[@eventType='publication']/x:place/x:placeTerm[@type='text']/text()",
                "x:originInfo[@displayLabel='publisher']/x:place/x:placeTerm/text()",
            ]
        ),
        "recording_date": get_value_by_xpaths(
            [
                "x:note[@type='venue']/text()",
                "x:originInfo[@eventType='publication']/x:dateCaptured/text()",
            ]
        ),
        # The call number is not consistently available in all MODS variants
        # "call_number": get_value_by_xpath("x:location/x:shelfLocator/text()"),
        "type": roll_type,
        "PURL": PURL_BASE + druid,
    }

    return metadata


def get_iiif_manifest(druid, redownload_manifests, iiif_source_dir):

    target_iiif_filepath = Path(f"input/manifests/{druid}.json")
    source_iiif_filepath = Path(f"{iiif_source_dir}/{druid}.json")
    if (
        not target_iiif_filepath.exists()
        or not source_iiif_filepath.exists()
        or redownload_manifests
    ) or redownload_manifests:
        response = requests.get(f"{PURL_BASE}{druid}/iiif/manifest")
        iiif_manifest = response.json()
        with target_iiif_filepath.open("w") as _fh:
            json.dump(iiif_manifest, _fh)
    elif source_iiif_filepath.exists():
        iiif_manifest = json.load(open(source_iiif_filepath, "r"))
    else:
        iiif_manifest = json.load(open(target_iiif_filepath, "r"))
    return iiif_manifest


def get_iiif_url(iiif_manifest):
    resource_id = iiif_manifest["sequences"][0]["canvases"][0]["images"][0][
        "resource"
    ]["@id"]
    return resource_id.replace("full/full/0/default.jpg", "info.json")


def build_tempo_map_from_midi(druid):

    midi_filepath = Path(f"../public/midi/{druid}.mid")
    midi = MidiFile(midi_filepath)

    tempo_map = []
    current_tick = 0

    for event in midi.tracks[0]:
        current_tick += event.time
        if event.type == "set_tempo":
            tempo_map.append((current_tick, tempo2bpm(event.tempo)))

    return tempo_map


def merge_midi_velocities(roll_data, hole_data, druid):

    midi_filepath = Path(f"../public/midi/{druid}.mid")

    if not midi_filepath.exists():
        logging.info(
            f"MIDI file not found for {druid}, won't include velocities in .json"
        )
        return hole_data

    first_music_px = int(roll_data["FIRST_HOLE"].removesuffix("px"))

    midi = MidiFile(midi_filepath)

    tick_notes_velocities = {}

    for note_track in midi.tracks[1:3]:
        current_tick = 0
        for event in note_track:
            current_tick += event.time
            if event.type == "note_on":
                # XXX Not sure why some note events have velocity=1, but this
                # works with the in-app expression code
                if event.velocity > 1:
                    if current_tick in tick_notes_velocities:
                        tick_notes_velocities[current_tick][
                            event.note
                        ] = event.velocity
                    else:
                        tick_notes_velocities[current_tick] = {
                            event.note: event.velocity
                        }

    for i in range(len(hole_data)):
        hole = hole_data[i]

        hole_tick = int(hole["ORIGIN_ROW"]) - first_music_px
        hole_midi = int(hole["MIDI_KEY"])

        if (
            hole_tick in tick_notes_velocities
            and hole_midi in tick_notes_velocities[hole_tick]
        ):
            hole_data[i]["VELOCITY"] = tick_notes_velocities[hole_tick][
                hole_midi
            ]

    return hole_data


def get_hole_report_data(druid, analysis_source_dir):
    txt_filepath = Path(f"{analysis_source_dir}/{druid}.txt")

    roll_data = {}
    hole_data = []

    if not txt_filepath.exists():
        logging.info(
            f"Unable to find hole analysis output file for {druid} at {txt_filepath}."
        )
        return roll_data, hole_data

    roll_keys = [
        "AVG_HOLE_WIDTH",
        "FIRST_HOLE",
        "IMAGE_WIDTH",
        "IMAGE_LENGTH",
        # "TRACKER_HOLES",
        # "ROLL_WIDTH",
        # "HARD_MARGIN_BASS",
        # "HARD_MARGIN_TREBLE",
        # "HOLE_SEPARATION",
        # "HOLE_OFFSET",
    ]

    hole_keys = [
        "NOTE_ATTACK",
        "WIDTH_COL",
        "ORIGIN_COL",
        "ORIGIN_ROW",
        "OFF_TIME",
        "MIDI_KEY",
        # "TRACKER_HOLE",
    ]

    dropped_holes = 0

    with txt_filepath.open("r") as _fh:
        while (line := _fh.readline()) and line != "@@BEGIN: HOLES\n":
            if match := re.match(r"^@([^@\s]+):\s+(.*)", line):
                key, value = match.groups()
                if key in roll_keys:
                    roll_data[key] = value.replace("px", "").strip()

        while (line := _fh.readline()) and line != "@@END: HOLES\n":
            if line == "@@BEGIN: HOLE\n":
                hole = {}
            if match := re.match(r"^@([^@\s]+):\s+(.*)", line):
                key, value = match.groups()
                if key in hole_keys:
                    hole[key] = int(value.removesuffix("px"))
            if line == "@@END: HOLE\n":

                if "NOTE_ATTACK" in hole:
                    assert "OFF_TIME" in hole
                    assert hole["NOTE_ATTACK"] == hole["ORIGIN_ROW"]
                    del hole["NOTE_ATTACK"]
                    if hole["ORIGIN_ROW"] >= hole["OFF_TIME"]:
                        logging.info(f"WARNING: invalid note duration: {hole}")
                    hole_data.append(hole)
                else:
                    assert "OFF_TIME" not in hole
                    dropped_holes += 1

    logging.info(f"Dropped Holes: {dropped_holes}")
    return roll_data, hole_data


def remap_hole_data(hole_data):

    new_hole_data = []

    for hole in hole_data:

        new_hole = {
            "x": hole["ORIGIN_COL"],
            "y": hole["ORIGIN_ROW"],
            "w": hole["WIDTH_COL"],
            "h": hole["OFF_TIME"] - hole["ORIGIN_ROW"],
            "m": hole["MIDI_KEY"],
            # "t": hole["TRACKER_HOLE"],
        }
        if "VELOCITY" in hole:
            new_hole["v"] = hole["VELOCITY"]

        new_hole_data.append(new_hole)

    return new_hole_data


def write_json(druid, metadata):
    output_path = Path(f"../public/json/{druid}.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w") as _fh:
        json.dump(metadata, _fh)


def get_druids_from_files():
    druids_list = []
    for druid_file in Path("input/druids/").glob("*.csv"):
        with open(druid_file, "r", newline="") as druid_csv:
            druid_reader = DictReader(druid_csv)
            for row in druid_reader:
                druids_list.append(row["Druid"])
    return druids_list


def refine_metadata(metadata):
    # Note that the CSV files that list DRUIDs by collection/roll type also
    # provide descriptions for each roll with some of this metadata, but these
    # files (or descriptions) won't always be available

    # Extract the publisher short name (e.g., Welte-Mignon) and issue number
    # from the label data, if available
    if metadata["label"] is not None and len(metadata["label"].split(" ")) == 2:
        metadata["number"], metadata["publisher"] = metadata["label"].split(" ")
    elif metadata["label"] is None:
        if metadata["number"] is None:
            metadata["number"] = "----"
        metadata["label"] = metadata["number"] + " " + metadata["publisher"]

    # Construct a more user-friendly title from the contents of <titleInfo>
    fulltitle = metadata["title"].capitalize()
    if metadata["title_prefix"] is not None:
        fulltitle = f"{metadata['title_prefix']} {fulltitle}"
    if metadata["subtitle"] is not None:
        fulltitle = f"{fulltitle}: {metadata['subtitle']}"
    if metadata["title_part_number"] is not None:
        fulltitle = f"{fulltitle}: {metadata['title_part_number']}"
    if metadata["title_part_name"] is not None:
        fulltitle = f"{fulltitle}: {metadata['title_part_name']}"

    metadata["title"] = fulltitle.replace(" : ", ": ")

    # Construct a summary of the roll's music to use in the searchbar
    searchtitle = None

    composer_short = ""
    if metadata["composer"] is not None:
        composer_short = metadata["composer"].split(",")[0].strip()

    if metadata["original_composer"] is not None:
        original_composer_short = (
            metadata["original_composer"].split(",")[0].strip()
        )
        if (
            metadata["composer"] is not None
            and original_composer_short != composer_short
        ):
            searchtitle = f"{original_composer_short}-{composer_short}"
    elif metadata["composer"] is not None:
        searchtitle = composer_short

    if metadata["arranger"] is not None:
        arranger_short = metadata["arranger"].split(",")[0].strip()
        if searchtitle is not None and arranger_short != composer_short:
            searchtitle += f"-{arranger_short}"
        else:
            searchtitle = arranger_short

    if metadata["performer"] is not None:
        performer_short = metadata["performer"].split(",")[0].strip()
        if searchtitle is not None:
            searchtitle += "/" + performer_short
        else:
            searchtitle = performer_short

    if searchtitle is not None:
        searchtitle += " - " + fulltitle
    else:
        searchtitle = fulltitle

    metadata["searchtitle"] = searchtitle.replace(" : ", ": ")

    return metadata


def main():
    """Command-line entry-point."""

    logging.basicConfig(level=logging.INFO, format="%(message)s")

    argparser = argparse.ArgumentParser(
        description="""Generate per-roll DRUID.json files as well as a
                       comprehensive catalog.json file that describes all rolls
                       processed, and place these files, along with the 
                       desired MIDI file type (_note or _exp) as DRUID.mid in
                       the proper locations in the Pianolatron folders.
                       If no DRUIDs are provided on the command line, the
                       script will look for CSV files in the druids/ folder,
                       and obtain DRUIDs from columns with the header "Druid".
                    """
    )
    argparser.add_argument(
        "druids",
        nargs="*",
        help="DRUID(s) of one or more rolls to be processed, separated by spaces",
    )
    argparser.add_argument(
        "--no_catalog",
        action="store_true",
        help="Do not generate a new catalog.json (preexisting file will remain)",
    )
    argparser.add_argument(
        "--redownload_manifests",
        action="store_true",
        help="Always download IIIF manifests, overwriting files in input/manifests/ and ignoring --iiif_source_dir",
    )
    argparser.add_argument(
        "--redownload_mods",
        action="store_true",
        help="Always download MODS files, overwriting files in input/mods/",
    )
    argparser.add_argument(
        "--use_exp_midi",
        action="store_true",
        help="Use expressionized MIDI for output .mid files (default is to use note MIDI)",
    )
    argparser.add_argument(
        "--midi_source_dir",
        default=MIDI_DIR,
        help="External folder containg note (/note/DRUID_note.mid) or expressionized (/note/DRUID_exp.mid) MIDI files",
    )
    argparser.add_argument(
        "--analysis_source_dir",
        default=TXT_DIR,
        help="External folder containg hole analysis output files (DRUID.txt)",
    )
    argparser.add_argument(
        "--iiif_source_dir",
        default=IIIF_DIR,
        help="External folder containg pre-downloaded IIIF manifests (DRUID.json)",
    )

    args = argparser.parse_args()

    DRUIDS = []

    if "druids" in args:
        DRUIDS = args.druids

    if len(DRUIDS) == 0:
        DRUIDS = get_druids_from_files()

    # Override cmd line or CSV DRUIDs lists
    # DRUIDS = ["hb523vs3190"]

    catalog_entries = []

    for druid in DRUIDS:

        if druid in ROLLS_TO_SKIP:
            logging.info(f"Skippig DRUID {druid}")
            continue

        logging.info(f"Processing {druid}...")

        metadata = get_metadata_for_druid(druid, args.redownload_mods)

        iiif_manifest = get_iiif_manifest(
            druid, args.redownload_manifests, args.iiif_source_dir
        )

        if (
            not args.use_exp_midi
            and Path(f"{args.midi_source_dir}/note/{druid}_note.mid").exists()
        ):
            copy(
                Path(f"{args.midi_source_dir}/note/{druid}_note.mid"),
                Path(f"../public/midi/{druid}.mid"),
            )
            note_midi = MidiFile(Path(f"../public/midi/{druid}.mid"))
            metadata["NOTE_MIDI_TPQ"] = note_midi.ticks_per_beat
        elif Path(f"{args.midi_source_dir}/exp/{druid}_exp.mid").exists():
            copy(
                Path(f"{args.midi_source_dir}/exp/{druid}_exp.mid"),
                Path(f"../public/midi/{druid}.mid"),
            )

        if WRITE_TEMPO_MAPS:
            metadata["tempoMap"] = build_tempo_map_from_midi(druid)

        roll_data, hole_data = get_hole_report_data(
            druid, args.analysis_source_dir
        )

        metadata = refine_metadata(metadata)

        # Add roll-level hole report info to the metadata
        for key in roll_data:
            metadata[key] = roll_data[key]

        if hole_data:
            if metadata["type"] != "65-note":
                hole_data = merge_midi_velocities(roll_data, hole_data, druid)
            metadata["holeData"] = remap_hole_data(hole_data)
        else:
            metadata["holeData"] = None

        write_json(druid, metadata)

        if not args.no_catalog:
            catalog_entries.append(
                {
                    "druid": druid,
                    "title": metadata["searchtitle"],
                    "image_url": get_iiif_url(iiif_manifest),
                    "type": metadata["type"],
                    "label": metadata["label"],
                }
            )

    if not args.no_catalog:
        sorted_catalog = sorted(catalog_entries, key=lambda i: i["title"])
        with open(
            "../src/config/catalog.json", "w", encoding="utf8"
        ) as catalog_file:
            json.dump(
                sorted_catalog,
                catalog_file,
                ensure_ascii=False,
                indent=2,
                sort_keys=True,
            )
            catalog_file.write("\n")


if __name__ == "__main__":
    main()
