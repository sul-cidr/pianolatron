<style lang="scss">
  button {
    @include button;
  }
</style>

<script>
  import {
    expressionParameters,
    defaultExpressionParameters,
    rollHasExpressions,
    rollMetadata,
    expressionizer,
  } from "../stores";

  let expressionParams = null;

  let useExpressiveMidiFile = $expressionizer === "FROM_MIDI";
  let useInAppExpression = $expressionizer !== "FROM_MIDI";

  const updateExpressionParams = () => {
    expressionParams = $expressionParameters;
  };

  export let reloadRoll;

  /* eslint-disable no-unused-expressions, no-sequences */
  $: $expressionParameters, updateExpressionParams();
</script>

<div id="expression-panel">
  {#if !$rollHasExpressions || $rollMetadata.ROLL_TYPE === "welte-red" || $rollMetadata.ROLL_TYPE === "88-note"}
    <fieldset>
      <legend>Emulation Type</legend>

      <div class="setting">
        Expression MIDI:
        <input
          type="checkbox"
          bind:checked={useExpressiveMidiFile}
          on:click={() => {
            if ($expressionizer !== "FROM_MIDI") {
              $expressionizer = "FROM_MIDI";
              useExpressiveMidiFile = true;
              useInAppExpression = false;
              reloadRoll();
            }
          }}
        />
      </div>
      <div class="setting">
        In-App Expression:
        <input
          type="checkbox"
          bind:checked={useInAppExpression}
          on:click={() => {
            if ($expressionizer === "FROM_MIDI") {
              if ($rollMetadata.ROLL_TYPE === "welte-red") {
                $expressionizer = "welteRed";
              } else if ($rollMetadata.ROLL_TYPE === "88-note") {
                $expressionizer = "standard";
              }
              useExpressiveMidiFile = false;
              useInAppExpression = true;
              reloadRoll();
            }
          }}
        />
      </div>
    </fieldset>

    {#if $expressionizer !== "FROM_MIDI" && expressionParams}
      <fieldset>
        <legend>Expression Settings</legend>
        {#each Object.keys(expressionParams) as expressionParam}
          <div>
            <label
              >{expressionParam}
              <input
                type="number"
                name={expressionParam}
                bind:value={expressionParams[expressionParam]}
                on:change={() =>
                  ($expressionParameters[expressionParam] =
                    expressionParams[expressionParam])}
              />
            </label>
          </div>
        {/each}
        <div id="reset-control">
          <button
            type="button"
            on:click={() => {
              // XXX Ideally this would use some fancier logic from stores.js to
              // set the default values and revert to them when the reset button
              // is pressed.
              if ($defaultExpressionParameters !== null) {
                $expressionParameters = JSON.parse(
                  JSON.stringify($defaultExpressionParameters),
                );
                expressionParams = $expressionParameters;
              }
            }}>Reset to Defaults</button
          >
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
