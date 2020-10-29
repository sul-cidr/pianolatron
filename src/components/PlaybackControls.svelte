<script>
  export let playPauseMidiFile;
  export let stopMidiFile;
</script>

<div id="score-controls">
  <button type="button" on:click={playPauseMidiFile}>Play/Pause</button>
  <button type="button" on:click={stopMidiFile}>Stop</button>
</div>
