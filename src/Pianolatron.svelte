<style lang="scss">
  #app {
    height: calc(100vh - 60px);
    display: flex;
    flex-direction: column;
    overflow: hidden;

    > div:first-child {
      flex: 1 0 auto;
      position: relative;
      display: grid;
      grid-template-rows: 1fr;
      grid-template-columns: auto 1fr auto;
      grid-template-areas: "left center right";
    }
  }

  :global(#left-sidebar) {
    grid-area: left;

    p {
      opacity: 0.5;
      padding: 0.5em 1em;
    }
  }

  #roll {
    position: relative;
    flex: 1 0 auto;
    grid-area: center;
  }

  :global(#right-sidebar) {
    grid-area: right;
  }

  #keyboard-container {
    flex: 0 1 auto;
    user-select: none;
  }

  #keyboard-overlay {
    position: absolute;
    bottom: 0;
    width: calc(100% - var(--navigator-width));
    opacity: 0.5;
    z-index: z($main-context, keyboard-overlay);
  }
</style>

<script>
  import { onMount } from "svelte";
  import { quartInOut } from "svelte/easing";
  import { fade } from "svelte/transition";
  import IntervalTree from "node-interval-tree";
  import {
    bassVolumeCoefficient,
    trebleVolumeCoefficient,
    tempoCoefficient,
    playbackProgress,
    playbackProgressStart,
    playbackProgressEnd,
    currentTick,
    rollMetadata,
    isReproducingRoll,
    scrollDownwards,
    playExpressionsOnOff,
    rollPedalingOnOff,
    userSettings,
    playRepeat,
  } from "./stores";
  import {
    annotateHoleData,
    clamp,
    getPathJoiner,
    getProfile,
  } from "./lib/utils";
  import SamplePlayer from "./components/SamplePlayer.svelte";
  import RollSelector from "./components/RollSelector.svelte";
  import RollDetails from "./components/RollDetails.svelte";
  import RollViewer from "./components/RollViewer.svelte";
  import Keyboard from "./components/Keyboard.svelte";
  import KeyboardControls from "./components/KeyboardControls.svelte";
  import KeyboardShortcuts from "./components/KeyboardShortcuts.svelte";
  import KeyboardShortcutEditor from "./components/KeyboardShortcutEditor.svelte";
  import TabbedPanel from "./components/TabbedPanel.svelte";
  import ListenerPanel from "./components/ListenerPanel.svelte";
  import Notification, {
    notify,
    clearNotification,
  } from "./ui-components/Notification.svelte";
  import FlexCollapsible from "./ui-components/FlexCollapsible.svelte";
  import LoadingSpinner from "./ui-components/LoadingSpinner.svelte";
  import RollPlayerControls from "./components/RollPlayerControls.svelte";
  import catalog from "./config/catalog.json";

  export let profile = "perform";

  const joinPath = getPathJoiner(import.meta.env.BASE_URL);
  const isPerform = getProfile(profile) === "perform";

  let firstLoad = true;
  let appReady = false;
  let appWaiting = false;
  let appLoaded = false;
  let rollImageReady = false;
  let mididataReady;
  let metadataReady;
  let currentRoll;
  let previousRoll;
  let metadata;
  let holeData;
  let holesByTickInterval = new IntervalTree();

  let samplePlayer;

  let midiSamplePlayer;
  let pianoReady;
  let updatePlayer;
  let startNote;
  let stopNote;
  let pausePlayback;
  let startPlayback;
  let resetPlayback;
  let skipToTick;

  let rollViewer;
  let updateTickByViewportIncrement;
  let panHorizontal;

  const progressPercentageToTick = (percentage = 0) =>
    Math.floor(midiSamplePlayer.totalTicks * percentage);

  // redundant, but the way the BasicSettings comp is built requires we define the func
  // here, as it won't update the ref.
  const skipToPercentage = (percentage = 0) =>
    skipToTick(progressPercentageToTick(percentage));

  const rollListItems = catalog.map((item) => ({
    ...item,
    _label: `${item.number} ${item.title} [${item.publisher}]`,
  }));

  const slide = (node, { delay = 0, duration = 300 }) => {
    const o = parseInt(getComputedStyle(node).height, 10);
    return {
      delay,
      duration,
      css: (t) => `height: ${quartInOut(t) * o}px`,
    };
  };

  const buildHolesIntervalTree = () => {
    const { FIRST_HOLE } = $rollMetadata;

    const firstHolePx = parseInt(FIRST_HOLE, 10);

    holeData.forEach((hole) => {
      const { y: offsetY, h: height } = hole;
      const tickOn = offsetY - firstHolePx;
      const tickOff = offsetY + height - firstHolePx;

      holesByTickInterval.insert(tickOn, tickOff, hole);
    });
  };

  const playPauseApp = () => {
    if (midiSamplePlayer.isPlaying()) {
      pausePlayback();
    } else {
      startPlayback();
    }
  };

  const stopApp = () => {
    pausePlayback();
    resetPlayback();
  };

  const resetApp = () => {
    rollViewer?.$destroy();
    mididataReady = false;
    if (!firstLoad) clearNotification();
    appReady = false;
    pausePlayback();
    resetPlayback();
    playbackProgress.reset();
    tempoCoefficient.reset();
    bassVolumeCoefficient.reset();
    trebleVolumeCoefficient.reset();
    holesByTickInterval = new IntervalTree();
  };

  const loadRoll = (roll) => {
    appWaiting = true;
    const rollDruid = roll.druid;
    mididataReady = fetch(joinPath("midi", `${rollDruid}.mid`))
      .then((mididataResponse) => {
        if (mididataResponse.status === 200)
          return mididataResponse.arrayBuffer();
        throw new Error("Error fetching MIDI file! (Operation cancelled)");
      })
      .then((mididataArrayBuffer) => {
        resetApp();
        midiSamplePlayer.loadArrayBuffer(mididataArrayBuffer);
      })
      .catch((err) => {
        notify({ title: "Error!", message: err, type: "error" });
        currentRoll = previousRoll;
      });

    metadataReady = fetch(joinPath("json", `${rollDruid}.json`))
      .then((metadataResponse) => {
        if (metadataResponse.status === 200) return metadataResponse.json();
        throw new Error("Error fetching metadata file! (Operation cancelled)");
      })
      .catch((err) => {
        notify({ title: "Error!", message: err, type: "error" });
        currentRoll = previousRoll;
      });

    Promise.all([mididataReady, metadataReady, pianoReady]).then(
      ([, metadataJson]) => {
        metadata = (({ holeData: _, ...obj }) => obj)({
          ...metadataJson,
          druid: rollDruid,
        });
        holeData = metadataJson.holeData;
        annotateHoleData(holeData, $rollMetadata, $scrollDownwards);
        buildHolesIntervalTree();
        $playExpressionsOnOff = $isReproducingRoll;
        $rollPedalingOnOff = $isReproducingRoll;
        appReady = true;
        appWaiting = false;
        firstLoad = false;
        document.querySelector("#loading span").textContent =
          "Loading roll image...";
        previousRoll = currentRoll;
        const params = new URLSearchParams(window.location.search);
        if (params.has("druid") && params.get("druid") !== currentRoll.druid) {
          const url = new URL(window.location);
          url.searchParams.delete("start");
          url.searchParams.delete("end");
          playbackProgressStart.reset();
          playbackProgressEnd.reset();
          url.searchParams.set("druid", currentRoll.druid);
          window.history.pushState({ roll: currentRoll }, "", url);
        }
      },
    );
  };

  const validateStartParam = (start) => {
    start = Number(start) / 100;
    if (start < 0 || start >= 1) {
      start = 0;
    }
    return start;
  };

  const validateEndParam = (end, start) => {
    end = Number(end) / 100;
    if (end <= 0 || end > 1 || start >= end) {
      end = 1;
    }
    return end;
  };

  const setCurrentRollFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("druid")) {
      const druid = params.get("druid");
      const roll = rollListItems.find((r) => r.druid === druid);
      if (roll !== undefined) {
        currentRoll = roll;
      } else {
        notify({
          title: "DRUID not found!",
          message:
            "Please check the specified DRUID, or select a roll to continue.",
          type: "error",
          closable: false,
        });
      }

      if (params.has("start")) {
        playbackProgressStart.set(validateStartParam(params.get("start")));
      } else {
        playbackProgressStart.reset();
      }

      if (params.has("end")) {
        playbackProgressEnd.set(
          validateEndParam(params.get("end"), $playbackProgressStart),
        );
      } else {
        playbackProgressEnd.reset();
      }
    } else {
      currentRoll =
        rollListItems[Math.floor(Math.random() * rollListItems.length)];
      const url = new URL(window.location);
      url.searchParams.set("druid", currentRoll.druid);
      window.history.pushState({}, "", url);
    }
  };

  onMount(async () => {
    document.querySelector("#loading span").textContent =
      "Loading resources...";
    ({
      midiSamplePlayer,
      pianoReady,
      updatePlayer,
      startNote,
      stopNote,
      pausePlayback,
      startPlayback,
      resetPlayback,
      skipToTick,
    } = samplePlayer);

    setCurrentRollFromUrl();
  });

  $: if (currentRoll !== previousRoll) loadRoll(currentRoll);
  $: if (appLoaded && $playbackProgressStart > 0) {
    skipToPercentage($playbackProgressStart);
  }
  $: playbackProgress.update(() => {
    return clamp($currentTick / (midiSamplePlayer?.totalTicks || 1), 0, 1);
  });
  $: if (appLoaded && $playbackProgress >= $playbackProgressEnd) {
    $playRepeat ? skipToPercentage($playbackProgressStart) : pausePlayback();
  }
  $: if (rollViewer)
    ({ updateTickByViewportIncrement, panHorizontal } = rollViewer);
  $: if (rollImageReady) {
    document.querySelector("#loading span").textContent = "Loading complete!";
    document
      .getElementById("loading")
      .addEventListener("transitionend", () =>
        document.getElementById("loading").remove(),
      );
    document.getElementById("loading").classList.add("fade-out");
    appLoaded = true;
  }
