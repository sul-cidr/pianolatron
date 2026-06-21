<style lang="scss">
  #app {
    display: flex;
    flex-direction: column;
    overflow: hidden;

    > div:first-of-type {
      flex: 1 0 auto;
      position: relative;
      display: grid;
      grid-template-rows: 1fr;
      grid-template-columns: auto 1fr auto;
      grid-template-areas: "left center right";
    }

    :global(:is(h1, h2, h3, h4, h5, h6)) {
      // sr-only
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      border: 0;
    }
  }

  .listen-app,
  .perform-app {
    height: calc(100vh - 135px);
    transition: height 0.3s ease;
  }
  .embed-app {
    height: 100vh;
  }

  :global(body.header-hidden) .listen-app,
  :global(body.header-hidden) .perform-app {
    height: 100vh;
  }

  :global(#left-sidebar) {
    grid-area: left;
  }

  #roll {
    position: relative;
    display: flex;
    flex-direction: column;
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
    // z-index: z($main-context, keyboard-overlay);
  }

  .sidebar {
    position: absolute;
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    padding: 0.5em;
    height: 100%;
    min-width: 20vw;
    max-width: 20vw;
  }

  .driver-popover {
    min-width: 300px;
  }
  .driver-popover-progress-text {
    white-space: nowrap;
  }
</style>

