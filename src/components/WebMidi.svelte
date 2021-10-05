<script>
  import { onMount } from "svelte";
  import { clamp } from "../lib/utils";
  import { midiInputs, midiOutputs, webMidiEnabled } from "../stores";
  import MidiWriter from "midi-writer-js";
  import {
    rollMetadata,
    sustainOnOff,
    softOnOff,
    recordingOnOff,
    recordingInBuffer,
  } from "../stores";

  export let startNote;
  export let stopNote;
  export let toggleSustain;
  export let toggleSoft;

  let mediaAccess;
  let trackData = null;

  const midiBytes = {
    NOTE_ON: 0x90, // = the event code (0x90) + channel (0)
    NOTE_OFF: 0x80,
    CONTROLLER: 0xb0,
    SUSTAIN: 0x40,
    SOFT: 0x43,
  };

  const startPauseRecording = (onOff) => {
    if (onOff && !trackData) {
      $recordingInBuffer = true;
      trackData = new MidiWriter.Track();
      trackData.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 1 }));
      trackData.setTempo(60);
      if ($sustainOnOff) trackData.controllerChange(MIDI_SUSTAIN, 127);
      if ($softOnOff) trackData.controllerChange(MIDI_SOFT, 127);
    }
  };

  const exportRecording = () => {
    $recordingOnOff = false;
    //trackData.addEvent(new MidiWriter.EndTrackEvent()); // This doesn't work, for unknown reasons
    const write = new MidiWriter.Writer(trackData);
    console.log($rollMetadata);

    var element = document.createElement("a");
    element.setAttribute("href", write.dataUri());
    element.setAttribute("download", `${$rollMetadata.DRUID}.mid`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    trackData = null;
    $recordingInBuffer = false;
  };

  const sendMidiMsg = (msgType, entity, value) => {
    let msg = [
      midiBytes[msgType],
      midiBytes[entity] || entity,
      clamp(parseInt(value * 127, 10), 0, 127),
    ];
    $midiOutputs.forEach((output) => output.send(msg));
    if (msgType == "note_on") {
      if ($recordingOnOff)
        trackData.addEvent(
          new MidiWriter.NoteOnEvent({
            pitch: entity,
            velocity: clamp(parseInt(value * 127, 10), 0, 127),
          }),
        );
    } else if (msgType == "note_off") {
      if ($recordingOnOff) {
        trackData.addEvent(
          new MidiWriter.NoteOffEvent({
            pitch: entity,
            velocity: 0,
          }),
        );
      }
    } else if (msgType == "controller") {
      if (entity == "sustain") {
        if ($recordingOnOff)
          trackData.controllerChange(MIDI_SUSTAIN, (value ? 1 : 0) * 127);
      } else if (entity == "soft") {
        if ($recordingOnOff)
          trackData.controllerChange(MIDI_SOFT, (value ? 1 : 0) * 127);
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

  export { sendMidiMsg, exportRecording };
</script>
