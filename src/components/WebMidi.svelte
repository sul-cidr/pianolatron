<script>
  import { onMount } from "svelte";
  import { Midi } from "@tonejs/midi";
  import { clamp, NoteSource } from "../lib/utils";
  import {
    midiInputs,
    midiOutputs,
    recordingOnOff,
    recordingInBuffer,
    rollMetadata,
  } from "../stores";

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

  const exportRecording = () => {
    // ToneJS MIDI seems to use ticks per beat/quarter = 480
    // const ticksPerSecond = 480;

    const midi = new Midi();
    midi.name = $rollMetadata.DRUID;
    const track = midi.addTrack();

    Object.keys(eventsByTime)
      .sort()
      .forEach((time) => {
        // ToneJS MIDI can work with seconds as start/end values, so we don't
        // need to work with ticks (and also deal with TPQ values and
        // tempo/acceleration values) unless we really want to.)
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
            // implementation, so we need to add an explicit OFF event
            // for each pedal event.
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

    // The PPQ (TPQ) value is not adjustable for the ToneJS MIDI writer, which
    // means that tempo and acceleration probably will need to be handled
    // differently in recordings compared to how they work in note and
    // expression MIDI files created via the roll image parser and midi2exp
    // toolchain.
    // midi.header.tempos = [{ ticks: 0, bpm: 60 }]; // This can be done
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
        // NOTE that these velocity levels have been affected by the
        // settings in the volume multiplier AND the velocity curves
        // by the time we see them here. We'd need to handle this
        // differently if we wanted the MIDI recording to contain
        // "uninflected" velocities.
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

  export { sendMidiMsg, exportRecording, clearRecording };
</script>
