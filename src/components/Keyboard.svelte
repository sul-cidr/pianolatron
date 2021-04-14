<style lang="scss">
  $key-width: 1.8vw;
  $active-key-highlight: #b5e2ff;

  // black "housing"
  $grad0: #000;
  $grad3: #333;
  $grad5: #555;
  $grad6: #666;

  // brown "housing"
  $grad0: #3a1a05;
  $grad3: #5c371e;
  $grad5: #4c3a2e;
  $grad6: #5f4330;
  #keyboard {
    background: linear-gradient(
      -60deg,
      $grad0,
      $grad3,
      $grad0,
      $grad6,
      $grad3 70%
    );
    border-radius: 0 0 5px 5px;
    border: 2px solid $grad3;
    box-shadow: 0 2px 0 $grad6, 0 3px 0 $grad5, 0 4px 0 $grad3, 0 6px 6px $grad0,
      inset 0 -1px 1px rgba(white, 0.5), inset 0 -4px 5px $grad0;
    margin: 1em auto;
    position: relative;
    width: fit-content;
    padding: 0 2em;
  }

  div#keys {
    border-top: 2px solid #222;
    display: block;
    height: calc(#{$key-width} * 6);
    margin: 0;
    padding: 0;
    width: 100%;

    div {
      float: left;
      position: relative;
      width: $key-width;

      // White Keys
      :first-child {
        background: linear-gradient(-30deg, #f5f5f5, #fff);
        border-radius: 0 0 3px 3px;
        border: 1px solid #ccc;
        box-shadow: inset 0 1px 0px #fff, inset 0 -1px 0px #fff,
          inset 1px 0px 0px #fff, inset -1px 0px 0px #fff,
          0 4px 3px rgba(0, 0, 0, 0.7);
        display: block;
        height: calc(#{$key-width} * 6 - 20px);
      }
      :first-child:active,
      :global(:first-child.depressed) {
        box-shadow: 0 2px 2px rgba(0, 0, 0, 0.4);
        height: calc(#{$key-width} * 6 - 24px);
        position: relative;
        top: 2px;

        &:before {
          border-color: transparent transparent transparent rgba(0, 0, 0, 0.1);
          border-style: solid;
          border-width: calc(#{$key-width} * 6 - 24px) 5px 0px;
          content: "";
          height: 0px;
          left: 0px;
          position: absolute;
          top: 0px;
          width: 0px;
        }

        &:after {
          border-color: transparent rgba(0, 0, 0, 0.1) transparent transparent;
          border-style: solid;
          border-width: calc(#{$key-width} * 6 - 24px) 5px 0px;
          content: "";
          height: 0px;
          position: absolute;
          right: 0px;
          top: 0px;
          width: 0px;
        }
      }
      :global(:first-child.depressed) {
        background: $active-key-highlight;
      }

      // Black Keys
      :nth-child(2) {
        background: linear-gradient(-20deg, #333, #000, #333);
        border-color: #666 #222 #111 #555;
        border-radius: 0 0 2px 2px;
        border-style: solid;
        border-width: 1px 2px 7px;
        box-shadow: inset 0px -1px 2px rgba(255, 255, 255, 0.4),
          0 2px 3px rgba(0, 0, 0, 0.4);
        height: calc(#{$key-width} * 3);
        left: calc(#{$key-width} - 2px - #{$key-width / 4});
        position: absolute;
        top: 0px;
        width: $key-width / 2;
        z-index: 10;
      }

      :nth-child(2):active,
      :global(:nth-child(2).depressed) {
        border-bottom-width: 2px;
        box-shadow: inset 0px -1px 1px rgba(255, 255, 255, 0.4),
          0 1px 0px rgba(0, 0, 0, 0.8), 0 2px 2px rgba(0, 0, 0, 0.4),
          0 -1px 0px #000;
        height: calc(#{$key-width} * 3 + 3px);
      }
      :global(:nth-child(2).depressed) {
        background: $active-key-highlight;
      }
    }
  }
</style>

<script>
  export let keyCount = 87;
  export let activeNotes;
  const notes = [
    "A",
    "A#",
    "B",
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
  ];

  const keys = [];
  let keyNumber = 1;
  let octave = 0;
  while (keyNumber <= keyCount) {
    notes.forEach((note) => {
      if (note === "C") octave++;
      if (keyNumber > keyCount) return;
      if (note.endsWith("#")) {
        keys[keys.length - 1].push({
          "data-key": keyNumber + 20,
          title: `${note}${octave}`,
        });
      } else {
        keys.push([{ "data-key": keyNumber + 20, title: `${note}${octave}` }]);
      }
      keyNumber++;
    });
  }

  $: {
    document
      .querySelectorAll(".depressed")
      .forEach((el) => el.classList.remove("depressed"));
    $activeNotes.forEach((note) =>
      document
        .querySelector(`[data-key="${note}"]`)
        ?.classList.add("depressed"),
    );
  }
</script>

<div id="keyboard">
  <div id="keys">
    {#each keys as key}
      <div>
        {#each key as _key}
          <span title={_key.title} data-key={_key['data-key']} />
        {/each}
      </div>
    {/each}
  </div>
</div>
