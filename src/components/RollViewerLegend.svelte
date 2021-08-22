<style lang="scss">
  div {
    background: rgba(0, 0, 0, 0.4);
    color: white;
    border-radius: 4px;
    padding: 15px 15px 8px 8px;
    position: absolute;
    z-index: z($main-context, overlay-buttons);
    bottom: 1%;
    left: 1%;
    transition: background 0.5s ease, transform 0.5s ease;

    &:hover {
      background: rgba(0, 0, 0, 0.8);
    }

    &.collapsed {
      overflow: hidden;
      transform: translate(calc(-100% - -25px), calc(100% - 25px));
      bottom: 0;
      left: 0;
    }
  }
  dt {
    height: 1em;
    width: 1em;
    float: left;
    margin-right: 0.5em;
    border-radius: 4px;
    transition: background-color 0.25s ease;

    &.disabled {
      background-color: none !important;
    }
  }

  dl:not(.hole-color-legend) dd span {
    display: inline-block;
    text-align: right;
    width: 3ch;
    margin-right: 1ch;
  }

  dl.hole-color-legend {
    margin-top: 0.5em;

    dt {
      height: 8em;
    }

    dd {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 8em;
    }
  }

  span.heading {
    display: block;
    text-decoration: underline;
    padding: 0.25em 0;
    font-size: 1.2em;
  }

  input {
    display: none;
  }

  label {
    position: absolute;
    top: 0;
    right: 0;
    width: 15px;
    height: 15px;
    margin: 5px;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.5s ease, opacity 0.5s ease;
    opacity: 0.4;

    background: linear-gradient(
      to bottom left,
      transparent 0%,
      transparent 50%,
      #fff 50%,
      #fff 100%
    );
  }

  .collapsed label {
    transform: rotate(0.5turn);
  }

  div:hover label {
    opacity: 1;
  }
</style>

<script>
  import {
    tempoCoefficient,
    ticksPerSecond,
    rollPedalingOnOff,
    playExpressionsOnOff,
    userSettings,
  } from "../stores";

  export let defaultHoleColor;
  export let pedalHoleColor;
  export let controlHoleColor;
  export let holeColorMap;

  let collapsed = false;
</script>

<div class:collapsed>
  <label><input type="checkbox" bind:checked={collapsed} /></label>
  Tempo: {($tempoCoefficient * 100).toFixed(0)}%
  <br />
  Feet per Minute: {(($ticksPerSecond / 300 / 12) * 60).toFixed(2)}
  <hr />
  <dl>
    <dt
      style={$rollPedalingOnOff
        ? `background-color: hsl(${pedalHoleColor});`
        : ""}
      class:disabled={!$rollPedalingOnOff}
    />
    <dd>Pedal Holes</dd>
    <dt
      style={$playExpressionsOnOff
        ? `background-color: hsl(${controlHoleColor});`
        : ""}
      class:disabled={!$playExpressionsOnOff}
    />
    <dd>Control Holes</dd>
    {#if !$userSettings.showNoteVelocities && !$userSettings.highlightEnabledHoles}
      <dt style="background-color: hsl({defaultHoleColor});" />
      <dd>Note Holes</dd>
    {/if}
  </dl>
  {#if $userSettings.showNoteVelocities || $userSettings.highlightEnabledHoles}
    <dl class="hole-color-legend">
      <dt
        style={`background: linear-gradient(180deg, ${holeColorMap
          .map(
            (hsl, i) => `hsl(${hsl}) ${(i / (holeColorMap.length - 1)) * 100}%`,
          )
          .join(", ")})`}
      />
      <dd>
        <span>↑ lower</span><span>Note Velocity</span><span>↓ higher</span>
      </dd>
    </dl>
  {/if}
</div>
