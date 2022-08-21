<script>
  import { onMount } from "svelte";
  import { clamp } from "../lib/utils";
  import { midiInputs, midiOutputs } from "../stores";

  export let startNote;
  export let stopNote;
  export let toggleSustain;
  export let toggleSoft;

  let mediaAccess = null;

  const midiBytes = {
    NOTE_ON: 0x90, // = the event code (0x90) + channel (0)
    NOTE_OFF: 0x80,
    CONTROLLER: 0xb0,
    SUSTAIN: 0x40,
    SOFT: 0x43,
  };

  let chunks = [];

  const startPauseRecording = (onOff) => {
    if (onOff && mediaRecorder) {
      mediaRecorder.start();
      $recordingInBuffer = true;
      lastRecordingTime = Date.now();
      recordingLengthUpdateInterval = setInterval(() => {
        const now = Date.now();
        $recordingDuration += now - lastRecordingTime;
        lastRecordingTime = now;
      }, 100);
    } else if (!onOff && mediaRecorder) {
      mediaRecorder.stop();
      clearInterval(recordingLengthUpdateInterval);
      $recordingDuration += Date.now() - lastRecordingTime;
    }
  };

  const clearRecording = () => {
    $recordingDuration = 0;
    $recordingOnOff = false;
    $recordingInBuffer = false;
    chunks = [];
  };

  const exportRecording = () => {
    const clipName = $rollMetadata.DRUID;
    // Allow user to name the clip file before downloading it?
    // let clipName = prompt("Enter a name for your sound clip");
    // .ogg is also available, but sounds a little funky
    const blob = new Blob(chunks, { type: "audio/wav" });
    const audioURL = window.URL.createObjectURL(blob);
    const element = document.createElement("a");
    element.setAttribute("href", audioURL);
    element.setAttribute("download", `${clipName}.wav`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const sendMidiMsg = (msgType, entity, value) => {
    $midiOutputs.forEach((output) =>
      output.send([
        midiBytes[msgType],
        midiBytes[entity] || entity,
        clamp(parseInt(value * 127, 10), 0, 127),
      ]),
    );
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

  export { sendMidiMsg };
</script>
