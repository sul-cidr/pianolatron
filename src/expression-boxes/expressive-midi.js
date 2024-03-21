import { get } from "svelte/store";
import IntervalTree from "node-interval-tree";
import { NoteSource } from "../lib/utils";
import {
  activeNotes,
  rollPedalingOnOff,
  softOnOff,
  sustainOnOff,
  tempoCoefficient,
  useMidiTempoEventsOnOff,
} from "../stores";

export default class ExpressiveMidiExpressionizer {
  midiSoftPedal = 67;
  midiSustPedal = 64;

  #metadataTrack;
  #musicTracks;

  constructor(midiSamplePlayer, startNote, stopNote) {
    this.midiSamplePlayer = midiSamplePlayer;
    this.startNote = startNote;
    this.stopNote = stopNote;

    [this.#metadataTrack, ...this.#musicTracks] = midiSamplePlayer.events;

    this.tempoMap = this.#buildTempoMap();
    this.noteVelocitiesMap = this.#buildNoteVelocitiesMap();
    this.pedalingMap = this.#buildPedalingMap();
    this.notesMap = this.#buildNotesMap();
  }

  #buildTempoMap = () => {
    const _tempoMap = new IntervalTree();
    let lastTempo = null;
    let lastTick = 0;

    this.#metadataTrack
      .filter((event) => event.name === "Set Tempo")
      .forEach(({ tick, data: tempo }) => {
        if (tick === lastTick || tempo === lastTempo) {
          return;
        }
        if (lastTempo === null) {
          lastTempo = tempo;
          return;
        }
        _tempoMap.insert(lastTick, tick, lastTempo);
        lastTempo = tempo;
        lastTick = tick;
      });

    _tempoMap.insert(lastTick, Infinity, lastTempo);
    return _tempoMap;
  };

  #buildNoteVelocitiesMap = () => {
    const noteVelocitiesMap = {};
    this.#musicTracks.forEach((track) => {
      track
        .filter(({ name, velocity }) => name === "Note on" && velocity > 1)
        .forEach(({ noteNumber, velocity, tick }) => {
          noteVelocitiesMap[tick] = noteVelocitiesMap[tick] || {};
          // midi-player-js converts velocity values to integers between 0 and
          //  99. This is not ideal because it further reduces the granularity
          //  of the velocity levels (the 128 levels in standard MIDI is
          //  already too few), but we're stuck with it for now.
          //  In any case, these values need to be rescaled to fall between 0
          //  and 127 to (nearly) match the original velocity values in the
          //  expressive MIDI.
          //  Note also that all velocity values are eventually rescaled to an
          //  arbitrary-precision float between 0 and 1 when being played by
          //  the ToneJS sample-based piano synthesizer.
          noteVelocitiesMap[tick][noteNumber] = Math.round(
            (velocity / 100.0) * 127.0,
          );
        });
    });
    return noteVelocitiesMap;
  };

  #buildPedalingMap = () => {
    // Where two or more "music tracks" exist, pedal events are expected to have
    //  been duplicated across tracks, so we read only from the first one.
    const [eventsTrack] = this.#musicTracks;
    const _pedalingMap = new IntervalTree();
    const controllerEvents = eventsTrack.filter(
      ({ name }) => name === "Controller Change",
    );

    const enterEvents = (eventNumber) => {
      let tickOn = false;
      controllerEvents
        .filter(({ number }) => number === eventNumber)
        .forEach(({ value, tick }) => {
          if (value === 0) {
            if (tickOn) _pedalingMap.insert(tickOn, tick, eventNumber);
            tickOn = false;
          } else if (value === 127) {
            if (!tickOn) tickOn = tick;
          }
        });
    };

    enterEvents(this.midiSoftPedal);
    enterEvents(this.midiSustPedal);

    return _pedalingMap;
  };

  #buildNotesMap = () => {
    const _notesMap = new IntervalTree();
    this.#musicTracks.forEach((track) => {
      const tickOn = {};
      track
        .filter((event) => event.name === "Note on")
        .forEach(({ noteNumber, velocity, tick }) => {
          if (velocity === 0) {
            if (noteNumber in tickOn) {
              _notesMap.insert(tickOn[noteNumber], tick, noteNumber);
              delete tickOn[noteNumber];
            }
          } else if (!(noteNumber in tickOn)) tickOn[noteNumber] = tick;
        });
    });
    return _notesMap;
  };

  midiEventHandler = ({
    name,
    value,
    number,
    noteNumber,
    velocity,
    data,
    tick,
  }) => {
    if (name === "Note on") {
      if (velocity === 0) {
        this.stopNote(noteNumber, NoteSource.Midi);
      } else {
        const noteVelocity =
          this.noteVelocitiesMap[tick]?.[noteNumber] || velocity;
        this.startNote(noteNumber, noteVelocity, NoteSource.Midi);
        activeNotes.add(noteNumber);
      }
    } else if (name === "Controller Change" && get(rollPedalingOnOff)) {
      if (number === this.midiSustPedal) {
        sustainOnOff.set(!!value);
      } else if (number === this.midiSoftPedal) {
        softOnOff.set(!!value);
      }
    } else if (name === "Set Tempo" && get(useMidiTempoEventsOnOff)) {
      this.midiSamplePlayer.setTempo(data * get(tempoCoefficient));
    }
  };
}
