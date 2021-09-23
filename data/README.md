This is an example of a standard invocation of the `build-metadata.py` script,
which tries to build Pianolatron-ready metadata and MIDI files for all rolls
with DRUIDS listed in the CSV files contained in `input/druids/`. The output
MIDI files will be expressionized MIDI (rather than note MIDI), and the script
will look for hole analysis output files, as well as the source MIDI files and
cached IIIF manifests for each roll, in the appropriate subfolders of the 
`roll-data` folder two directories below.

`pipenv run python build-metadata.py --use_exp_midi --midi_source_dir ../../roll-data/midi --analysis_source_dir ../../roll-data/txt --iiif_source_dir ../../roll-data/manifests`
