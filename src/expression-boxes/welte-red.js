import IntervalTree from "node-interval-tree";
import { get } from "svelte/store";
import { rollMetadata } from "../stores";
import {
  activeNotes,
  rollPedalingOnOff,
  softOnOff,
  sustainOnOff,
  tempoCoefficient,
  useMidiTempoEventsOnOff,
  playExpressionsOnOff,
} from "../stores";
import { rollProfile } from "../config/roll-config";
import { getHoleType } from "../lib/utils";

const TRACKER_EXTENSION = 0;

const getKeyByValue = (object, value) => {
  Object.keys(object).find((key) => object[key] === value);
};

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

const buildTempoMap = (metadataTrack) =>
  metadataTrack
    .filter((event) => event.name === "Set Tempo")
    .reduce((_tempoMap, { tick, data }) => {
      if (!_tempoMap.map(([, _data]) => _data).includes(data))
        _tempoMap.push([tick, data]);
      return _tempoMap;
    }, []);

/*
 * Builds a map of pedal events, where each key is the tick of the event, and
 * the value is an object with keys of the pedal on and off events.
 *
 */

// Get pedal events from track 0 (bass control = soft pedal) and
// track 1 (treble control = sustain pedal)
const buildPedalingMap = (musicTracks) => {
  const rollType = get(rollMetadata).ROLL_TYPE;
  const { ctrlMap } = rollProfile[rollType];

  const SOFT_PEDAL_ON = getKeyByValue(ctrlMap, "soft_on");
  const SOFT_PEDAL_OFF = getKeyByValue(ctrlMap, "soft_off");
  const SUSTAIN_PEDAL_ON = getKeyByValue(ctrlMap, "sust_on");
  const SUSTAIN_PEDAL_OFF = getKeyByValue(ctrlMap, "sust_off");
  const _pedalingMap = new IntervalTree();

  // For 65-note rolls, or any weird MIDI input file with only 1 note track
  if (musicTracks.length === 1) return _pedalingMap;

  const registerPedalEvents = (track, pedalOn, pedalOff) => {
    let tickOn = false;
    track
      // Only want beginning of note holes for lock & cancel type expression
      // mechanisms (works for Welte red and Licensee, not 88 or Welte green)
      .filter(({ name, velocity }) => name === "Note on" && velocity === 1)
      .forEach(({ noteNumber, tick }) => {
        if (noteNumber === pedalOff) {
          if (tickOn) _pedalingMap.insert(tickOn, tick, pedalOn);
          tickOn = false;
        } else if (noteNumber === pedalOn) {
          if (!tickOn) tickOn = tick;
        }
      });
  };

  registerPedalEvents(musicTracks[0], SOFT_PEDAL_ON, SOFT_PEDAL_OFF);
  registerPedalEvents(musicTracks[1], SUSTAIN_PEDAL_ON, SUSTAIN_PEDAL_OFF);

  return _pedalingMap;
};

const buildNotesMap = (musicTracks) => {
  const _notesMap = new IntervalTree();
  const rollType = get(rollMetadata).ROLL_TYPE;

  const registerNoteEvents = (track) => {
    const tickOn = {};
    track
      // The beginning of a note has velocity=1, end is velocity=0
      .filter(
        ({ name, noteNumber }) =>
          name === "Note on" && getHoleType(noteNumber, rollType) === "note",
      )
      .forEach(({ noteNumber, velocity, tick }) => {
        if (velocity === 0) {
          if (noteNumber in tickOn) {
            _notesMap.insert(tickOn[noteNumber], tick, noteNumber);
            delete tickOn[noteNumber];
          }
        } else if (!(noteNumber in tickOn)) tickOn[noteNumber] = tick;
      });
  };

  registerNoteEvents(musicTracks[2]);
  registerNoteEvents(musicTracks[3]);

  return _notesMap;
};

const buildMidiEventHandler = (
  startNote,
  stopNote,
  noteVelocitiesMap,
  midiSamplePlayer,
  tempoMap,
) => {
  const rollType = get(rollMetadata).ROLL_TYPE;
  const { ctrlMap } = rollProfile[rollType];

  const DEFAULT_TEMPO = 60;
  const DEFAULT_NOTE_VELOCITY = 50.0;
  const midiTPQ = midiSamplePlayer.getDivision().division;

  const getTempoAtTick = (tick) => {
    if (!tempoMap || !get(useMidiTempoEventsOnOff)) return DEFAULT_TEMPO;
    let tempo;
    let i = 0;
    while (tempoMap[i][0] <= tick) {
      [, tempo] = tempoMap[i];
      i += 1;
      if (i >= tempoMap.length) break;
    }
    return tempo;
  };

  return ({ name: msgType, noteNumber: midiNumber, velocity, data, tick }) => {
    if (msgType === "Note on") {
      const holeType = getHoleType({ m: midiNumber }, rollType);
      if (holeType === "note") {
        const tempo = getTempoAtTick(tick);

        // const thisTime = getMillisecondsAtTick(tick);

        if (velocity === 0) {
          const ticksPerSecond = (parseFloat(tempo) * midiTPQ) / 60.0;
          // At 591 TPQ & 60bpm, this is ~.02s, drops slowly due to accel
          const trackerExtensionSeconds = TRACKER_EXTENSION / ticksPerSecond;
          stopNote(midiNumber, `+${trackerExtensionSeconds}`);
          activeNotes.delete(midiNumber);
        } else {
          const noteVelocity =
            get(playExpressionsOnOff) && noteVelocitiesMap !== null
              ? noteVelocitiesMap[tick][midiNumber]
              : DEFAULT_NOTE_VELOCITY;
          startNote(midiNumber, noteVelocity);
          activeNotes.add(midiNumber);
        }
      } else if (holeType === "pedal" && get(rollPedalingOnOff)) {
        if (velocity === 0) {
          // Length of pedal control holes doesn't matter for red Welte
          // (but it does for green Welte...)
          return;
        }
        if (ctrlMap[midiNumber] === "sust_on") {
          sustainOnOff.set(true);
        } else if (ctrlMap[midiNumber] === "sust_off") {
          sustainOnOff.set(false);
        } else if (ctrlMap[midiNumber] === "soft_on") {
          softOnOff.set(true);
        } else if (ctrlMap[midiNumber] === "soft_off") {
          softOnOff.set(false);
        }
      }
    } else if (msgType === "Set Tempo" && get(useMidiTempoEventsOnOff)) {
      // XXX Recalculate expressions when user changes the tempo coefficient?
      const newTempo = data * get(tempoCoefficient);
      midiSamplePlayer.setTempo(newTempo);
    }
  };
};

export {
  buildTempoMap,
  buildPedalingMap,
  buildNotesMap,
  buildNoteVelocitiesMap,
  buildMidiEventHandler,
};
