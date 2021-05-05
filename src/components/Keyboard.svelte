<style lang="scss">
  $key-width: 1.8vw;
  $active-key-highlight: #b5e2ff;
  $felt-strip-height: 2px;

  #keyboard {
    display: flow-root;
    margin: 1em auto;
    position: relative;
    width: max-content;
  }

  div#keys {
    display: block;
    height: calc(#{$key-width} * 6);
    margin-top: $felt-strip-height;
    padding: 0;
    width: 100%;

    &::before {
      background-color: var(--primary-accent);
      background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAICAYAAADeM14FAAAAfUlEQVQYVyXMoQ3AIBBG4f92qEIiLkyAqmQBBmAChmgXqOwO1GHOMQEOhWQBJqhqQu2XvEelFL7vG601hBBA3ntWSuG6LjjnQDFGft8XtVZYa0HGGB5jYN/3haS15m3bcBzHD713Timt/jxPkIhwzhlzTsQY/+nzPGsoIvgAaMAzN5CzOpMAAAAASUVORK5CYII=);
      content: "";
      position: absolute;
      top: 0;
      height: $felt-strip-height;
      left: 0;
      right: 0;
      box-shadow: 0 1px 1px rgba(0, 0, 0, 0.7), 1px 0px 1px rgba(0, 0, 0, 0.7),
        -1px 0px 1px rgba(0, 0, 0, 0.7);
      z-index: 3;
    }

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
        height: calc(#{$key-width} * 3 + 1px);
      }

      :global(:nth-child(2).depressed) {
        background: $active-key-highlight;
      }
    }
  }
</style>

<script>
  export let keyCount = 88;
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
    for (let i = 0; i < notes.length; i += 1) {
      const note = notes[i];
      if (note === "C") octave += 1;
      if (keyNumber > keyCount) break;
      if (note.endsWith("#")) {
        keys[keys.length - 1].push({
          "data-key": keyNumber + 20,
          title: `${note}${octave}`,
        });
      } else {
        keys.push([{ "data-key": keyNumber + 20, title: `${note}${octave}` }]);
      }
      keyNumber += 1;
    }
  }
</script>

<div id="keyboard">
  <div id="keys">
    {#each keys as key}
      <div>
        {#each key as _key}
          <span
            title={_key.title}
            data-key={_key['data-key']}
            class:depressed={$activeNotes.has(_key['data-key'])}
          />
        {/each}
      </div>
    {/each}
  </div>
</div>
