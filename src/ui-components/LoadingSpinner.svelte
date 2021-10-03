<style lang="scss">
  #loading {
    background-color: rgba(white, 0.4);
    color: var(--primary-accent);
    font-size: 1.4em;
    height: 100%;
    left: 0;
    pointer-events: none;
    position: absolute;
    text-align: center;
    text-shadow: 0px 0px 8px white;
    top: 0;
    width: 100%;
    z-index: 9;

    div {
      height: 40vh;
      margin: max(15%, 100px) auto 10px;
      width: 80%;
      overflow: hidden;

      mask-image: linear-gradient(
        to bottom,
        transparent 0%,
        black 30%,
        black 70%,
        transparent 100%
      );
    }
  }

  svg {
    width: 100%;
    animation: scroll 10s linear infinite;
  }

  rect {
    fill: var(--primary-accent);
  }

  span {
    position: absolute;
    display: block;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-shadow: 0px 0px 8px white;
    display: grid;
    place-items: center;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 1em;
    padding: 1em 3em;
  }

  @keyframes scroll {
    0% {
      transform: translate3d(0, -1618px, 0);
    }
    100% {
      transform: translate3d(0, 40vh, 0);
    }
  }
</style>

<script>
  import { fade } from "svelte/transition";

  export let showLoadingSpinner;
  export let loadingSpinnerText = "Loading resources...";
</script>

{#if showLoadingSpinner}
  <div id="loading" transition:fade>
    <div>
      <svg viewBox="0 0 4096 4315">
        <rect x="3782" y="1" width="42" height="43" rx="10" ry="10" />
        <rect x="415" y="247" width="42" height="74" rx="10" ry="10" />
        <rect x="263" y="484" width="42" height="84" rx="10" ry="10" />
        <rect x="946" y="1002" width="42" height="277" rx="10" ry="10" />
        <rect x="3632" y="1004" width="41" height="72" rx="10" ry="10" />
        <rect x="224" y="1064" width="42" height="71" rx="10" ry="10" />
        <rect x="1665" y="1438" width="41" height="130" rx="10" ry="10" />
        <rect x="2004" y="1438" width="42" height="216" rx="10" ry="10" />
        <rect x="1400" y="1439" width="41" height="271" rx="10" ry="10" />
        <rect x="1777" y="1445" width="42" height="98" rx="10" ry="10" />
        <rect x="1776" y="1768" width="42" height="73" rx="10" ry="10" />
        <rect x="1891" y="1768" width="42" height="92" rx="10" ry="10" />
        <rect x="1551" y="1773" width="42" height="92" rx="10" ry="10" />
        <rect x="2117" y="1773" width="42" height="153" rx="10" ry="10" />
        <rect x="2002" y="2068" width="42" height="97" rx="10" ry="10" />
        <rect x="2230" y="2068" width="42" height="86" rx="10" ry="10" />
        <rect x="1890" y="2069" width="42" height="91" rx="10" ry="10" />
        <rect x="1662" y="2077" width="41" height="83" rx="10" ry="10" />
        <rect x="1774" y="2323" width="42" height="79" rx="10" ry="10" />
        <rect x="2002" y="2328" width="41" height="146" rx="10" ry="10" />
        <rect x="2343" y="2333" width="42" height="111" rx="10" ry="10" />
        <rect x="2115" y="2340" width="41" height="67" rx="10" ry="10" />
        <rect x="1888" y="2575" width="42" height="116" rx="10" ry="10" />
        <rect x="2114" y="92593" width="42" height="109" rx="10" ry="10" />
        <rect x="2228" y="2593" width="42" height="109" rx="10" ry="10" />
        <rect x="2455" y="2593" width="42" height="194" rx="10" ry="10" />
        <rect x="3777" y="2666" width="42" height="60" rx="10" ry="10" />
        <rect x="257" y="2671" width="42" height="84" rx="10" ry="10" />
        <rect x="1998" y="2946" width="41" height="103" rx="10" ry="10" />
        <rect x="2225" y="2952" width="42" height="109" rx="10" ry="10" />
        <rect x="2340" y="2958" width="42" height="96" rx="10" ry="10" />
        <rect x="2566" y="2958" width="42" height="163" rx="10" ry="10" />
        <rect x="3813" y="2976" width="41" height="72" rx="10" ry="10" />
        <rect x="217" y="2992" width="42" height="73" rx="10" ry="10" />
        <rect x="3775" y="3166" width="42" height="79" rx="10" ry="10" />
        <rect x="254" y="3183" width="41" height="79" rx="10" ry="10" />
        <rect x="2450" y="3315" width="43" height="86" rx="10" ry="10" />
        <rect x="2338" y="3321" width="41" height="92" rx="10" ry="10" />
        <rect x="2109" y="3327" width="42" height="85" rx="10" ry="10" />
        <rect x="2678" y="3327" width="42" height="110" rx="10" ry="10" />
        <rect x="3811" y="3346" width="41" height="61" rx="10" ry="10" />
        <rect x="214" y="3368" width="42" height="85" rx="10" ry="10" />
        <rect x="3772" y="3677" width="41" height="79" rx="10" ry="10" />
        <rect x="250" y="3703" width="42" height="85" rx="10" ry="10" />
        <rect x="2335" y="3847" width="41" height="330" rx="10" ry="10" />
        <rect x="2106" y="3854" width="41" height="268" rx="10" ry="10" />
        <rect x="2447" y="3860" width="42" height="386" rx="10" ry="10" />
        <rect x="2675" y="3865" width="42" height="449" rx="10" ry="10" />
        <rect x="3807" y="3873" width="42" height="73" rx="10" ry="10" />
        <rect x="211" y="3875" width="42" height="85" rx="10" ry="10" />
        <rect x="3619" y="3904" width="42" height="79" rx="10" ry="10" />
      </svg>
    </div>
    <span>{loadingSpinnerText}</span>
  </div>
{/if}
