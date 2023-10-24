<style>
.player-buttons {
    padding: 2px;
    text-align: center;
}



</style>

<script>
    import { tick as sweep } from "svelte";
    import IconButton from "../ui-components/IconButton.svelte";
    import {
        currentTick,
        playRepeat,
        playbackProgress,
        playbackProgressEnd,
        playbackProgressStart
    } from "../stores";

    export let skipToTick;
    export let resetPlayback;
    export let playPauseApp;
    export let isPlaying;

    let showPause = false;
    let isRecording = false;

    const toggleRecording = async () => {
        console.log("TBD");
        isRecording = !isRecording;
    }
    
    const togglePlayPause = async () => {
        playPauseApp();
        await sweep();
        showPause = isPlaying();
    }

    const skipFromCurrent = ( tickIncrement = 1500 ) => {
        skipToTick($currentTick + tickIncrement);
    }

    const markStart = () => playbackProgressStart.set($playbackProgress);
    const markEnd = () => playbackProgressEnd.set($playbackProgress);
    let startMarked;
    let endMarked;

    const togglePlayRepeat = () => playRepeat.set(!$playRepeat);

    $: startMarked = $playbackProgressStart > 0;
    $: endMarked = $playbackProgressEnd < 1;

</script>

<div class="player-buttons">
<IconButton
    class={ $playRepeat ? "overlay" : ""}
    disabled={false}
    on:mousedown={togglePlayRepeat}
    iconName="replay"
    label="Repeat"
    height="24"
    width="24"
  />
<IconButton
    class=""
    disabled={false}
    on:mousedown={resetPlayback}
    iconName="rewind"
    label="Rewind"
    height="24"
    width="24"
  />
 <IconButton
    disabled={false}
    on:mousedown={() => {
      skipFromCurrent(-1500);
    }}
    iconName="skipBack"
    label="Skip Back"
    height="24"
    width="24"
  />
 {#if !showPause }
 <IconButton
    disabled={false}
    on:mousedown={togglePlayPause}
    iconName="play"
    label="Play"
    height="24"
    width="24"
  />
 {:else }
 <IconButton
    class="overlay"
    disabled={false}
    on:mousedown={togglePlayPause}
    iconName="pause"
    label="Pause"
    height="24"
    width="24"
  />
 {/if}
 <IconButton
    class={ isRecording ? "overlay" : "" }
    disabled={false}
    on:mousedown={toggleRecording}
    iconName="record"
    label="Record"
    height="24"
    width="24"
  />
  <IconButton
    class=""
    disabled={false}
    on:mousedown={() => skipFromCurrent()}
    iconName="skipForward"
    label="Skip Ahead"
    height="24"
    width="24"
  />
  <IconButton
    class={ startMarked ? "overlay" : "" }
    disabled={false}
    on:mousedown={markStart}
    iconName="markStart"
    label="Mark Start"
    height="24"
    width="24"
  />
  <IconButton
    class={ endMarked ? "overlay" : "" }
    disabled={false}
    on:mousedown={markEnd}
    iconName="markEnd"
    label="Mark Start"
    height="24"
    width="24"
  />
</div>