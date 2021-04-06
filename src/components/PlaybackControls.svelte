<style>
  .pedal-on {
    background: yellow;
  }
</style>

<script>
  import { pedalling, volume, tempoControl, playbackProgress } from "../stores";

  export let playPauseMidiFile;
  export let stopMidiFile;
  export let skipToPercentage;
</script>

<div id="score-controls">
  <button type="button" on:click={playPauseMidiFile}>Play/Pause</button>
  <button type="button" on:click={stopMidiFile}>Stop</button>
  <button
    type="button"
    class:pedal-on={$pedalling.soft}
    aria-pressed={$pedalling.soft}
    on:click={() => pedalling.update((val) => ({ ...val, soft: !val.soft }))}
  >Soft</button>
  <button
    type="button"
    class:pedal-on={$pedalling.sustain}
    aria-pressed={$pedalling.sustain}
    on:click={() => pedalling.update((val) => ({
        ...val,
        sustain: !val.sustain,
      }))}
  >Sustain</button>

  <div>
    Master Volume:
    <input
      type="range"
      min="0"
      max="4"
      step=".1"
      bind:value={$volume.master}
      name="volume"
    />
    {$volume.master}
  </div>
  <div>
    Bass Volume:
    <input
      type="range"
      min="0"
      max="4"
      step=".1"
      bind:value={$volume.left}
      name="volume"
    />
    {$volume.left}
  </div>
  <div>
    Treble Volume:
    <input
      type="range"
      min="0"
      max="4"
      step=".1"
      bind:value={$volume.right}
      name="volume"
    />
    {$volume.right}
  </div>
  <div>
    Tempo:
    <input
      type="range"
      min="0"
      max="180"
      step="10"
      bind:value={$tempoControl}
      name="tempo"
    />
    {$tempoControl}
  </div>
  <div>
    Progress:
    <input
      type="range"
      min="0"
      max="1"
      step="0.01"
      value={$playbackProgress}
      name="progress"
      on:input={({ target: { value } }) => {
        skipToPercentage(value);
        $playbackProgress = value;
      }}
    />
    {($playbackProgress * 100).toFixed(2)}%
  </div>
</div>
