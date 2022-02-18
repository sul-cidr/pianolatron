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

const SOFT_PEDAL = 67;
const SUSTAIN_PEDAL = 64;

const buildNoteVelocitiesMap = (midiSamplePlayer) => {
  const noteVelocitiesMap = {};

  const [, ...musicTracks] = midiSamplePlayer.events;

  musicTracks.forEach((track) => {
    track
      .filter(({ name, velocity }) => name === "Note on" && velocity > 0)
      .forEach(({ noteNumber, velocity, tick }) => {
        noteVelocitiesMap[tick] = noteVelocitiesMap[tick] || {};
        noteVelocitiesMap[tick][noteNumber] = velocity;
      });
  });

  return noteVelocitiesMap;
};

const buildPedalingMap = (eventsTrack) => {
  const _pedalingMap = new IntervalTree();
  const controllerEvents = eventsTrack.filter(
    (event) => event.name === "Controller Change",
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

  enterEvents(SOFT_PEDAL);
  enterEvents(SUSTAIN_PEDAL);

  return _pedalingMap;
};

const buildNotesMap = (musicTracks) => {
  const _notesMap = new IntervalTree();
  musicTracks.forEach((track) => {
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

const buildMidiEventHandler = (startNote, stopNote, midiSamplePlayer) => {
  const notesVelocitiesMap = buildNoteVelocitiesMap(midiSamplePlayer);
  return ({ name, value, number, noteNumber, velocity, data, tick }) => {
    if (name === "Note on") {
      if (velocity === 0) {
        stopNote(noteNumber);
      } else {
        const expressionizedVelocity = notesVelocitiesMap[tick][noteNumber];
        startNote(noteNumber, expressionizedVelocity);
        activeNotes.add(noteNumber);
      }
    } else if (name === "Controller Change" && get(rollPedalingOnOff)) {
      if (number === SUSTAIN_PEDAL) {
        sustainOnOff.set(!!value);
      } else if (number === SOFT_PEDAL) {
        softOnOff.set(!!value);
      }
    } else if (name === "Set Tempo" && get(useMidiTempoEventsOnOff)) {
      midiSamplePlayer.setTempo(data * get(tempoCoefficient));
    }
  };
};

export { buildPedalingMap, buildNotesMap, buildMidiEventHandler };