<script>
  import { onMount } from "svelte";
  import { quartInOut } from "svelte/easing";
  import { fade } from "svelte/transition";
  import IntervalTree from "node-interval-tree";
  import {
    appMode,
    appWaiting,
    bassVolumeCoefficient,
    expressionParameters,
    trebleVolumeCoefficient,
    tempoCoefficient,
    playbackProgress,
    playbackProgressStart,
    playbackProgressEnd,
    currentTick,
    throttledTick,
    expressionBox,
    holesIntervalTree,
    recordingInBuffer,
    recordingOnOff,
    rollMetadata,
    scrollDownwards,
    useInAppExpression,
    userSettings,
    playRepeat,
    rollBeingBookmarked,
  } from "./stores";
  import { clamp, getMode, getPathJoiner, RecordingActions } from "./lib/utils";
  import expressionBoxes from "./expression-boxes";
  import { processHoleData } from "./lib/hole-data";
  import SamplePlayer from "./components/SamplePlayer.svelte";
  import RollSelector from "./components/RollSelector.svelte";
  import RollDetails from "./components/RollDetails.svelte";
  import RollViewer from "./components/RollViewer.svelte";
  import Keyboard from "./components/Keyboard.svelte";
  import KeyboardControls from "./components/KeyboardControls.svelte";
  import KeyboardShortcuts from "./components/KeyboardShortcuts.svelte";
  import KeyboardShortcutEditor from "./components/KeyboardShortcutEditor.svelte";
  import GameController from "./components/GameController.svelte";
  import TabbedPanel from "./components/TabbedPanel.svelte";
  import FlexCollapsible from "./ui-components/FlexCollapsible.svelte";
  import Notification, {
    notify,
    clearNotification,
  } from "./ui-components/Notification.svelte";
  import SkipLink from "./ui-components/SkipLink.svelte";
  import LoadingSpinner from "./ui-components/LoadingSpinner.svelte";
  import RollPlayerControls from "./components/RollPlayerControls.svelte";
  import catalog from "./config/catalog.json";
  import { driver } from "driver.js";
  import "driver.js/dist/driver.css";

  export let mode;

  const joinPath = getPathJoiner(import.meta.env.BASE_URL);

  let firstLoad = true;
  let appReady = false;
  let appLoaded = false;
  let rollImageReady = false;
  let mididataReady;
  let metadataReady;
  let currentRoll;
  let previousRoll;
  let metadata;
  let pageTitle;

  let samplePlayer;

  let midiSamplePlayer;
  let pianoReady;
  let updatePlayer;
  let startNote;
  let stopNote;
  let pausePlayback;
  let startPlayback;
  let resetPlayback;
  let recordingControl;
  let exportInAppMIDI;

  let rollViewer;
  let updateTickByViewportIncrement;
  let panHorizontal;
  let adjustZoom;

  const progressPercentageToTick = (percentage = 0) =>
    Math.floor(midiSamplePlayer.totalTicks * percentage);

  const skipToTick = (tick) => {
    const targetTick = Math.round(tick);
    if (targetTick < 0 || targetTick >= midiSamplePlayer.totalTicks)
      pausePlayback();
    $currentTick = targetTick;
    throttledTick.set(targetTick);
    updatePlayer(() => midiSamplePlayer.skipToTick($currentTick));
  };

  // redundant, but the way the SamplePlayer comp is built requires we define the func
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
    $holesIntervalTree = new IntervalTree();
  };

  const loadRoll = (roll, doReset = true) => {
    $appWaiting = true;
    mididataReady = fetch(
      `/${$useInAppExpression ? "note_midi" : "midi"}/${roll.druid}.mid`,
    )
      .then((mididataResponse) => {
        if (mididataResponse.status === 200)
          return mididataResponse.arrayBuffer();
        throw new Error("Error fetching MIDI file! (Operation cancelled)");
      })
      .then((mididataArrayBuffer) => {
        if (doReset) resetApp();
        midiSamplePlayer.loadArrayBuffer(mididataArrayBuffer);
      })
      .then(() => {
        // Configure and hook-up expression box
        // Including a check for the one (so far) 65-note roll...
        if ($rollMetadata.ROLL_TYPE === "65-note") $useInAppExpression = false;
        const expressionBoxType = $useInAppExpression
          ? $rollMetadata.ROLL_TYPE
          : "expressiveMidi";
        if (previousRoll && roll.type !== previousRoll.type)
          $expressionParameters = {};
        $expressionBox = new expressionBoxes[expressionBoxType](
          midiSamplePlayer,
          startNote,
          stopNote,
        );
        // This is a tiny bit hacky (in the sense that it's using an undocumented
        //  api), but it's a simple way to ensure that only one midiEventHandler
        //  is registered.
        midiSamplePlayer.eventListeners.midiEvent = [
          $expressionBox.midiEventHandler,
        ];
      })
      .catch((err) => {
        notify({ title: "MIDI Data Error!", message: err, type: "error" });
        currentRoll = previousRoll;
      });

    metadataReady = fetch(joinPath("json", `${roll.druid}.json`))
      .then((metadataResponse) => {
        if (metadataResponse.status === 200) return metadataResponse.json();
        throw new Error("Error fetching metadata file! (Operation cancelled)");
      })
      .catch((err) => {
        notify({ title: "Metadata Error!", message: err, type: "error" });
        currentRoll = previousRoll;
      });

    return Promise.all([mididataReady, metadataReady, pianoReady]).then(
      ([, metadataJson]) => {
        metadata = (({ holeData: _, ...obj }) => obj)(metadataJson);
        metadata.druid = roll.druid;
        $holesIntervalTree = processHoleData(
          metadataJson.holeData,
          $rollMetadata,
          $scrollDownwards,
          $expressionBox.noteVelocitiesMap,
        );
        appReady = true;
        $appWaiting = false;
        firstLoad = false;
        const loadingSpan = document.querySelector("#loading span");
        if (loadingSpan !== null)
          loadingSpan.textContent = "Loading roll image...";
        previousRoll = currentRoll;
        pageTitle = `${roll.title} | Pianolatron (${$appMode === "perform" ? "Perform Mode" : "Listen Mode"})`;
        document.title = pageTitle;
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
    let startPct = Number(start) / 100;
    if (startPct < 0 || startPct >= 1) {
      startPct = 0;
    }
    return startPct;
  };

  const validateEndParam = (end, start) => {
    let endPct = Number(end) / 100;
    if (endPct <= 0 || endPct > 1 || start >= endPct) {
      endPct = 1;
    }
    return endPct;
  };

  const reloadRoll = (resetExpression = false) => {
    const savedTick = $currentTick;
    let startPlayer = false;
    if (midiSamplePlayer.isPlaying()) {
      pausePlayback();
      startPlayer = true;
    }
    if (resetExpression) $expressionParameters = {};

    loadRoll(currentRoll, false).then(() => {
      rollViewer.partitionOverlaySvgs();
      rollViewer.updateVisibleOverlays();
      skipToTick(savedTick);
      if (startPlayer) startPlayback();
    });
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

  const exportRecordingMIDI = () =>
    recordingControl(RecordingActions.ExportMIDI);
  const exportRecordingWAV = () => recordingControl(RecordingActions.ExportWAV);
  const clearRecording = () => recordingControl(RecordingActions.Clear);

  const toggleRecording = () => {
    $recordingOnOff = !$recordingOnOff;
    if ($recordingInBuffer && !$recordingOnOff) {
      notify({
        title: "Recording paused, ready for export",
        message: "",
        closable: true,
        actions: [
          {
            label: "Export as MIDI",
            fn: exportRecordingMIDI,
          },
          {
            label: "Export as WAV",
            fn: exportRecordingWAV,
          },
          {
            label: "Clear Recording",
            fn: clearRecording,
          },
          {
            label: "Keep in Buffer",
            fn: clearNotification,
          },
        ],
      });
    }
  };

  const bookmarkRoll = () => {
    if ($rollBeingBookmarked) return;

    $rollBeingBookmarked = true;

    const urlToCopy = new URL(window.location);
    const params = Object.fromEntries(new URLSearchParams(urlToCopy.search));
    delete params.start;
    delete params.end;

    if ($playbackProgressStart >= 0) {
      params.start = ($playbackProgressStart * 100).toFixed(2);
    }
    if ($playbackProgressEnd < 1) {
      params.end = ($playbackProgressEnd * 100).toFixed(2);
    }
    urlToCopy.search = new URLSearchParams(params);

    try {
      window.navigator.clipboard.writeText(urlToCopy.toString());
      notify({
        title: "URL copied to your clipboard!",
        message: urlToCopy.toString(),
        type: "success",
        timeout: 3000,
      });
    } catch {
      notify({
        title: "URL could not be copied to your clipboard!",
        message: "Please copy manually: " + urlToCopy.toString(),
        type: "error",
      });
    }

    setTimeout(() => {
      $rollBeingBookmarked = false;
    }, 1000);
  };

  const showTourIfRequested = () => {
    const everyTourSteps = [
      {
        element: ".filtered-select",
        popover: {
          title: "Roll Selector",
          description:
            "Welcome to Pianolatron! Type search terms here or <a href='/search/'>visit the Search page</a> to find another piano roll to play.",
        },
      },
      {
        element: ".mode-switch-container > .player-button",
        popover: {
          title: "Mode Toggle",
          description: `Use this button to switch between "Listen Mode" and "Perform Mode." You are presently viewing the roll in ${$appMode === "perform" ? "Perform" : "Listen"} Mode. ${$appMode === "listen" ? "Take this tour again in Perform Mode to learn more about the advanced features available there." : "Perform Mode adds several more menus and options for influencing how a roll plays back interactively."}`,
        },
      },
      {
        element: "#left-sidebar",
        popover: {
          title: "Roll Information",
          description:
            "This left panel presents information and links for the current roll. It can be hidden via the slider button that appears when it's focused.",
        },
      },
      {
        element: ".player-button-container",
        popover: {
          title: "Roll Player Controls",
          description:
            "Use these buttons to play, pause, and rewind the roll, as well as to skip forward and backward, highlight a section of the roll, get a bookmark URL, create and export MIDI and sound recordings, and set the roll to auto-repeat.",
        },
      },
      {
        element: "#piano-toggle > button",
        popover: {
          title: "Piano Keyboard Visibility",
          description:
            "These buttons can reveal and hide the live piano keyboard visualization, as well as overlay it on the roll image.",
        },
      },
      {
        element: "#roll-viewer",
        popover: {
          title: "Piano Roll Viewer",
          description: `Use the mouse, keyboard, or navigation buttons to scroll, zoom, or pan the roll image and to explore the functions of the perforations. ${$appMode === "perform" ? "You also can use the menus in the right panel to choose the annotations that appear over the detected perforations on the roll when selected and while active during playback." : ""}`,
        },
      },
    ];

    const listenTourSteps = [
      {
        element: ".tempo-control-container",
        popover: {
          title: "Tempo Control",
          description: "Use this slider to adjust the roll playback speed.",
        },
      },
    ];

    const performTourSteps = [
      {
        element: "#viewer-metrics",
        popover: {
          title: "Playback Metrics",
          description:
            "These values update dynamically as the roll plays. Note how the roll moves faster as it accumulates over time on the (virtual) takeup spool.",
        },
      },
      {
        element: "#perform-controls",
        popover: {
          title: "Pedal and Accent Controls",
          description:
            "These buttons display the current state of the pedals, just like the pedal graphics below the keyboard visualization, and also can be clicked to override the pedaling settings on the roll, as well as to boost (accent) the volume of playback temporarily.",
        },
      },
      {
        element: "button[aria-label='Performance controls']",
        popover: {
          title: "Performance Controls",
          side: "top",
          alignt: "start",
          description:
            "This menu exposes options for modifying volume, tempo, and transposition dynamically during roll playback.",
        },
      },
      {
        element: "button[aria-label='Advanced settings']",
        popover: {
          title: "Advanced Settings",
          description:
            "This extensive menu enables changing the appearance of the roll, toggling emulation settings, remapping keyboard bindings for playback controls, and configuring game controller settings (when connected).",
        },
      },
      {
        element: "button[aria-label='Audio settings']",
        popover: {
          title: "Audio Settings",
          description:
            "Use this menu to tweak aspects of how the emulated piano sounds during playback, including sample resolution and volume, reverb, and other acoustic modifications.",
        },
      },
      {
        element: "button[aria-label='MIDI settings']",
        popover: {
          title: "MIDI Settings",
          description:
            "This menu provides information and options for connecting virtual and physical MIDI devices, such as digital keyboards.",
        },
      },
      {
        element: "button[aria-label='Expression settings']",
        popover: {
          title: "Expression Settings",
          description:
            'Use this menu to choose between hearing precalculated note velocities and the advanced "in-app expression mode," which allows for dynamic modification of the expression applicable emulation parameters during playback, as well as exporting the resulting MIDI and settings files.',
        },
      },
    ];

    const driverObj = driver({
      showProgress: true,
      steps:
        $appMode === "listen"
          ? everyTourSteps.concat(listenTourSteps)
          : everyTourSteps.concat(performTourSteps),
      onHighlighted: (e) => {
        switch (e) {
          // This only highlights one of the buttons, but that's enough
          case document.querySelector("#keyboard > .overlay-buttons > button"):
            e.focus();
            break;
          case document.querySelector("#left-sidebar"):
            const leftSidebarDivElt = document.querySelector(
              "#left-sidebar > div > .panel-show-hide-button ",
            );
            leftSidebarDivElt.setAttribute("style", "opacity: 1");
            break;
          case document.querySelector("#roll-viewer"):
            const rollViewerControlsButton = document.querySelector(
              "#roll-viewer > .overlay-buttons > button",
            );
            rollViewerControlsButton.focus();
            break;
          case document.querySelector(
            "button[aria-label='Performance controls']",
          ):
            e.click();
            break;
          case document.querySelector("button[aria-label='Advanced settings']"):
            e.click();
            break;
          case document.querySelector("button[aria-label='Audio settings']"):
            e.click();
            break;
          case document.querySelector("button[aria-label='MIDI settings']"):
            e.click();
            break;
          case document.querySelector(
            "button[aria-label='Expression settings']",
          ):
            e.click();
            break;
          default:
            break;
        }
      },
      onDeselected: (e) => {
        if (document.querySelector("#left-sidebar") === e) {
          const leftSidebarDivElt = document.querySelector(
            "#left-sidebar > div > .panel-show-hide-button ",
          );
          leftSidebarDivElt.removeAttribute("style");
        }
      },
      onDestroyed: () => {
        if ($appMode === "perform")
          document
            .querySelector("button[aria-label='Performance controls']")
            .click();
      },
    });

    driverObj.drive();
  };

  onMount(async () => {
    const loadingSpan = document.querySelector("#loading span");
    if (loadingSpan !== null) loadingSpan.textContent = "Loading resources...";

    $appMode = getMode(mode);

    ({
      midiSamplePlayer,
      pianoReady,
      updatePlayer,
      startNote,
      stopNote,
      pausePlayback,
      startPlayback,
      resetPlayback,
      recordingControl,
      exportInAppMIDI,
    } = samplePlayer);

    setCurrentRollFromUrl();

    const tourButton = document.querySelector("#tour-button");
    tourButton.addEventListener("click", (e) => {
      showTourIfRequested();
    });
  });

  $: if (currentRoll !== previousRoll) loadRoll(currentRoll);
  $: if (appLoaded && $playbackProgressStart > 0) {
    skipToPercentage($playbackProgressStart);
  }
  $: playbackProgress.update(() =>
    clamp($currentTick / (midiSamplePlayer?.totalTicks || 1), 0, 1),
  );
  $: if (appLoaded && $playbackProgress >= $playbackProgressEnd) {
    if ($playRepeat) skipToPercentage($playbackProgressStart);
    else pausePlayback();
  }
  $: if (rollViewer)
    ({ adjustZoom, updateTickByViewportIncrement, panHorizontal } = rollViewer);
  $: if (rollImageReady) {
    const loadingSpan = document.querySelector("#loading span");
    if (loadingSpan !== null) loadingSpan.textContent = "Loading complete!";
    const loadingElt = document.getElementById("loading");
    if (loadingElt !== null) {
      loadingElt.addEventListener("transitionend", () => loadingElt.remove());
      loadingElt.classList.add("fade-out");
    }
    appLoaded = true;
  }
  $: document.body.classList.toggle(
    "header-hidden",
    $userSettings.headerHidden,
  );
  $: appClass = `${$appMode}-app`;
</script>

<main id="app" class={appClass}>
  <h1>{pageTitle || "Pianolatron"}</h1>
  <div>
    <FlexCollapsible id="left-sidebar" width="20vw" position="left">
      <h2>Roll Details</h2>
      <RollSelector bind:currentRoll {rollListItems} />
      {#if appReady}
        <RollDetails {metadata} />
        {#if !$holesIntervalTree.count}
          <p>
            Note:<br />Hole visualization data is not available for this roll at
            this time. Hole highlighting will not be enabled.
          </p>
        {/if}
      {/if}
    </FlexCollapsible>
    {#if $appMode === "perform"}
      <SkipLink
        targetAnchor="right-sidebar"
        skipText="Skip to settings menus"
      />
    {/if}
    <div id="roll">
      <h2>Roll Visualization</h2>
      {#if appReady}
        <RollPlayerControls
          {skipToTick}
          {resetPlayback}
          {playPauseApp}
          {toggleRecording}
          {bookmarkRoll}
        />
        {#if $appMode === "perform"}
          <SkipLink
            targetAnchor="perform-controls"
            skipText="Skip to pedal and accent controls"
          />
        {/if}
        {#key $userSettings.hideRollImage}
          <RollViewer
            bind:this={rollViewer}
            bind:rollImageReady
            imageUrl={currentRoll.image_url}
            {skipToTick}
            {progressPercentageToTick}
            showScaleBar={$appMode === "perform" && $userSettings.showRuler}
          />
        {/key}
      {/if}
      {#if $userSettings.showKeyboard && $userSettings.overlayKeyboard}
        <div id="keyboard-overlay" transition:fade>
          <Keyboard keyCount="88" {startNote} {stopNote} />
        </div>
      {/if}
    </div>
    {#if $appMode === "perform"}
      <FlexCollapsible id="right-sidebar" width="20vw" position="right">
        <h2>App Settings and Controls</h2>
        {#if appReady}
          <TabbedPanel {reloadRoll} {exportInAppMIDI} />
        {/if}
      </FlexCollapsible>
    {/if}
  </div>
  <h2>Keyboard Visualization</h2>
  {#if $userSettings.showKeyboard && !$userSettings.overlayKeyboard}
    <div id="keyboard-container" transition:slide>
      <Keyboard keyCount="88" {startNote} {stopNote} />
    </div>
  {:else if !$userSettings.showKeyboard}
    <KeyboardControls outside />
  {/if}
  <LoadingSpinner showLoadingSpinner={appLoaded && $appWaiting} />
</main>
<SamplePlayer
  {metadata}
  bind:this={samplePlayer}
  on:loading={({ detail: loadingSamples }) => {
    $appWaiting = true;
    loadingSamples.then(() => ($appWaiting = false)).catch(() => {});
  }}
/>

{#if $appMode === "perform"}
  <KeyboardShortcuts
    {playPauseApp}
    {stopApp}
    {updateTickByViewportIncrement}
    {panHorizontal}
    {toggleRecording}
  />
  <KeyboardShortcutEditor />
  <GameController
    {playPauseApp}
    {stopApp}
    {updateTickByViewportIncrement}
    {panHorizontal}
    {adjustZoom}
    {bookmarkRoll}
  />
{/if}
<Notification />

<svelte:window
  on:popstate={({ state }) =>
    state?.roll ? (currentRoll = state.roll) : setCurrentRollFromUrl()}
/>
