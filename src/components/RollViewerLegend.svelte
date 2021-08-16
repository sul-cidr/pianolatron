<style lang="scss">
  div {
    background: rgba(0, 0, 0, 0.4);
    color: white;
    border-radius: 4px;
    padding: 8px;
    position: absolute;
    z-index: z($main-context, overlay-buttons);
    bottom: 1%;
    left: 1%;
    transition: background 0.5s ease;

    &:hover {
      background: rgba(0, 0, 0, 0.8);
    }
  }
  dt {
    height: 1em;
    width: 1em;
    border: 1px solid #eaeaea;
    float: left;
    margin-left: 0.5em;
    margin-right: 0.5em;
    border-radius: 4px;
    transition: background-color 0.25s ease;

    &.struck-out {
      background-color: none !important;

      + dd {
        text-decoration: line-through;
      }
    }
  }

  dd {
    span {
      display: inline-block;
      text-align: right;
      width: 3ch;
      margin-right: 1ch;
    }
  }

  span.heading {
    display: block;
    text-decoration: underline;
    padding: 0.25em 0;
    font-size: 1.2em;
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
</script>

<div>
  Tempo: {($tempoCoefficient * 100).toFixed(0)}%
  <br />
  Feet per Minute: {(($ticksPerSecond / 300 / 12) * 60).toFixed(2)}
  <hr />
  <dl>
    <dt
      style={$rollPedalingOnOff
        ? `background-color: hsl(${pedalHoleColor});`
        : ""}
      class:struck-out={!$rollPedalingOnOff}
    />
    <dd>Pedal Holes</dd>
    <dt
      style={$playExpressionsOnOff
        ? `background-color: hsl(${controlHoleColor});`
        : ""}
      class:struck-out={!$playExpressionsOnOff}
    />
    <dd>Control Holes</dd>
    {#if $userSettings.showNoteVelocities || $userSettings.highlightEnabledHoles}
      <span class="heading">Note Velocities</span>
      {#each holeColorMap as hsl, i}
        <dt style="background-color: hsl({hsl});" />
        <dd>
          <span>{((i / holeColorMap.length) * 100).toFixed(0)}</span> -
          <span>{(((i + 1) / holeColorMap.length) * 100).toFixed(0)}</span>%
        </dd>
      {/each}
    {:else}
      <dt style="background-color: hsl({defaultHoleColor});" />
      <dd>Note Holes</dd>
    {/if}
  </dl>
</div>
