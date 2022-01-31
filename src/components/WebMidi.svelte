<script>
  import { onMount } from "svelte";
  import MidiWriter from "midi-writer-js";
  import { clamp } from "../lib/utils";
  import { midiInputs, midiOutputs, sustainOnOff, softOnOff } from "../stores";
  import { rollMetadata, recordingOnOff, recordingInBuffer } from "../stores";

  export let startNote;
  export let stopNote;
  export let toggleSustain;
  export let toggleSoft;

  let mediaAccess;
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
      // Register when a pedal is held down at the start of recording -- a
      // legitimate possibilty. Doing the same for held notes, however, is much
      // less likely to be helpeful and is not implemented.
      if ($sustainOnOff) {
        heldDown.SUSTAIN = [now, 127];
      } else if ($softOnOff) {
        heldDown.SOFT = [now, 127];
      }
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
    const tempo = 60.0;
    // midi-writer-js seems to use ticks per beat/quarter = 128
    const ticksPerSecond = 128;

    const trackData = new MidiWriter.Track();
    trackData.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 1 }));
    trackData.setTempo(tempo);

    Object.keys(eventsByTime)
      .sort()
      .forEach((time) => {
        const startTick = parseInt(
          ((parseInt(time, 10) - recordingStartTime) / 1000) * ticksPerSecond,
          10,
        );
        eventsByTime[time].forEach((event) => {
          const durationInTicks = parseInt(
            (event[2] / 1000) * ticksPerSecond,
            10,
          );
          if (event[0] === "NOTE") {
            trackData.addEvent(
              new MidiWriter.NoteEvent({
                pitch: event[1],
                startTick,
                duration: `t${durationInTicks}`,
                velocity: event[3],
              }),
            );
          } else if (event[0] === "CONTROLLER") {
            trackData.addEvent(
              new MidiWriter.ControllerEvent({
                controllerNumber:
                  event[1] === "SUSTAIN" ? midiBytes.SUSTAIN : midiBytes.SOFT,
                startTick,
                duration: `t${durationInTicks}`,
                controllerValue: event[3],
              }),
            );
          }
        });
      });

    trackData.addEvent(new MidiWriter.EndTrackEvent());
    const writer = new MidiWriter.Writer(trackData);
    const midiDataURI = writer.dataUri();

    const element = document.createElement("a");
    element.setAttribute("href", midiDataURI);
    element.setAttribute("download", `${$rollMetadata.DRUID}.mid`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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
        heldDown[entity] = [now, parseInt(value * 100, 10)]; // midi-writer-js uses velocity 1-100 (???)
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
          heldDown[entity] = [now, parseInt(+value * 127, 10)]; // is this the correct range?
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
            /* fromMidi = */ true,
          );
        }
        break;

      case midiBytes.NOTE_OFF:
        stopNote(entity, /* fromMidi = */ true);
        break;

      default:
    }
  };

  const initializePorts = () => {
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
      mediaAccess.removeEventListener("statechange", midiStateChange);
      $midiInputs.forEach((input) => {
        input.removeEventListener("midimessage", receiveMidiMsg);
      });
    };
  });

  $: startPauseRecording($recordingOnOff);

  export { sendMidiMsg, exportRecording, clearRecording };
</script>
