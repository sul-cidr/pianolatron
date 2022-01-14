<script>
  import { onMount } from "svelte";
  import { clamp } from "../lib/utils";
  import { notify } from "../ui-components/Notification.svelte";
  import { midiInputs, midiOutputs } from "../stores";

  export let startNote;
  export let stopNote;
  export let toggleSustain;
  export let toggleSoft;

  const midiBytes = {
    NOTE_ON: 0x90, // = the event code (0x90) + channel (0)
    NOTE_OFF: 0x80,
    CONTROLLER: 0xb0,
    SUSTAIN: 0x40,
    SOFT: 0x43,
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

  const updatePorts = (midi) => {
    $midiInputs = [...midi.inputs]
      .filter(([, input]) => input.state === "connected")
      .map(([, input]) => input);

    $midiOutputs = [...midi.outputs]
      .filter(([, input]) => input.state === "connected")
      .map(([, output]) => output);

    $midiInputs.forEach((input) => {
      if (input.onmidimessage === null)
        input.addEventListener("midimessage", receiveMidiMsg);
    });
  };

  onMount(() => {
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then((midi) => {
        updatePorts(midi);
        midi.onstatechange = () => updatePorts(midi);
      });
    }

    return () => {
      $midiInputs.forEach((input) =>
        input.removeEventListener("midimessage", receiveMidiMsg),
      );
    };
  });

  export { sendMidiMsg };
</script>
