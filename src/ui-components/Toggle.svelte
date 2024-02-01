<style lang="scss">
  // Based https://www.sarasoueidan.com/blog/toggle-switch-design/ 
  :root {
    --accent-color: CornflowerBlue;
    --gray: #ccc;
  }

  /* Multi Design Option */
  .toggle-multi .group-container {
    border: none;
    padding: 0;
    display: block;
    white-space: nowrap;
  }

  .toggle-multi .legend {
    padding: .75em 0;
  }
  
  .toggle-multi label {
    display: inline-block;
    position: relative;
    z-index: 2;
  }

  .toggle-multi input {
    opacity: 0;
    position: absolute;
  }

  .toggle-multi label:first-of-type {
    padding-right: 5em;
  }

  .toggle-multi label:last-child {
    margin-left: -5em;
    padding-left: 5em;
  }

  .toggle-multi:focus-within label:first-of-type:after {
    box-shadow: 0 0px 8px var(--accent-color);
    border-radius: 1.5em;
  }

  /* making the switch UI.  */
  .toggle-multi label:first-of-type:before,
  .toggle-multi label:first-of-type:after {
    content: "";
    height: 1.25em;
    overflow: hidden;
    pointer-events: none;
    position: absolute;
    vertical-align: middle;
  }

  .toggle-multi label:first-of-type:before {
    border-radius: 100%;
    z-index: 2;
    position: absolute;
    width: 1.2em;
    height: 1.2em;
    background: #fff;
    top: 0.2em;
    right: 1.2em;
    transition: transform 0.3s;
  }

  .toggle-multi label:first-of-type:after {
    background: var(--accent-color);
    border-radius: 1em;
    margin: 0 1em;
    transition: background 0.2s ease-in-out;
    width: 3em;
    height: 1.6em;
  }

  .toggle-multi input:first-of-type:checked ~ label:first-of-type:after {
    background: var(--gray);
  }

  .toggle-multi input:first-of-type:checked ~ label:first-of-type:before {
    transform: translateX(-1.4em);
  }

  .toggle-multi input:last-of-type:checked ~ label:last-of-type {
    z-index: 1;
  }

  .toggle-multi input:focus {
    box-shadow: 0 0px 8px var(--accent-color);
    border-radius: 1.5em;
  }

  /* Inner Design Option */
  [role="switch"][aria-checked="true"] :first-child,
  [role="switch"][aria-checked="false"] :last-child {
    border-radius: 0.25em;
    background: var(--accent-color);
    display: inline-block;
  }

</style>

<script>
  export let label;
  // keypairs of label / value
  export let options = [["off", 0], ["on", 1]];
  export let value = 1;
</script>

<div class="toggle-multi">
  <div
    role="radiogroup"
    class="group-container"
    aria-labelledby={`label-${label}`}
  >
    <div class="legend" id={`label-${label}`}>{label}</div>
    {#each options as option}
      <input
        type="radio"
        id={`${option[0]}-${label}`}
        value={option[1]}
        bind:group={value}
      />
      <label for={`${option[0]}-${label}`}>
        {option[0]}
      </label>
    {/each}
  </div>
</div>