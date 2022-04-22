import { get } from "svelte/store";
import IntervalTree from "node-interval-tree";
import { clamp, getHoleType } from "../lib/utils";

import {
  activeNotes,
  rollPedalingOnOff,
  softOnOff,
  sustainOnOff,
  tempoCoefficient,
  useMidiTempoEventsOnOff,
  playExpressionsOnOff,
  bassExpCurve,
  trebleExpCurve,
  expressionParameters,
  noteVelocitiesMap,
} from "../stores";

export default class Expressionizer {
  metadataTrack;
  musicTracks;

  trackerExtension = 0;

  rollType = "welte-red";

  rollProfile = {
    bassCtrlBegin: 14,
    bassCtrlEnd: 23,
    bassNotesBegin: 24,
    bassNotesEnd: 66,
    trebleNotesBegin: 67,
    trebleNotesEnd: 103,
    trebleCtrlBegin: 104,
    trebleCtrlEnd: 113,
  };

  ctrlMap = {
    14: "mf_off",
    15: "mf_on",
    16: "cresc_off",
    17: "cresc_on",
    18: "sf_off",
    19: "sf_on",
    20: "soft_off",
    21: "soft_on",
    22: "motor_off",
    23: "motor_on",
    104: "rewind",
    105: "elec_off",
    106: "sust_on",
    107: "sust_off",
    108: "sf_on",
    109: "sf_off",
    110: "cresc_on",
    111: "cresc_off",
    112: "mf_on",
    113: "mf_off",
  };

  midiSoftOn = 21;
  midiSoftOff = 20;
  midiSustOn = 106;
  midiSustOff = 107;

  expressionParams = {
    welteP: 35.0,
    welteMf: 60.0,
    welteF: 90.0,
    welteLoud: 75.0,
    leftAdjust: -5.0,
    crescRate: 1.0,
    slowDecayRate: 2380, // Probably this is 1 velocity step in 2.38s
    fastCDecayRate: 300,
    fastDDecayRate: 400,
  };

  expressionStateDefaults = {
    velocity: 0.0, // Velocity at last cresc/decresc event
    time: 0.0, // Time (in ms) at last cresc/decresc event
    mfStart: null,
    slowCrescStart: null,
    slowDecrescStart: null,
    fastCrescStart: null,
    fastCrescStop: null, // Can be in the future due to tracker extension
    fastDecrescStart: null,
    fastDecrescStop: null,
    tempo: null,
    tick: 0,
  };

  constructor(midiSamplePlayer, defaultTempo = 60) {
    this.midiSamplePlayer = midiSamplePlayer;
    [this.metadataTrack, ...this.musicTracks] = midiSamplePlayer.events;
    this.defaultTempo = defaultTempo;

    // TODO: refactor
    this.expressionParams.slowStep =
      (this.expressionParams.welteMf - this.expressionParams.welteP) /
      this.expressionParams.slowDecayRate;
    this.expressionParams.fastCStep =
      (this.expressionParams.welteMf - this.expressionParams.welteP) /
      this.expressionParams.fastCDecayRate;
    this.expressionParams.fastDStep =
      -(this.expressionParams.welteF - this.expressionParams.welteP) /
      this.expressionParams.fastDDecayRate;

    this.tempoMap = this.buildTempoMap();
    this.noteVelocitiesMap = this.buildNoteVelocitiesMap();
    this.pedalingMap = this.buildPedalingMap();
    this.notesMap = this.buildNotesMap();
  }

  buildTempoMap = () =>
    this.metadataTrack
      .filter((event) => event.name === "Set Tempo")
      .reduce((_tempoMap, { tick, data }) => {
        if (!_tempoMap.map(([, _data]) => _data).includes(data))
          _tempoMap.push([tick, data]);
        return _tempoMap;
      }, []);

