<script>
  import { onMount } from "svelte";
  import { clamp } from "../lib/utils";
  import { notify } from "../ui-components/Notification.svelte";

  export let startNote;
  export let stopNote;
  export let toggleSustain;
  export let toggleSoft;

  let midiOuts = [];

  const midiBytes = {
    NOTE_ON: 0x90, // = the event code (0x90) + channel (0)
    NOTE_OFF: 0x80,
    CONTROLLER: 0xb0,
    SUSTAIN: 0x40,
    SOFT: 0x43,
  };

  const sendMidiMsg = (msgType, entity, value) => {
    midiOuts.forEach((midiOut) =>
      midiOut.send([
        midiBytes[msgType],
        midiBytes[entity] || entity,
        clamp(parseInt(value * 127, 10), 0, 127),
      ]),
    );
  };

  const registerMidiInputs = (midi) => {
    // Respond to input from attached MIDI controllers
    [...midi.inputs].forEach(([, input]) => {
      if (input.onmidimessage !== null) return;
      input.onmidimessage = ({ data: [msgType, entity, value] }) => {
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
    });
  };

  onMount(() => {
    if (navigator.requestMIDIAccess) {
      notify({
        title: "MIDI in/out available",
        message:
          "Connect a digital piano or other MIDI device to send/receive keyboard and pedal events.",
        timeout: 4000,
        closable: true,
      });

      navigator.requestMIDIAccess().then((midi) => {
        registerMidiInputs(midi);
        midiOuts = [...midi.outputs].map(([, output]) => output);
        midi.onstatechange = ({ port }) => {
          // Print information about the (dis)connected MIDI controller
          notify({
            title: "MIDI device change",
            message: `${port.name} ${port.manufacturer} ${port.state}`,
            timeout: 4000,
            closable: true,
          });
          registerMidiInputs(midi);
          midiOuts = [...midi.outputs].map(([, output]) => output);
        };
      });
    } else {
      notify({
        title: "MIDI in/out not available",
        message:
          "This browser does not support connecting to a digital piano or other MIDI device.",
        timeout: 4000,
        closable: true,
      });
    }
  });

  export { sendMidiMsg };
</script>
