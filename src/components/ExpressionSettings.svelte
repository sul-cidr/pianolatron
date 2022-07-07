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
    expressionizer,
  } from "../stores";

  let expressionParams = $expressionParameters;
  let expressionType =
    $expressionizer === "FROM_MIDI" ? "Expression MIDI" : "In-App Expression";

  const updateExpressionParams = () => {
    expressionParams = $expressionParameters;
  };

  export let reloadRoll;

  /* eslint-disable no-unused-expressions, no-sequences */
  $: $expressionParameters, updateExpressionParams();
  $: $rollMetadata, updateExpressionParams();
</script>

<div id="expression-panel">
  {#if !$rollHasExpressions || ["welte-red", "welte-green", "welte-licensee", "duo-art", "88-note"].includes($rollMetadata.ROLL_TYPE)}
    <fieldset>
      <legend>Emulation Type</legend>
      <select
        bind:value={expressionType}
        on:change={() => {
          if (expressionType === "Expression MIDI") {
            $expressionizer = "FROM_MIDI";
          } else if ($rollMetadata.ROLL_TYPE === "welte-red") {
            $expressionizer = "welteRed";
          } else if ($rollMetadata.ROLL_TYPE === "welte-green") {
            $expressionizer = "welteGreen";
          } else if ($rollMetadata.ROLL_TYPE === "welte-licensee") {
            $expressionizer = "welteLicensee";
          } else if ($rollMetadata.ROLL_TYPE === "duo-art") {
            $expressionizer = "duoArt";
          } else if ($rollMetadata.ROLL_TYPE === "88-note") {
            $expressionizer = "standard";
          }
          reloadRoll();
        }}
      >
        <option value="Expression MIDI">Expression MIDI</option>
        <option value="In-App Expression">In-App Expression</option>
      </select>
    </fieldset>

    {#if $expressionizer !== "FROM_MIDI" && expressionParams !== undefined && expressionParams.tunable !== undefined}
      <fieldset>
        <legend>Expression Settings</legend>
        {#each Object.keys(expressionParams.tunable) as expressionParam}
          <div>
            <label class="exp-param" for={`"input_"{expressionParam}`}
              >{expressionParam}</label
            >
            <div>
              <input
                class="param-value"
                id={`"input_"{expressionParam}`}
                type="number"
                value={expressionParams.tunable[expressionParam]}
                on:change={(e) => {
                  $expressionParameters.tunable[expressionParam] = parseFloat(
                    e.target.value,
                  );
                  expressionParams.tunable[expressionParam] = parseFloat(
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
              // XXX Ideally this would use some fancier logic from stores.js to
              // set the default values and revert to them when the reset button
              // is pressed.
              if ($defaultExpressionParameters !== null) {
                $expressionParameters = JSON.parse(
                  JSON.stringify($defaultExpressionParameters),
                );
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
