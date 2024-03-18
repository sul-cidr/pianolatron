<style lang="scss">
  button {
    @include button;
  }
  .exp-param {
    align-self: center;
    margin: 0 10px 0 0;
  }
  .param-value {
    max-width: 100px;
  }
</style>

<script>
  import {
    expressionParameters,
    defaultExpressionParameters,
    rollHasExpressions,
    rollMetadata,
    useInAppExpression,
    drawVelocityCurves,
  } from "../stores";

  export let reloadRoll;

  let currentRollType = $rollMetadata.ROLL_TYPE;

  const resetExpressionSettings = (forceReset) => {
    // Load the defaults when the roll type changes or Reset button is clicked
    if (!forceReset && $rollMetadata.ROLL_TYPE === currentRollType) return;

    if ($defaultExpressionParameters !== null) {
      $expressionParameters = JSON.parse(
        JSON.stringify($defaultExpressionParameters),
      );
    }
    currentRollType = $rollMetadata.ROLL_TYPE;
  };

  /* eslint-disable no-unused-expressions, no-sequences */
  $: $rollMetadata, resetExpressionSettings(false);
</script>

<div id="expression-panel">
  {#if !$rollHasExpressions || ["welte-red", "welte-green", "welte-licensee", "duo-art", "88-note"].includes($rollMetadata.ROLL_TYPE)}
    <fieldset>
      <legend>Emulation Type</legend>
      <select bind:value={$useInAppExpression} on:change={reloadRoll}>
        <option value={false}>Expression MIDI</option>
        <option value={true}>In-App Expression</option>
      </select>
    </fieldset>

    {#if $useInAppExpression}
      <fieldset>
        <legend>Expression Settings</legend>
        {#each Object.keys($expressionParameters.tunable || {}) as expressionParam}
          <div>
            <label class="exp-param" for={`"input_"{expressionParam}`}
              >{expressionParam}</label
            >
            <div>
              <input
                class="param-value"
                id={`"input_"{expressionParam}`}
                type="number"
                value={$expressionParameters.tunable[expressionParam]}
                on:change={(e) => {
                  $expressionParameters.tunable[expressionParam] = parseFloat(
                    e.target.value,
                  );
                  $expressionParameters.tunable[expressionParam] = parseFloat(
                    e.target.value,
                  );
                  reloadRoll();
                }}
              />
            </div>
          </div>
        {/each}
        <div id="reset-control">
          <button
            type="button"
            on:click={() => {
              resetExpressionSettings(true);
              reloadRoll();
            }}>Reset to Defaults</button
          >
        </div>
      </fieldset>
      <fieldset>
        <legend>Visualization Settings</legend>
        <div>
          Draw Velocity Curves
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
