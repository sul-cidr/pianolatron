<script context="module">
  import MidiPlayer from "midi-player-js";

  const decodeHtmlEntities = (string) =>
    string
      .replace(/&#(\d+);/g, (match, num) => String.fromCodePoint(num))
      .replace(/&#x([A-Za-z0-9]+);/g, (match, num) =>
        String.fromCodePoint(parseInt(num, 16)),
      );

  export const midiSamplePlayer = new MidiPlayer.Player();
  export let rollMetadata;
  midiSamplePlayer.on("fileLoaded", () => {
    const metadataTrack = midiSamplePlayer.events[0];
    /* @IMAGE_WIDTH and @IMAGE_LENGTH should be the same as from viewport._contentSize
     * Can't think of why they wouldn't be, but maybe check anyway. Would need to scale
     * all pixel values if so.
     * Other potentially useful values, e.g., for drawing overlays:
     * @ROLL_WIDTH (this is smaller than the image width)
     * @HARD_MARGIN_TREBLE
     * @HARD_MARGIN_BASS
     * @HOLE_SEPARATION
     * @HOLE_OFFSET
     * All of the source/performance/recording metadata is in this track as well.
     */

    rollMetadata = Object.fromEntries(
      metadataTrack
        .filter((event) => event.name === "Text Event")
        .map((event) =>
          event.string
            .match(/^@([^:]*):[\t\s]*(.*)$/)
            .slice(1, 3)
            .map((value) => decodeHtmlEntities(value)),
        ),
    );
  });
</script>
