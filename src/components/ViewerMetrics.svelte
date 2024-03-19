<style lang="scss">
  #viewer-metrics {
    background: rgba(0, 0, 0, 0.6);
    color: white;
    margin: 0 0.5em;
    border-radius: 0.25em;
    border: 0.1em solid #ffffff;
    padding: 0.2em 0.8em;
    transition: all 0.2s;
    display: inline-block;

    .metric {
      display: flex;
      min-height: 1.25em;
      justify-content: space-between;
      position: relative;
    }
  }
</style>

<script>
  import { currentTick, ticksPerSecond } from "../stores";
</script>

<div id="viewer-metrics">
  <div class="metric">
    <span>Feet per Minute:</span><span
      >{(($ticksPerSecond / 300 / 12) * 60).toFixed(2)}</span
    >
  </div>
  <div class="metric">
    <span>Time index:</span><span
      >{($currentTick / $ticksPerSecond).toFixed(1)}s</span
    >
  </div>
</div>
