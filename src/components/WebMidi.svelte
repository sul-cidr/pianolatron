<script>
  import { onMount } from "svelte";
  import { Midi } from "@tonejs/midi";
  import { clamp, NoteSource } from "../lib/utils";
  import { rollProfile } from "../config/roll-config";
  import {
    midiInputs,
    midiOutputs,
    recordingOnOff,
    recordingInBuffer,
    rollMetadata,
    expressionBox,
  } from "../stores";

  export let metadata;
  export let startNote;
  export let stopNote;
  export let toggleSustain;
  export let toggleSoft;

  let mediaAccess = null;
  let recordingStartTime = null;
  let heldDown = {};
  let eventsByTime = {};

  const midiBytes = {
    NOTE_ON: 0x90, // = the event code (0x90) + channel (0)
    NOTE_OFF: 0x80,
    CONTROLLER: 0xb0,
    SUSTAIN: 0x40,
    SOFT: 0x43,
  };

  const startPauseRecording = (onOff) => {
    if (onOff) {
      $recordingInBuffer = true;
      const now = Date.now();
      if (!recordingStartTime) recordingStartTime = now;
    }
  };

  const clearRecording = () => {
    $recordingOnOff = false;
    $recordingInBuffer = false;
    recordingStartTime = null;
    eventsByTime = {};
    heldDown = {};
  };

  const midiDataExport = (midi) => {
    // Create an ephemeral download link for the MIDI data and click it
    const clipName = `${$rollMetadata.DRUID}-${new Date().toISOString()}`;
    const midiBlob = new Blob([midi.toArray()], { type: "audio/midi" });
    const midiURL = window.URL.createObjectURL(midiBlob);
    const element = document.createElement("a");
    element.setAttribute("href", midiURL);
    element.setAttribute("download", `${clipName}.mid`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(midiURL);
  };

  const exportRecording = () => {
    // Build a ToneJS MIDI instance from the note and pedal events in the
    //  recording buffer.

    // ToneJS MIDI uses ticks per beat/quarter = 480, which differs a bit from
    //  the Pianolatron's input MIDI files. This setting is a bit cumbersome to
    //  change, although we do it below for the in-app expression MIDI export.
    //  But there's no need to do it for the "live" recordings here, as the
    //  point is to record spontaneous performances, not to audition different
    //  expression MIDI settings.
    // const ticksPerSecond = 480;

    const midi = new Midi();
    midi.name = metadata.searchtitle;
    const track = midi.addTrack();

    Object.keys(eventsByTime)
      .sort()
      .forEach((time) => {
        // ToneJS MIDI can work with seconds as start/end values, but this is
        //  how we'd convert them to ticks if we wanted to.
        // const startTick = parseInt(
        //   ((parseInt(time, 10) - recordingStartTime) / 1000) * ticksPerSecond,
        //   10,
        // );
        eventsByTime[time].forEach((event) => {
          // const durationInTicks = parseInt(
          //   (event[2] / 1000) * ticksPerSecond,
          //   10,
          // );
          if (event[0] === "NOTE") {
            track.addNote({
              midi: event[1],
              time: (parseInt(time, 10) - recordingStartTime) / 1000,
              duration: event[2] / 1000,
              velocity: event[3],
            });
            // Controller events don't have durations in the ToneJS MIDI
            //  implementation, so we need to add an explicit OFF event
            //  for each pedal event.
          } else if (event[0] === "CONTROLLER") {
            // Pedal on event
            track.addCC({
              number:
                event[1] === "SUSTAIN" ? midiBytes.SUSTAIN : midiBytes.SOFT,
              time: (parseInt(time, 10) - recordingStartTime) / 1000,
              value: 1,
            });
            // Pedal off event
            track.addCC({
              number:
                event[1] === "SUSTAIN" ? midiBytes.SUSTAIN : midiBytes.SOFT,
              time:
                (parseInt(time, 10) - recordingStartTime) / 1000 +
                event[2] / 1000,
              value: 0,
            });
          }
        });
      });

    midiDataExport(midi);
  };

  const exportInAppMIDI = () => {
    // Build a ToneJS MIDI instance from the note, pedal and tempo intervals
    //  and values that were calculated using the current expression box
    //  settings when the roll was loaded (and that update whenever the
    //  expression settings are changed).
    const tempoIntervals = Array.from($expressionBox.tempoMap.inOrder());
    const pedalIntervals = Array.from($expressionBox.pedalingMap.inOrder());
    const noteIntervals = Array.from($expressionBox.notesMap.inOrder());

    const midiJSON = {
      header: {
        name: metadata.searchtitle,
        ppq: $rollMetadata.TICKS_PER_QUARTER,
        tempos: [],
        timeSignatures: [], // required but empty
        keySignatures: [], // required but empty
        meta: [],
      },
    };

    // We can dump as much metadata into the "meta" track as we like
    ["title", "composer", "performer", "label"].forEach((metadataKey) => {
      midiJSON.header.meta.push({
        text: `${metadataKey}: ${metadata[metadataKey]}`,
        ticks: 0,
        type: "text",
      });
    });

    Object.entries($rollMetadata).forEach((key, value) => {
      midiJSON.header.meta.push({
        text: `${key}: ${value}`,
        ticks: 0,
        type: "text",
      });
    });

    // Probably it makes sense to record the expression settings that produced
    //  this MIDI output (although they also can be exported as JSON via the app)
    Object.entries($expressionBox.expParams.tunable).forEach((key, value) => {
      midiJSON.header.meta.push({
        text: `${key}: ${value}`,
        ticks: 0,
        type: "text",
      });
    });

    midiJSON.tracks = [
      {
        channel: 0,
        instrument: {
          family: "piano",
          name: "acoustic grand piano",
          number: 0,
        },
        name: "Piano right",
        notes: [],
        controlChanges: { [midiBytes.SUSTAIN]: [], [midiBytes.SOFT]: [] },
      },
      {
        channel: 0,
        instrument: {
          family: "piano",
          name: "acoustic grand piano",
          number: 0,
        },
        name: "Piano left",
        notes: [],
        controlChanges: { [midiBytes.SUSTAIN]: [], [midiBytes.SOFT]: [] },
      },
    ];

    noteIntervals.forEach((noteInterval) => {
      // Allocate note events between left and right keyboard pans, based on
      //  the dividing point between the bass and treble expression mechanisms
      //  for the current roll type (which is generally not middle C!)
      midiJSON.tracks[
        noteInterval.data >=
        rollProfile[$rollMetadata.ROLL_TYPE].trebleNotesBegin
          ? 0
          : 1
      ].notes.push({
        durationTicks: noteInterval.high - noteInterval.low,
        midi: noteInterval.data,
        ticks: noteInterval.low,
        velocity: Math.round(
          $expressionBox.noteVelocitiesMap[noteInterval.low][noteInterval.data],
        ),
      });
    });

    // Pedal events should be replicated on both piano tracks (bass/treble)
    pedalIntervals.forEach((pedalInterval) => {
      midiJSON.tracks.forEach((midiTrack) => {
        midiTrack.controlChanges[pedalInterval.data].push({
          number: pedalInterval.data,
          ticks: pedalInterval.low,
          value: 1,
        });
        midiTrack.controlChanges[pedalInterval.data].push({
          number: pedalInterval.data,
          ticks: pedalInterval.high,
          value: 0,
        });
      });
    });

    tempoIntervals.forEach((tempoInterval) => {
      midiJSON.header.tempos.push({
        ticks: tempoInterval.low,
        bpm: Math.round(tempoInterval.data),
      });
    });

    const midi = new Midi();
    midi.fromJSON(midiJSON);
    midiDataExport(midi);
  };

  const sendMidiMsg = (msgType, entity, value) => {
    const msg = [
      midiBytes[msgType],
      midiBytes[entity] || entity,
      clamp(parseInt(value * 127, 10), 0, 127),
    ];
    $midiOutputs.forEach((output) => output.send(msg));
    if ($recordingOnOff) {
      const now = Date.now();
      if (msgType === "NOTE_ON" && !(entity in heldDown)) {
        heldDown[entity] = [now, value];
      } else if (msgType === "NOTE_OFF" && entity in heldDown) {
        const startTime = heldDown[entity][0];
        const duration = now - startTime;
        const event = ["NOTE", entity, duration, heldDown[entity][1]];
        if (startTime in eventsByTime && eventsByTime[startTime].length) {
          eventsByTime[startTime].push(event);
        } else {
          eventsByTime[startTime] = [event];
        }
        delete heldDown[entity];
      } else if (msgType === "CONTROLLER") {
        if (value && !(entity in heldDown)) {
          heldDown[entity] = [now, 1];
        } else if (value === false && entity in heldDown) {
          const startTime = heldDown[entity][0];
          const duration = now - startTime;
          const event = ["CONTROLLER", entity, duration, heldDown[entity][1]];
          if (startTime in eventsByTime && eventsByTime[startTime].length) {
            eventsByTime[startTime].push(event);
          } else {
            eventsByTime[startTime] = [event];
          }
          delete heldDown[entity];
        }
      }
    }
  };

  const receiveMidiMsg = ({ data: [msgType, entity, value] }) => {
    if (!entity) return;

    switch (msgType) {
      case midiBytes.CONTROLLER:
        switch (entity) {
          case midiBytes.SUSTAIN:
            toggleSustain(!!parseInt(value, 10), /* fromMidi = */ true);
            break;

          case midiBytes.SOFT:
            toggleSoft(!!parseInt(value, 10), /* fromMidi = */ true);
            break;

          default:
        }

        break;

      case midiBytes.NOTE_ON:
        if (value === 0) {
          stopNote(entity, /* fromMidi = */ true);
        } else {
          startNote(
            entity,
            parseInt((parseFloat(value) / 127) * 100, 10),
            NoteSource.WebMidi,
          );
        }
        break;

      case midiBytes.NOTE_OFF:
        stopNote(entity, NoteSource.WebMidi);
        break;

      default:
    }
  };

  const initializePorts = () => {
    if (!mediaAccess) return;
    $midiInputs = [...mediaAccess.inputs]
      .filter(([, input]) => input.state === "connected")
      .map(([, input]) => input);

    $midiOutputs = [...mediaAccess.outputs]
      .filter(([, input]) => input.state === "connected")
      .map(([, output]) => output);

    $midiInputs.forEach((input) => {
      input.addEventListener("midimessage", receiveMidiMsg);
    });
  };

  const midiStateChange = ({ port }) => {
    if (port instanceof MIDIInput) {
      if (port.state === "connected" && !$midiInputs.includes(port)) {
        port.addEventListener("midimessage", receiveMidiMsg);
        midiInputs.update((v) => [...v, port]);
      }
      if (port.state === "disconnected") {
        port.removeEventListener("midimessage", receiveMidiMsg);
        midiInputs.update((v) => v.filter((p) => p !== port));
      }
    }
    if (port instanceof MIDIOutput) {
      if (port.state === "connected" && !$midiOutputs.includes(port)) {
        midiOutputs.update((v) => [...v, port]);
      }
      if (port.state === "disconnected") {
        midiOutputs.update((v) => v.filter((p) => p !== port));
      }
    }
  };

  onMount(() => {
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then((midi) => {
        mediaAccess = midi;
        initializePorts();
        mediaAccess.addEventListener("statechange", midiStateChange);
      });
    }

    return () => {
      if (mediaAccess)
        mediaAccess.removeEventListener("statechange", midiStateChange);
      $midiInputs.forEach((input) => {
        input.removeEventListener("midimessage", receiveMidiMsg);
      });
    };
  });

  $: startPauseRecording($recordingOnOff);

  export { sendMidiMsg, exportRecording, clearRecording, exportInAppMIDI };
</script>
