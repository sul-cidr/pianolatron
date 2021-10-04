<script>
  import { onMount } from "svelte";
  import { notify } from "../ui-components/Notification.svelte";
  import { userSettings } from "../stores";

  export let samplePlayer;

  let midiOuts = [];

  const MIDI_NOTE_ON = 0x90; // = the event code (0x90) + channel (0)
  const MIDI_NOTE_OFF = 0x80;
  const MIDI_CONTROL = 0xb0;
  const MIDI_SUSTAIN = 0x40;
  const MIDI_SOFT = 0x43;

  const sendMidiMsg = (msg) => {
    for (let i = 0; i < midiOuts.length; i++) {
      midiOuts[i].send(msg);
    }
  };

  const registerMidiInputs = (midi) => {
    // Respond to input from attached MIDI controllers
    Array.from(midi.inputs).forEach((input) => {
      if (input[1].onmidimessage !== null) return;
      input[1].onmidimessage = (msg) => {
        if (msg.data.length > 1) {
          if (msg.data[0] == MIDI_CONTROL) {
            if (msg.data[1] == MIDI_SUSTAIN) {
              samplePlayer.toggleSustain(!!parseInt(msg.data[2], 10), true);
            } else if (msg.data[1] == MIDI_SOFT) {
              samplePlayer.toggleSoft(!!parseInt(msg.data[2], 10), true);
            }
          } else if (msg.data[0] == MIDI_NOTE_ON) {
            if (msg.data[2] === 0) {
              samplePlayer.stopNote(msg.data[1], true);
              samplePlayer.activeNotes.delete(msg.data[1]);
            } else {
              samplePlayer.startNote(
                msg.data[1],
                parseInt((parseFloat(msg.data[2]) / 127) * 100, 10),
                true,
              );
              samplePlayer.activeNotes.add(msg.data[1]);
            }
          } else if (msg.data[0] == MIDI_NOTE_OFF) {
            samplePlayer.stopNote(msg.data[1], true);
            samplePlayer.activeNotes.delete(msg.data[1]);
          }
        }
      };
    });
  };

  onMount(() => {
    if (navigator.requestMIDIAccess) {
      if (
        !$userSettings.midiMessageSeen &&
        $userSettings.welcomeScreenInhibited
      ) {
        notify({
          title: "MIDI in/out available",
          message:
            "Connect a digital piano or other MIDI divice to send/receive keyboard and pedal events.",
          timeout: 4000,
          closable: true,
        });
        $userSettings.midiMessageSeen = true;
      }
      navigator.requestMIDIAccess().then((midi) => {
        registerMidiInputs(midi);
        midiOuts = Array.from(midi.outputs).map((output) => output[1]);
        midi.onstatechange = (e) => {
          // Print information about the (dis)connected MIDI controller
          notify({
            title: "MIDI device change",
            message: `${e.port.name} ${e.port.manufacturer} ${e.port.state}`,
            timeout: 4000,
            closable: true,
          });
          registerMidiInputs(midi);
          midiOuts = Array.from(midi.outputs).map((output) => output[1]);
        };
      });
    } else {
      if (
        !$userSettings.midiMessageSeen &&
        $userSettings.welcomeScreenInhibited
      ) {
        notify({
          title: "MIDI in/out not available",
          message:
            "This browser does not support connecting to a digital piano or other MIDI device.",
          timeout: 4000,
          closable: true,
        });
        $userSettings.midiMessageSeen = true;
      }
    }
  });

  export { sendMidiMsg };
</script>