</script>

<div id="app">
  <div>
    <FlexCollapsible id="left-sidebar" width="20vw">
      {#if isPerform}<RollSelector bind:currentRoll {rollListItems} />{/if}
      {#if appReady}
        <RollDetails {metadata} />
        {#if !holesByTickInterval.count}
          <p>
            Note:<br />Hole visualization data is not available for this roll at
            this time. Hole highlighting will not be enabled.
          </p>
        {/if}
      {/if}
    </FlexCollapsible>
    <div id="roll">
      {#if appReady}
        <RollPlayerControls {skipToTick} {resetPlayback} {playPauseApp} />
        <RollViewer
          bind:this={rollViewer}
          bind:rollImageReady
          imageUrl={currentRoll.image_url}
          {holeData}
          {holesByTickInterval}
          {skipToTick}
          {progressPercentageToTick}
          showScaleBar={isPerform && $userSettings.showRuler}
        />
      {/if}
      {#if $userSettings.showKeyboard && $userSettings.overlayKeyboard}
        <div id="keyboard-overlay" transition:fade>
          <Keyboard keyCount="88" {startNote} {stopNote} />
        </div>
      {/if}
    </div>
    <FlexCollapsible id="right-sidebar" width="20vw" position="left">
      {#if isPerform}
        <TabbedPanel {playPauseApp} {stopApp} {skipToPercentage} />
      {:else}
        <ListenerPanel {playPauseApp} {stopApp} />
      {/if}
    </FlexCollapsible>
  </div>
  {#if $userSettings.showKeyboard && !$userSettings.overlayKeyboard}
    <div id="keyboard-container" transition:slide>
      <Keyboard keyCount="88" {startNote} {stopNote} />
    </div>
  {:else if !$userSettings.showKeyboard}
    <KeyboardControls outside />
  {/if}
  <LoadingSpinner showLoadingSpinner={appLoaded && appWaiting} />
</div>
<SamplePlayer
  bind:this={samplePlayer}
  on:loading={({ detail: loadingSamples }) => {
    appWaiting = true;
    loadingSamples.then(() => (appWaiting = false)).catch(() => {});
  }}
/>
<KeyboardShortcuts
  {playPauseApp}
  {stopApp}
  {updateTickByViewportIncrement}
  {panHorizontal}
/>
<KeyboardShortcutEditor />
<Notification />

<svelte:window
  on:popstate={({ state }) =>
    state?.roll ? (currentRoll = state.roll) : setCurrentRollFromUrl()}
/>
