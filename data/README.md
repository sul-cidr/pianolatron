Here is an example of a standard invocation of the `build-metadata.py` script.
These command-line arguments direct the script to build and deploy
Pianolatron-ready metadata (JSON) and MIDI files for all rolls with DRUIDS
listed in the CSV files contained in `input/druids/`, with the output MIDI
files to be expressionized MIDI (rather than note MIDI); the script will look
for hole analysis output files, as well as the source MIDI files and IIIF
manifests for each roll, in the appropriate subfolders of the `roll-data`
folder two levels away.

```
pipenv run python build-metadata.py --use-exp-midi \
                                    --midi-source-dir ../../roll-data/midi \
                                    --analysis-source-dir ../../roll-data/txt \
                                    --iiif-source-dir ../../roll-data/manifests
```

Note that as an alternative to using the `--*-source-dir` arguments, the input
MIDI files, IIIF manifests, and hole analysis files (.txt) can be placed
directly in the appropriate folders under `input/`. The DRUIDs to be processed
also can be specified on the command line (space-delimited) rather than being
listed in the "Druid" column of CSV files stored in `input/druids/`. The usage
info for the script explains all of the available command-line options:

`pipenv run python build-metadata.py -h`
