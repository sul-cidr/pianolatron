import { get } from "svelte/store";
import IntervalTree from "node-interval-tree";
import {
  activeNotes,
  rollPedalingOnOff,
  softOnOff,
  sustainOnOff,
  tempoCoefficient,
  useMidiTempoEventsOnOff,
} from "../stores";

export default class Expressionizer {
  midiSoftOn = 67;
  midiSustOn = 64;

  metadataTrack;
  musicTracks;

  constructor(midiSamplePlayer) {
    this.midiSamplePlayer = midiSamplePlayer;
    [this.metadataTrack, ...this.musicTracks] = midiSamplePlayer.events;

    this.tempoMap = this.buildTempoMap();
    this.noteVelocitiesMap = this.buildNoteVelocitiesMap();
    this.pedalingMap = this.buildPedalingMap();
    this.notesMap = this.buildNotesMap();
  }

  buildTempoMap = () => {
    const _tempoMap = new IntervalTree();
    let lastTempo = null;
    let lastTick = 0;

    this.metadataTrack
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

  buildNoteVelocitiesMap = () => {
    const noteVelocitiesMap = {};
    this.musicTracks.forEach((track) => {
      track
        .filter(({ name, velocity }) => name === "Note on" && velocity > 1)
        .forEach(({ noteNumber, velocity, tick }) => {
          noteVelocitiesMap[tick] = noteVelocitiesMap[tick] || {};
          // midi-player-js converts velocity values to integers between 0 and
          // 99, which is problematic and probably should be changed via a fork.
          // But for now they need to be rescaled to be between 0 and 127 to
          // (almost) match the original velocity values in the expressive MIDI.
          noteVelocitiesMap[tick][noteNumber] = Math.round(
            (velocity / 100.0) * 127.0,
          );
        });
    });
    return noteVelocitiesMap;
  };

  buildPedalingMap = () => {
    // where two or more "music tracks" exist, pedal events are expected to have
    //  been duplicated across tracks, so we read only from the first one.
    const [eventsTrack] = this.musicTracks;
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

    enterEvents(this.midiSoftOn);
    enterEvents(this.midiSustOn);

    return _pedalingMap;
  };

  buildNotesMap = () => {
    const _notesMap = new IntervalTree();
    this.musicTracks.forEach((track) => {
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

  buildMidiEventHandler =
    (startNote, stopNote) =>
    ({ name, value, number, noteNumber, velocity, data, tick }) => {
      if (name === "Note on") {
        if (velocity === 0) {
          stopNote(noteNumber);
        } else {
          const expressionizedVelocity =
            this.noteVelocitiesMap[tick]?.[noteNumber] || velocity;
          startNote(noteNumber, expressionizedVelocity);
          activeNotes.add(noteNumber);
        }
      } else if (name === "Controller Change" && get(rollPedalingOnOff)) {
        if (number === this.midiSustOn) {
          sustainOnOff.set(!!value);
        } else if (number === this.midiSoftOn) {
          softOnOff.set(!!value);
        }
      } else if (name === "Set Tempo" && get(useMidiTempoEventsOnOff)) {
        this.midiSamplePlayer.setTempo(data * get(tempoCoefficient));
      }
    };
}

// TODO:
// const getExpressionParams = () => {};
// const computeDerivedExpressionParams = () => {};
