<style lang="scss">
  button {
    @include button;
  }
  .exp-param {
    align-self: center;
    margin: 0 5px 0 0;
  }
  .param-value {
    max-width: 4rem;
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
  } from "../stores";

  export let reloadRoll;
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
              >{$expressionParameters.tunable[expressionParam].alias}</label
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
        <div id="reset-control">
          <button
            type="button"
            on:click={() => {
              reloadRoll(true);
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
