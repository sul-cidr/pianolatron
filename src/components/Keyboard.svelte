<style lang="scss">
  $active-key-highlight: #b5e2ff;
  $felt-strip-height: 2%;

  #keyboard {
    display: flow-root;
    margin: 1em;
    aspect-ratio: 10 / 1;
  }

  div#keys {
    position: relative;
    display: flex;
    padding: 0;
    height: 100%;

    &::before {
      background-color: var(--primary-accent);
      background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAICAYAAADeM14FAAAAfUlEQVQYVyXMoQ3AIBBG4f92qEIiLkyAqmQBBmAChmgXqOwO1GHOMQEOhWQBJqhqQu2XvEelFL7vG601hBBA3ntWSuG6LjjnQDFGft8XtVZYa0HGGB5jYN/3haS15m3bcBzHD713Timt/jxPkIhwzhlzTsQY/+nzPGsoIvgAaMAzN5CzOpMAAAAASUVORK5CYII=);
      content: "";
      position: absolute;
      top: 0;
      height: $felt-strip-height;
      left: 0;
      right: 0;
      box-shadow: 0 1px 1px rgba(0, 0, 0, 0.7), 1px 0 1px rgba(0, 0, 0, 0.7),
        -1px 0 1px rgba(0, 0, 0, 0.7);
      z-index: 3;
    }

    div {
      position: relative;
      flex: 1 0 auto;

      // White Keys
      :first-child {
        background: linear-gradient(-30deg, #f5f5f5, #fff);
        border-radius: 0 0 4% 4%;
        border: 1px solid #ccc;
        box-shadow: inset 0 1px 0 #fff, inset 0 -1px 0 #fff, inset 1px 0 0 #fff,
          inset -1px 0 0 #fff, 0 4px 3px rgba(0, 0, 0, 0.7);
        display: block;
        height: 100%;
      }

      :first-child:active,
      :global(:first-child.depressed) {
        box-shadow: 0 2px 2px rgba(0, 0, 0, 0.4);
        height: 98%;
        position: relative;
        top: 2px;

        &:before {
          background: rgba(0, 0, 0, 0.1);
          content: "";
          bottom: 0;
          position: absolute;
          left: 0;
          top: 0;
          width: 10%;
        }

        &:after {
          background: rgba(0, 0, 0, 0.1);
          content: "";
          bottom: 0;
          position: absolute;
          right: 0;
          top: 0;
          width: 10%;
        }
      }

      :global(:first-child.depressed) {
        background: $active-key-highlight;
      }

      // Black Keys
      :nth-child(2) {
        background: linear-gradient(-20deg, #333, #000, #333);
        border-color: #666 #222 #111 #555;
        border-radius: 0 0 3% 3%;
        border-style: solid;
        border-width: 1px 2px 7px;
        box-shadow: inset 0 -1px 2px rgba(255, 255, 255, 0.4),
          0 2px 3px rgba(0, 0, 0, 0.4);
        height: 56%;
        left: 100%;
        position: absolute;
        top: $felt-strip-height;
        width: 50%;
        z-index: 10;
        transform: translateX(-50%);
      }

      :nth-child(2):active,
      :global(:nth-child(2).depressed) {
        border-bottom-width: 2px;
        box-shadow: inset 0 -1px 1px rgba(255, 255, 255, 0.4),
          0 1px 0 rgba(0, 0, 0, 0.8), 0 2px 2px rgba(0, 0, 0, 0.4),
          0 -1px 0 #000;
        height: 57%;
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
