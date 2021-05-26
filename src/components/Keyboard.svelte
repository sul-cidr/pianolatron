<style lang="scss">
  $active-key-highlight: #b5e2ff;
  $felt-strip-height: 2%;

  #keyboard {
    display: flow-root;
    margin: 1vh 1vw;
    aspect-ratio: 10 / 1;
    z-index: z($main-context, keyboard);
    position: relative;

    &:hover :global(.overlay-buttons) {
      opacity: 1;
    }
  }

  @supports not (aspect-ratio: 10 / 1) {
    #keyboard {
      padding-top: 10%;
    }
    div#keys {
      top: 0;
    }
  }

  div#keys {
    position: absolute;
    display: flex;
    padding: 0;
    height: 100%;
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
      box-shadow: 0 1px 1px rgba(0, 0, 0, 0.7), 1px 0 1px rgba(0, 0, 0, 0.7),
        -1px 0 1px rgba(0, 0, 0, 0.7);
      z-index: 1;
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
        z-index: 1;
        transform: translateX(-50%);
      }

      :global(:nth-child(2).depressed) {
        background: $active-key-highlight;
        border-bottom-width: 2px;
        box-shadow: inset 0 -1px 1px rgba(255, 255, 255, 0.4),
          0 1px 0 rgba(0, 0, 0, 0.8), 0 2px 2px rgba(0, 0, 0, 0.4),
          0 -1px 0 #000;
        height: 57%;
      }
    }
  }
  div.pedal {
    // SVG pedals are wrapped in <div/> tags because SVG animation performance sucks
    //  so badly on Chromium-based browsers on Mac OS that the whole app suffers.
    filter: drop-shadow(0px 8px 3px black) saturate(0.4);
    margin: 0 4%;
    transform: rotate3d(1, 0, 0, 30deg);
    transform-origin: top;
    transition: all 0.1s ease;
    left: 38%;
    position: relative;
    margin-top: -25px;
    cursor: pointer;
    width: 3%;
    display: inline-block;

    &.depressed {
      filter: drop-shadow(0px 4px 2px black) saturate(0.6);
      transform: rotate3d(0, 0, 0, 0);
    }

    svg {
      width: 100%;
    }
  }
</style>

<script>
  import { softOnOff, sustainOnOff } from "../stores";
  import KeyboardControls from "./KeyboardControls.svelte";

  export let keyCount = 88;
  export let startNote;
  export let stopNote;
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
          note: keyNumber + 20,
          title: `${note}${octave}`,
        });
      } else {
        keys.push([{ note: keyNumber + 20, title: `${note}${octave}` }]);
      }
      keyNumber += 1;
    }
  }

  let mouseDown = false;
  let playing = new Set();
  const stopPlaying = () => {
    playing.forEach(stopNote);
    playing = new Set();
  };
</script>

<div id="keyboard">
  <div
    id="keys"
    on:mousedown|preventDefault={({ target }) => {
      const note = parseInt(target.dataset.key, 10);
      mouseDown = true;
      playing = playing.add(note);
      startNote(note);
    }}
    on:mouseup|preventDefault={({ target }) => {
      const note = parseInt(target.dataset.key, 10);
      playing.delete(note);
      playing = playing;
      stopNote(note);
    }}
    on:mousemove|preventDefault={({ target }) => {
      if (mouseDown) {
        const note = parseInt(target.dataset.key, 10);
        if (note && !playing.has(note)) {
          stopPlaying();
          playing = playing.add(note);
          startNote(note);
        }
      }
    }}
  >
    {#each keys as key}
      <div>
        {#each key as { title, note }}
          <span
            {title}
            data-key={note}
            class:depressed={$activeNotes.has(note) || playing.has(note)}
          />
        {/each}
      </div>
    {/each}
  </div>
  <KeyboardControls />
</div>

<svelte:window
  on:mouseup={() => {
    stopPlaying();
    mouseDown = false;
  }}
/>

<svg style="display: none">
  <symbol id="pedal" viewBox="0 0 12.4 16.3">
    <path
      d="M10 0v5.7c0 .9.3 2.2 1 3.5.7 1.4 1.4 3.3 1.4 4.3 0 1.3-1.9 2.8-6.2 2.8-4.4 0-6.2-1.5-6.2-2.8 0-1 .6-2.9 1.4-4.3a28.2 14.1 0 0 0 1-3.5V0z"
      style="fill:#996a01"
    />
    <path
      d="m10.5 9-.7-1.7c-.2-.7-.2-1.3-.2-1.8V0h-7v5.5c0 .5 0 1.1-.2 1.8L1.7 9a43 21.5 0 0 0-1.3 4.3c0 1.3 1.7 2.9 5.6 2.9 4.1 0 5.8-1.6 5.8-3 0-1-.5-2.8-1.3-4.2"
      style="fill:#eed072"
    />
    <path
      d="M9.1 0v5.2a8 8 0 0 0 .8 4c.7 1.5 1 3.3 1 4.3 0 .8-.9 2.4-4.7 2.4-3.8 0-4.8-1.6-4.8-2.4 0-1 .4-2.8 1.1-4.2.7-1.6.7-3 .7-4V0z"
      style="fill:#d7a735"
    />
    <path
      d="M10.5 13.5v-.6c0-.6-.4-.4-.5 0-.2.3-1 1.9-3.8 1.9s-3.7-1.6-4-2c0-.3-.3-.5-.4 0v.7c0 .7.8 2.2 4.4 2.2 3.4 0 4.3-1.5 4.3-2.2"
      style="fill:#eed072"
    />
    <path
      d="M6.1 15.2c.5 0 1.3 0 1.7-.2.5 0 1 0 .6.2a3.1 1.6 0 0 1-2.3.4c-.9 0-1.8-.2-2.2-.4-.4-.3 0-.3.6-.2l1.6.2"
      style="fill:#fff"
    />
  </symbol>
</svg>

<div
  class="pedal"
  on:mousedown={() => ($softOnOff = true)}
  on:mouseup={() => ($softOnOff = false)}
  on:mouseout={() => ($softOnOff = false)}
  class:depressed={$softOnOff}
>
  <svg xmlns="http://www.w3.org/2000/svg" width="46.9" height="61.6">
    <use href="#pedal" />
  </svg>
</div>

<div
  class="pedal"
  on:mousedown={() => ($sustainOnOff = true)}
  on:mouseup={() => ($sustainOnOff = false)}
  on:mouseout={() => ($sustainOnOff = false)}
  class:depressed={$sustainOnOff}
>
  <svg xmlns="http://www.w3.org/2000/svg" width="46.9" height="61.6">
    <use href="#pedal" />
  </svg>
</div>
