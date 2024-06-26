<style lang="scss">
  button {
    @include button;
  }
  .exp-param {
    align-self: center;
    margin: 0 5px 0 0;
  }
  .param-value {
    width: 4.5rem;
  }
  .button-row {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    gap: 0.5rem;
    padding-top: 5px;
    width: 100%;
  }
  .option-toggle {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  #input-file {
    display: none;
  }
</style>

<script>
  import {
    appWaiting,
    expressionParameters,
    rollHasExpressions,
    rollMetadata,
    useInAppExpression,
    drawVelocityCurves,
    rollPedalingOnOff,
    playExpressionsOnOff,
    reverbWetDry,
    currentTick,
    volumeCoefficient,
    bassVolumeCoefficient,
    trebleVolumeCoefficient,
    transposeHalfStep,
    sampleVolumes,
    sampleVelocities,
    tempoCoefficient,
    velocityCurveLow,
    velocityCurveMid,
    velocityCurveHigh,
    userSettings,
    useMidiTempoEventsOnOff,
  } from "../stores";

  export let reloadRoll;
  export let exportInAppMIDI;

  let files;

  const exportSettings = () => {
    const playbackSettings = {
      volumeCoefficient: $volumeCoefficient,
      bassVolumeCoefficient: $bassVolumeCoefficient,
      trebleVolumeCoefficient: $trebleVolumeCoefficient,
      tempoCoefficient: $tempoCoefficient,
      transposeHalfStep: $transposeHalfStep,
      rollPedalingOnOff: $rollPedalingOnOff,
      playExpressionsOnOff: $playExpressionsOnOff,
      useMidiTempoEventsOnOff: $useMidiTempoEventsOnOff,
      sampleVolumes: $sampleVolumes,
      sampleVelocities: $sampleVelocities,
      reverbWetDry: $reverbWetDry,
      velocityCurveLow: $velocityCurveLow,
      velocityCurveMid: $velocityCurveMid,
      velocityCurveHigh: $velocityCurveHigh,
      currentTick: $currentTick,
      userSettings: $userSettings,
      drawVelocityCurves: $drawVelocityCurves,
    };
    const settingsJson = {
      expressionParameters: $expressionParameters,
      playbackSettings,
    };

    const settingsFileName = `${
      $rollMetadata.DRUID
    }-${new Date().toISOString()}-settings`;
    const jsonUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(
      JSON.stringify(settingsJson),
    )}`;
    const element = document.createElement("a");
    element.setAttribute("href", jsonUrl);
    element.setAttribute("download", `${settingsFileName}.json`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(jsonUrl);
  };

  const loadSettings = () => {
    const reader = new FileReader();
    reader.readAsText(files[0], "UTF-8");

    reader.onload = (readerEvent) => {
      const allSettings = JSON.parse(readerEvent.target.result);
      $expressionParameters = allSettings.expressionParameters;
      // The alternatives to this, i.e., using eval() or rearranging most of
      //  the contents of stores.js to be part of single settings object,
      //  seem worse than just hardcoding the assignments.
      $volumeCoefficient = allSettings.playbackSettings.volumeCoefficient;
      $bassVolumeCoefficient =
        allSettings.playbackSettings.bassVolumeCoefficient;
      $trebleVolumeCoefficient =
        allSettings.playbackSettings.trebleVolumeCoefficient;
      $tempoCoefficient = allSettings.playbackSettings.tempoCoefficient;
      $transposeHalfStep = allSettings.playbackSettings.transposeHalfStep;
      $rollPedalingOnOff = allSettings.playbackSettings.rollPedalingOnOff;
      $playExpressionsOnOff = allSettings.playbackSettings.playExpressionsOnOff;
      $useMidiTempoEventsOnOff =
        allSettings.playbackSettings.useMidiTempoEventsOnOff;
      $sampleVolumes = allSettings.playbackSettings.sampleVolumes;
      $sampleVelocities = allSettings.playbackSettings.sampleVelocities;
      $reverbWetDry = allSettings.playbackSettings.reverbWetDry;
      $velocityCurveLow = allSettings.playbackSettings.velocityCurveLow;
      $velocityCurveMid = allSettings.playbackSettings.velocityCurveMid;
      $velocityCurveHigh = allSettings.playbackSettings.velocityCurveHigh;
      $currentTick = allSettings.playbackSettings.currentTick;
      $userSettings = allSettings.playbackSettings.userSettings;
      $drawVelocityCurves = allSettings.playbackSettings.drawVelocityCurves;

      reloadRoll();
    };
  };
</script>

<div id="expression-panel">
  {#if !$rollHasExpressions || ["welte-red", "welte-green", "welte-licensee", "duo-art", "88-note"].includes($rollMetadata.ROLL_TYPE)}
    <fieldset>
      <legend>Emulation Type</legend>

      <div class="option-toggle">
        <span
          ><strong>Active</strong>: {$useInAppExpression
            ? "In-App Expression"
            : "Expression MIDI"}</span
        >
        <div>
          <button
            type="button"
            on:click={() => {
              $useInAppExpression = !$useInAppExpression;
              reloadRoll();
            }}
            >Change to {$useInAppExpression
              ? "Expression MIDI"
              : "In-App Expression"}</button
          >
        </div>
      </div>
    </fieldset>

    {#if $useInAppExpression}
      <fieldset>
        <legend>Expression Settings</legend>
        {#each Object.keys($expressionParameters.tunable || {}) as expressionParam}
          <div>
            <label class="exp-param" for={`"input_"{expressionParam}`}
              >{$expressionParameters.tunable[expressionParam].alias}:</label
            >
            <div>
              <input
                disabled={$appWaiting}
                class="param-value"
                id={`"input_"{expressionParam}`}
                type="number"
                min={$expressionParameters.tunable[expressionParam].min}
                max={$expressionParameters.tunable[expressionParam].max}
                step={$expressionParameters.tunable[expressionParam].step}
                value={$expressionParameters.tunable[expressionParam].value}
                on:keydown|stopPropagation
                on:change={(e) => {
                  $expressionParameters.tunable[expressionParam].value =
                    parseFloat(e.target.value);
                  $expressionParameters.tunable[expressionParam].value =
                    parseFloat(e.target.value);
                  reloadRoll();
                }}
              />
            </div>
          </div>
        {/each}
        <div class="button-row">
          <div>
            <button
              type="button"
              on:click={() => {
                reloadRoll(true);
              }}>Reset</button
            >
          </div>
          <div>
            <button
              type="button"
              on:click={() => {
                exportSettings();
              }}>Export</button
            >
          </div>
          <div>
            <button
              type="button"
              on:click={() => {
                document.getElementById("input-file").click();
              }}>Load</button
            >
            <input
              accept="application/json,"
              bind:files
              id="input-file"
              name="input-file"
              type="file"
              on:change={loadSettings}
            />
          </div>
        </div>
        <div class="button-row">
          <button
            type="button"
            on:click={() => {
              exportInAppMIDI();
            }}>Export complete roll as MIDI</button
          >
        </div>
      </fieldset>
      <fieldset>
        <legend>Visualization Settings</legend>
        <div>
          Draw Velocity Curves:
          <input type="checkbox" bind:checked={$drawVelocityCurves} />
        </div>
      </fieldset>
    {/if}
  {:else}
    <fieldset>
      <legend>Expression emulation not available</legend>
      <p>
        Modification of expression emulation settings is not yet available for
        this roll type, or this roll type does not have any controls for
        dynamics or pedaling.
      </p>
    </fieldset>
  {/if}
</div>
