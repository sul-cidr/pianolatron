<script>
  import { onMount } from "svelte";
  import { clamp } from "../lib/utils";
  import { midiInputs, midiOutputs, webMidiEnabled } from "../stores";
  import MidiWriter from "midi-writer-js";
  import { rollMetadata, recordingOnOff, recordingInBuffer } from "../stores";

  export let startNote;
  export let stopNote;
  export let toggleSustain;
  export let toggleSoft;

  let mediaAccess;
  let trackData = null;
  let recordingStartTime = null;
  let heldDown = new Object();
  let eventsByTime = new Object();

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
      if (!recordingStartTime) recordingStartTime = Date.now();
    }
  };

  const clearRecording = () => {
    trackData = null;
    $recordingInBuffer = false;
    recordingStartTime = null;
    eventsByTime = new Object();
    heldDown = new Object();
  };

  const exportRecording = () => {
    $recordingOnOff = false;

    const tempo = 60.0;
    // midi-writer-js seems to use ticks per beat/quarter = 128
    //const ticksPerSecond = samplePlayer.midiSamplePlayer.division;
    const ticksPerSecond = 128;

    trackData = new MidiWriter.Track();
    trackData.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 1 }));
    trackData.setTempo(tempo);

    Object.keys(eventsByTime)
      .sort()
      .forEach((time) => {
        eventsByTime[time].forEach((event) => {
          if (event[0] == "note") {
            const startTick = parseInt(
              ((parseInt(time) - recordingStartTime) / 1000) * ticksPerSecond,
            );
            const durationInTicks = parseInt(
              (event[2] / 1000) * ticksPerSecond,
            );
            trackData.addEvent(
              new MidiWriter.NoteEvent({
                pitch: event[1],
                startTick: startTick,
                duration: `t${durationInTicks}`,
                velocity: event[3],
              }),
            );
          } else if (event[0] in ["sustain", "soft"]) {
            trackData.controllerChange(
              event[0] === "sustain" ? MIDI_SUSTAIN : MIDI_SOFT,
              event[1],
            );
          }
        });
      });

    //trackData.addEvent(new MidiWriter.EndTrackEvent()); // This doesn't work, for unclear reasons
    const writer = new MidiWriter.Writer(trackData);
    const midiDataURI = writer.dataUri();

    var element = document.createElement("a");
    element.setAttribute("href", midiDataURI);
    element.setAttribute("download", `${$rollMetadata.DRUID}.mid`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    clearRecording();
  };

  const sendMidiMsg = (msgType, entity, value) => {
    let msg = [
      midiBytes[msgType],
      midiBytes[entity] || entity,
      clamp(parseInt(value * 127, 10), 0, 127),
    ];
    $midiOutputs.forEach((output) => output.send(msg));
    if (msgType == "note_on" && $recordingOnOff) {
      trackData.addEvent(
        new MidiWriter.NoteOnEvent({
          pitch: entity,
          velocity: clamp(parseInt(value * 127, 10), 0, 127),
        }),
      );
    } else if (msgType == "note_off" && $recordingOnOff) {
      trackData.addEvent(
        new MidiWriter.NoteOffEvent({
          pitch: entity,
          velocity: 0,
        }),
      );
    } else if (msgType == "controller") {
      if (entity == "sustain" && $recordingOnOff)
        trackData.controllerChange(MIDI_SUSTAIN, (value ? 1 : 0) * 127);
      else if (entity == "soft" && $recordingOnOff)
        trackData.controllerChange(MIDI_SOFT, (value ? 1 : 0) * 127);
      if ($recordingOnOff && !(entity in heldDown))
        heldDown[entity] = [Date.now(), parseInt(value * 100, 10)]; // midi-writer-js uses velocity 1-100 (???)
    } else if (msgType == "note_off" && $recordingOnOff && entity in heldDown) {
      const startTime = heldDown[entity][0];
      const duration = Date.now() - startTime;
      const event = ["note", entity, duration, heldDown[entity][1]];
      eventsByTime[startTime]?.length
        ? eventsByTime[startTime].push(event)
        : (eventsByTime[startTime] = [event]);
      delete heldDown[entity];
    } else if (
      msgType == "controller" &&
      entity in ["sustain", "soft"] &&
      $recordingOnOff
    ) {
      // Control change events (pedal on/off) have no duration
      const event = [entity, (value ? 1 : 0) * 127];
      const startTime = Date.now();
      eventsByTime[startTime]?.length
        ? eventsByTime[startTime].push(event)
        : (eventsByTime[startTime] = [event]);
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
