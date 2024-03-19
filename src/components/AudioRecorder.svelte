<script>
  import { onMount } from "svelte";
  import { recordingOnOff, recordingInBuffer, rollMetadata } from "../stores";

  export let recordingDestination;

  let mediaRecorder = null;

  let chunks = [];

  const startPauseRecording = (onOff) => {
    if (onOff && mediaRecorder) {
      mediaRecorder.start();
      $recordingInBuffer = true;
    } else if (!onOff && mediaRecorder) {
      mediaRecorder.stop();
    }
  };

  const clearRecording = () => {
    $recordingOnOff = false;
    $recordingInBuffer = false;
    chunks = [];
  };

  const exportRecording = () => {
    const clipName = `${$rollMetadata.DRUID}-${new Date().toISOString()}`;
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

  onMount(() => {
    mediaRecorder = new MediaRecorder(recordingDestination.stream);
    mediaRecorder.ondataavailable = (e) => {
      chunks.push(e.data);
    };
  });

  $: startPauseRecording($recordingOnOff);

  export { exportRecording, clearRecording };
</script>
