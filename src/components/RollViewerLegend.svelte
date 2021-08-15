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
  }
</style>

<script>
  import { tempoCoefficient, ticksPerSecond } from "../stores";
</script>

<div>
  Tempo: {($tempoCoefficient * 100).toFixed(0)}%
  <br />
  Inches per second: {($ticksPerSecond / 300).toFixed(2)}
</div>