  buildPedalingMap = () => {
    /* Builds a map of pedal events, where each key is the tick of the event
     *  and the value is an object with keys of the pedal on and off events. */
    const _pedalingMap = new IntervalTree();

    const registerPedalEvents = (track, pedalOn, pedalOff) => {
      let tickOn = false;
      track
        // Register beginning of holes for lock-and-cancel expression mechanisms
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

    // Get pedal events from track 2 (bass control = soft pedal) and
    //  track 3 (treble control = sustain pedal)
    registerPedalEvents(this.musicTracks[2], this.midiSoftOn, this.midiSoftOff);
    registerPedalEvents(this.musicTracks[3], this.midiSustOn, this.midiSustOff);

    return _pedalingMap;
  };

  buildNoteVelocitiesMap = () => {
    const midiTPQ = this.midiSamplePlayer.getDivision().division;

    const noteVelocitiesMap = {};

    const buildPanExpMap = (noteTrackMsgs, ctrlTrackMsgs, adjust) => {
      const expressionCurve = [];
      const expressionState = { ...this.expressionStateDefaults };

      expressionState.velocity = this.expressionParams.welteP;

      const panMsgs = ctrlTrackMsgs
        .filter(({ name }) => name === "Note on")
        .concat(
          noteTrackMsgs.filter(
            ({ name, velocity }) => name === "Note on" && !!velocity,
          ),
        )
        .sort((a, b) => (a.tick > b.tick ? 1 : -1));

      panMsgs.forEach(({ noteNumber: midiNumber, velocity, tick }) => {
        const ticksPerSecond = (this.getTempoAtTick(tick) * midiTPQ) / 60.0;
        const msgTime =
          expressionState.time +
          ((tick - expressionState.tick) / ticksPerSecond) * 1000;

        const holeType = getHoleType({ m: midiNumber }, this.rollType);

        if (holeType === "note") {
          // Only apply adjustment (if at all) on the external (played)
          // velocities, not the internally stored/computed expressions
          const noteVelocity =
            this.getVelocityAtTime(msgTime, expressionState) + adjust;

          if (tick in noteVelocitiesMap) {
            noteVelocitiesMap[tick][midiNumber] = noteVelocity;
          } else {
            noteVelocitiesMap[tick] = {};
            noteVelocitiesMap[tick][midiNumber] = noteVelocity;
          }
        } else if (holeType === "control") {
          const ctrlFunc = this.ctrlMap[midiNumber];

          if (velocity === 0 && !["sf_on", "sf_off"].includes(ctrlFunc)) {
            return;
          }

          const panVelocity = this.getVelocityAtTime(msgTime, expressionState);

          const trackerExtensionSeconds =
            this.trackerExtension / ticksPerSecond;

          if (ctrlFunc === "mf_on" && velocity > 0) {
            expressionState.mfStart = msgTime;
          } else if (ctrlFunc === "mf_off" && velocity > 0) {
            expressionState.mfStart = null;
          } else if (ctrlFunc === "cresc_on" && velocity > 0) {
            expressionState.slowCrescStart = msgTime;
            expressionState.slowDecrescStart = null;
          } else if (ctrlFunc === "cresc_off" && velocity > 0) {
            expressionState.slowCrescStart = null;
            expressionState.slowDecrescStart = msgTime;
          } else if (ctrlFunc === "sf_on") {
            if (velocity > 0) {
              expressionState.fastCrescStart = msgTime;
              expressionState.fastCrescStop = null;
            } else {
              expressionState.fastCrescStop =
                msgTime + trackerExtensionSeconds * 1000.0;
            }
          } else if (ctrlFunc === "sf_off") {
            if (velocity > 0) {
              expressionState.fastDecrescStart = msgTime;
              expressionState.fastDecrescStop = null;
            } else {
              expressionState.fastDecrescStop =
                msgTime + trackerExtensionSeconds * 1000.0;
            }
          }
          expressionState.tick = tick;
          expressionState.time = msgTime;
          expressionState.velocity = panVelocity;
          expressionCurve.push([tick, panVelocity]);
        }
      });
      return expressionCurve;
    };

    // bass notes and control holes
    this.bassExpCurve = buildPanExpMap(
      this.musicTracks[0],
      this.musicTracks[2],
      this.expressionParams.leftAdjust,
    );

    // treble notes and control holes
    this.trebleExpCurve = buildPanExpMap(
      this.musicTracks[1],
      this.musicTracks[3],
      0,
    );

    return noteVelocitiesMap;
  };

  buildNotesMap = () => {
    const notesMap = new IntervalTree();

    const registerNoteEvents = (track) => {
      const tickOn = {};
      track
        // The beginning of a note has velocity=1, end is velocity=0
        .filter(
          ({ name, noteNumber }) =>
            name === "Note on" &&
            getHoleType({ m: noteNumber }, this.rollType) === "note",
        )
        .forEach(({ noteNumber, velocity, tick }) => {
          if (velocity === 0) {
            if (noteNumber in tickOn) {
              notesMap.insert(tickOn[noteNumber], tick, noteNumber);
              delete tickOn[noteNumber];
            }
          } else if (!(noteNumber in tickOn)) tickOn[noteNumber] = tick;
        });
    };

    registerNoteEvents(this.musicTracks[0]);
    registerNoteEvents(this.musicTracks[1]);

    return notesMap;
  };

  getTempoAtTick = (tick) => {
    let tempo;
    let i = 0;
    while (this.tempoMap[i][0] <= tick) {
      [, tempo] = this.tempoMap[i];
      i += 1;
      if (i >= this.tempoMap.length) break;
    }
    return tempo;
  };

  getVelocityAtTime = (time, expressionState) => {
    const {
      welteP,
      welteMf,
      welteF,
      welteLoud,
      slowStep,
      fastCStep,
      fastDStep,
    } = this.expressionParams;

    const {
      fastCrescStart,
      fastCrescStop,
      fastDecrescStart,
      fastDecrescStop,
      slowCrescStart,
      mfStart,
      velocity,
      time: stateTime,
    } = expressionState;

    let newVelocity = velocity;

    // XXX What if this crosses an acceleration tempo change?
    const msFromLastDynamic = time - stateTime;

    const isFastCrescOn =
      (fastCrescStart !== null && fastCrescStop === null) ||
      (fastCrescStart !== null &&
        fastCrescStop !== null &&
        fastCrescStop > time);
    const isFastDecrescOn =
      (fastDecrescStart !== null && fastDecrescStop === null) ||
      (fastDecrescStart !== null &&
        fastDecrescStop !== null &&
        fastDecrescStop > time);

    if (slowCrescStart === null && !isFastCrescOn && !isFastDecrescOn) {
      newVelocity -= msFromLastDynamic * slowStep;
    } else {
      newVelocity += slowCrescStart !== null ? msFromLastDynamic * slowStep : 0;
      newVelocity += isFastCrescOn ? msFromLastDynamic * fastCStep : 0;
      newVelocity += isFastDecrescOn ? msFromLastDynamic * fastDStep : 0;
    }

    const velocityDelta = newVelocity - velocity;

    if (mfStart !== null) {
      if (velocity > welteMf) {
        newVelocity =
          velocityDelta < 0
            ? Math.max(welteMf + 0.001, newVelocity)
            : Math.min(welteF, newVelocity);
      } else if (velocity < welteMf) {
        newVelocity =
          velocityDelta > 0
            ? Math.min(welteMf - 0.001, newVelocity)
            : Math.max(welteP, newVelocity);
      }
    } else if (
      slowCrescStart !== null &&
      !isFastCrescOn &&
      velocity < welteLoud
    ) {
      newVelocity = Math.min(newVelocity, welteLoud - 0.001);
    }

    newVelocity = clamp(newVelocity, welteP, welteF);

    return newVelocity;
  };

  buildMidiEventHandler = (startNote, stopNote) => {
    const DEFAULT_NOTE_VELOCITY = 50.0;
    const midiTPQ = this.midiSamplePlayer.getDivision().division;

    return ({
      name: msgType,
      noteNumber: midiNumber,
      velocity,
      data,
      tick,
    }) => {
      if (msgType === "Note on") {
        const holeType = getHoleType({ m: midiNumber }, this.rollType);
        if (holeType === "note") {
          const tempo = this.getTempoAtTick(tick);

          if (velocity === 0) {
            const ticksPerSecond = (parseFloat(tempo) * midiTPQ) / 60.0;
            // ! At 591 TPQ & 60bpm, this is ~.02s, drops slowly due to accel
            const trackerExtensionSeconds =
              this.trackerExtension / ticksPerSecond;
            stopNote(midiNumber, `+${trackerExtensionSeconds}`);
            activeNotes.delete(midiNumber);
          } else {
            const noteVelocity = get(playExpressionsOnOff)
              ? this.noteVelocitiesMap[tick][midiNumber]
              : DEFAULT_NOTE_VELOCITY;
            startNote(midiNumber, noteVelocity);
            activeNotes.add(midiNumber);
          }
        } else if (holeType === "pedal" && get(rollPedalingOnOff)) {
          if (velocity === 0) {
            // Length of pedal control holes doesn't matter for Welte Red
            return;
          }
          if (midiNumber === this.midiSustOn) {
            sustainOnOff.set(true);
          } else if (midiNumber === this.midiSustOff) {
            sustainOnOff.set(false);
          } else if (midiNumber === this.midiSoftOn) {
            softOnOff.set(true);
          } else if (midiNumber === this.midiSoftOff) {
            softOnOff.set(false);
          }
        }
      } else if (msgType === "Set Tempo" && get(useMidiTempoEventsOnOff)) {
        // XXX Recalculate expressions when user changes the tempo coefficient?
        const newTempo = data * get(tempoCoefficient);
        this.midiSamplePlayer.setTempo(newTempo);
      }
    };
  };
}
