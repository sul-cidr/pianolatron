/* eslint-disable camelcase */

import { get } from "svelte/store";
import IntervalTree from "node-interval-tree";
import {
  bassExpCurve,
  expressionParameters,
  playExpressionsOnOff,
  rollMetadata,
  rollPedalingOnOff,
  tempoCoefficient,
  trebleExpCurve,
  ticksPerSecond,
  useMidiTempoEventsOnOff,
} from "../../stores";
import { NoteSource } from "../../lib/utils";
import { rollProfile } from "../../config/roll-config";
import { getHoleType } from "../../lib/hole-data";

export default class InAppExpressionizer {
  #rollType = get(rollMetadata).ROLL_TYPE;
  #midiTPQ = get(rollMetadata).TICKS_PER_QUARTER;

  defaultTempo = 60;
  defaultNoteVelocity = 64;

  midiSoftPedal = 67;
  midiSustPedal = 64;

  ctrlMap = rollProfile[this.#rollType].ctrlMap;

  metadataTrack;
  bassNotesTrack;
  trebleNotesTrack;
  bassControlsTrack;
  trebleControlsTrack;

  expKeyToHydration = {
    welte_p: { alias: "p velocity", min: 0, max: 127, step: 1 },
    welte_mf: { alias: "mf velocity", min: 0, max: 127, step: 1 },
    welte_f: { alias: "ff velocity", min: 0, max: 127, step: 1 },
    welte_loud: { alias: "f velocity", min: 0, max: 127, step: 1 },
    left_adjust: { alias: "+/- bass velocity", min: -127, max: 127, step: 1 },
    slow_decay_rate: {
      alias: "slow decresc (ms/vel)",
      min: 1,
      max: 4000,
      step: 10,
    },
    fastC_decay_rate: {
      alias: "fast cresc (ms/vel)",
      min: 1,
      max: 1000,
      step: 10,
    },
    fastD_decay_rate: {
      alias: "fast decresc (ms/vel)",
      min: 1,
      max: 1000,
      step: 10,
    },
    tracker_diameter: {
      alias: "trackerbar height (mm)",
      min: 5,
      max: 25,
      step: 0.1,
    },
    punch_ext_ratio: {
      alias: "tracker extension ratio",
      min: 0,
      max: 1,
      step: 0.05,
    },
    accelFtPerMin2: {
      alias: "acceleration (ft/min^2)",
      min: 0,
      max: 1,
      step: 0.01,
    },
    theme_extent: {
      alias: "theme extension (ms +/-)",
      min: 0,
      max: 100,
      step: 1,
    },
    snakebite_extension: {
      alias: "accent extension (ms +/-)",
      min: 0,
      max: 1000,
      step: 1,
    },
  };

  // The point here is to apply the parameter templates above to all applicable
  //  roll types, but allow the settings for each specific roll type to override
  //  these values. Probably that could be done instead with some kind of class
  //  inheritance setup, but this is OK for now.
  hydrateExpressionParams = (tunableParams) => {
    const hydratedParams = {};
    const tunableKeys = Object.keys(tunableParams);
    for (let i = 0; i < tunableKeys.length; i += 1) {
      const thisKey = tunableKeys[i];
      hydratedParams[thisKey] = tunableParams[thisKey];
      if (thisKey in this.expKeyToHydration) {
        const hydrations = this.expKeyToHydration[thisKey];
        const hydrationKeys = Object.keys(hydrations);
        for (let j = 0; j < hydrationKeys.length; j += 1) {
          const hydrationKey = hydrationKeys[j];
          if (!(hydrationKey in hydratedParams[thisKey])) {
            hydratedParams[thisKey][hydrationKey] =
              this.expKeyToHydration[thisKey][hydrationKey];
          }
        }
      }
    }
    return hydratedParams;
  };

  // ?Needs looking at...
  convertTicksAndTime = (input, target) => {
    let wanted = target;
    // The == is necessary (but probably should be refactored out)
    if (wanted == null) wanted = "time";

    if (!get(useMidiTempoEventsOnOff)) {
      if (wanted === "time") {
        return (parseFloat(input) / this.#midiTPQ) * 1000;
      }
      if (wanted === "tick") {
        return parseInt((input * this.#midiTPQ) / 1000, 10);
      }
    }

    let lastTime = 0.0;
    let lastTick = 0;
    let tempo = this.defaultTempo;
    let ticksPerSecond = 0;
    let ticksAtLastTempo = 0;
    let timeAtLastTempo = 0;

    const intervals = Array.from(this.tempoMap.inOrder());

    Object.values(intervals).every((interval) => {
      tempo = interval.data;
      ticksPerSecond = (parseFloat(tempo) * this.#midiTPQ) / 60.0;

      if (wanted === "time" && interval.high > input) {
        ticksAtLastTempo = input - lastTick;
        timeAtLastTempo = (ticksAtLastTempo / ticksPerSecond) * 1000;
        lastTime += timeAtLastTempo;
        return false;
      }
      ticksAtLastTempo = parseFloat(interval.high - interval.low);
      timeAtLastTempo = (ticksAtLastTempo / ticksPerSecond) * 1000;
      if (wanted === "tick" && lastTime + timeAtLastTempo > input) {
        timeAtLastTempo = input - lastTime;
        ticksAtLastTempo = parseInt(
          (timeAtLastTempo * ticksPerSecond) / 1000,
          10,
        );
        lastTick += ticksAtLastTempo;
        return false;
      }
      lastTime += timeAtLastTempo;
      lastTick = interval.high;
      return true;
    });

    if (wanted === "time") {
      return lastTime;
    }
    if (wanted === "tick") {
      return lastTick;
    }
    return null;
  };

  getTempoAtTick = (tick) =>
    !get(useMidiTempoEventsOnOff)
      ? this.defaultTempo
      : this.tempoMap.search(tick, tick)[0];

  //
  // =========================================================================
  // ==  Constructor  ==
  // =========================================================================
  constructor(midiSamplePlayer, startNote, stopNote) {
    this.midiSamplePlayer = midiSamplePlayer;
    this.startNote = startNote;
    this.stopNote = stopNote;

    [
      this.metadataTrack,
      this.bassNotesTrack,
      this.trebleNotesTrack,
      this.bassControlsTrack,
      this.trebleControlsTrack,
    ] = midiSamplePlayer.events;
  }

  initializeExpressionizer() {
    if (!Object.keys(get(expressionParameters)).length)
      expressionParameters.set(this.defaultExpressionParams);

    this.expParams = this.computeDerivedExpressionParams();

    this.tempoMap = this.#buildTempoMap();
    this.noteVelocitiesMap = this.buildNoteVelocitiesMap();
    this.pedalingMap = this.buildPedalingMap();
    this.notesMap = this.#buildNotesMap();
  }

  // ?NOTE: should be good for (at least) welte-red and welte-green
  #buildTempoMap = () => {
    // It's possible for the note MIDI file to include tempo events that
    //  emulate roll acceleration, just as expression MIDI files do. It is
    //  preferable however to emulate roll acceleration for in-app expression
    //  by building a tempo map directly within the app.
    const tempoMap = new IntervalTree();

    const lengthPPI = 300; // scan resolution should always be 300ppi
    const ticksPerFt = lengthPPI * 12.0;
    const minuteDiv = 0.1; // governs how often the tempo is updated
    const startSpeed = (this.#midiTPQ * this.defaultTempo) / ticksPerFt;

    let tempo = this.defaultTempo;
    let speed = startSpeed;
    let minute = 0.0;
    let tick = 0;
    let nextTempo = this.defaultTempo;
    let nextTick = 0;

    // The acceleration emulation *could* begin at the very start of the roll
    //  (well above the first hole), but in any case the rate is assumed to be
    //  constant, so it makes sense just assume that the roll reaches the
    //  default tempo right at the first hole.
    while (
      tick <
      get(rollMetadata).IMAGE_LENGTH - get(rollMetadata).FIRST_HOLE
    ) {
      minute += minuteDiv;
      nextTick = tick + parseInt(speed * minuteDiv * ticksPerFt, 10);
      speed = startSpeed + minute * this.expParams.tunable.accelFtPerMin2.value;
      nextTempo = (speed * ticksPerFt) / this.#midiTPQ;
      tempoMap.insert(tick, nextTick, tempo);
      tick = nextTick;
      tempo = nextTempo;
    }

    // This ensures that searches at the very end of the tempo map never "miss"
    tempoMap.insert(tick, Infinity, tempo);

    return tempoMap;
  };

  buildNoteVelocitiesMap = () => {
    const expressionMap = {};

    const buildPanExpMap = (noteTrackMsgs, ctrlTrackMsgs, adjust) => {
      const expressionCurve = [];

      // First build the velocity expression map from the control track only
      const [panExpMap, expState] = ctrlTrackMsgs
        .filter(({ name }) => name === "Note on")
        .map(this.extendControlHoles)
        // Adding the tracker extension ticks to the ends of the fast cresc/
        //  decresc holes can result in unordered events, so resort them.
        .sort((a, b) => a.tick - b.tick)
        .reduce(this.panExpMapReducer, [
          new IntervalTree(),
          { ...this.startingExpState },
        ]);

      // Extend the expression map so that it extends from the last control hole
      //  to the final note on this side of the roll (if needed)
      const finalTick = Math.max(
        noteTrackMsgs[noteTrackMsgs.length - 1].tick,
        ctrlTrackMsgs[ctrlTrackMsgs.length - 1].tick,
      );
      const finalTime = this.convertTicksAndTime(finalTick);
      const finalPanVelocity = this.getVelocityAtTime(finalTime, expState);

      if (finalTime > expState.time) {
        panExpMap.insert(expState.time, finalTime, [
          expState.velocity,
          finalPanVelocity,
          expState.time,
          finalTime,
        ]);
      }

      // Update the expressionMap with velocities for the note events
      noteTrackMsgs
        .filter(({ name, velocity }) => name === "Note on" && !!velocity)
        .forEach(({ noteNumber: midiNumber, tick }) => {
          const msgTime = this.convertTicksAndTime(tick);

          const [startVelocity, endVelocity, startTime, endTime] =
            panExpMap.search(msgTime, msgTime)[0];

          const notePositionInInterval =
            (msgTime - startTime) / (endTime - startTime);

          const noteVelocity =
            startVelocity +
            (endVelocity - startVelocity) * notePositionInInterval;

          if (tick in expressionMap) {
            expressionMap[tick][midiNumber] = noteVelocity + adjust;
          } else {
            expressionMap[tick] = {};
            expressionMap[tick][midiNumber] = noteVelocity + adjust;
          }
        });

      // Build the expression curve, which uses ticks (not ms)
      const intervals = Array.from(panExpMap.inOrder());
      Object.values(intervals).forEach((interval) => {
        const expStartTick = this.convertTicksAndTime(interval.low, "tick");
        const expEndTick = this.convertTicksAndTime(interval.high, "tick");
        const [startVelocity, endVelocity, startTime, endTime] = interval.data;

        expressionCurve.push([expStartTick, startVelocity, startTime]);
        expressionCurve.push([expEndTick, endVelocity, endTime]);
      });

      expressionCurve.push([finalTick, finalPanVelocity, finalTime]);

      return expressionCurve;
    };

    bassExpCurve.set(
      buildPanExpMap(
        this.bassNotesTrack,
        this.bassControlsTrack,
        this.expParams.tunable.left_adjust.value,
      ),
    );

    trebleExpCurve.set(
      buildPanExpMap(this.trebleNotesTrack, this.trebleControlsTrack, 0),
    );

    return expressionMap;
  };

  #buildNotesMap = () => {
    const _notesMap = new IntervalTree();
    [this.bassNotesTrack, this.trebleNotesTrack].forEach((track) => {
      const tickOn = {};
      track
        .filter(
          ({ name, noteNumber }) =>
            name === "Note on" &&
            getHoleType({ m: noteNumber }, this.#rollType) === "note",
        )
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
    name: msgType,
    noteNumber: midiNumber,
    velocity,
    data,
    tick,
  }) => {
    const tempo = this.getTempoAtTick(tick);

    const playerTempo = tempo * get(tempoCoefficient);
    if (this.midiSamplePlayer.tempo !== playerTempo) {
      this.midiSamplePlayer.pause();
      this.midiSamplePlayer.setTempo(playerTempo);
      ticksPerSecond.set(
        (this.midiSamplePlayer.division * this.midiSamplePlayer.tempo) / 60,
      );
      this.midiSamplePlayer.play();
    }

    if (msgType === "Note on") {
      const holeType = getHoleType({ m: midiNumber }, this.#rollType);
      if (holeType === "note") {
        if (velocity === 0) {
          const ticksPerSec = (parseFloat(tempo) * this.#midiTPQ) / 60.0;
          const trackerExtensionSeconds =
            this.expParams.tracker_extension / ticksPerSec;
          this.stopNote(
            midiNumber,
            NoteSource.Midi,
            `+${trackerExtensionSeconds}`,
          );
        } else {
          const noteVelocity = get(playExpressionsOnOff)
            ? this.noteVelocitiesMap[tick]?.[midiNumber] || velocity
            : this.defaultNoteVelocity;
          this.startNote(midiNumber, noteVelocity, NoteSource.Midi);
        }
      } else if (holeType === "pedal" && get(rollPedalingOnOff)) {
        this.handlePedal(velocity, midiNumber);
      }
    } else if (msgType === "Set Tempo" && get(useMidiTempoEventsOnOff)) {
      // This only happens if the note MIDI contains tempo events to emulate
      //  acceleration. Usually this is not done, but for now, those events
      //  will be enacted and thus override the in-app tempoMap if present.
      //  Note also that note MIDI files with no embedded tempo events for
      //  acceleration emulation still are likely have one tempo event at the
      //  beginning that sets the starting tempo, usually to a default of 60.
      const newTempo = data * get(tempoCoefficient);
      this.midiSamplePlayer.setTempo(newTempo);
      ticksPerSecond.set(
        (this.midiSamplePlayer.division * this.midiSamplePlayer.tempo) / 60,
      );
    }
  };
}
