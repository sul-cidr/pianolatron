<style lang="scss">
  dl {
    display: block;
    overflow: auto;
    padding: 0.5em 1em 0em 0.5em;
  }

  dt {
    color: var(--cardinal-red-dark);
    font-family: SourceSerif4, serif;
    font-size: 0.9em;
    margin-top: 1em;
    margin-bottom: 0.2em;
    text-transform: uppercase;
    display: inline-block;
    width: 100%;

    &::first-letter {
      font-size: 1.3em;
    }

    &:not(.large)::after {
      content: ":";
    }
  }

  dd {
    color: var(--black);
    font-family: SourceSans3, sans-serif;
    display: inline;
    overflow-wrap: anywhere;

    &.large {
      font-size: 1.6em;
      display: block;
    }
    &.medium {
      font-size: 1.4em;
      display: block;
    }
  }

  dd:not(:has(a)) {
    text-transform: capitalize;
  }

  dd :global(span) {
    opacity: 0.5;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    line-height: 1rem;
    padding: 0 0 10px;

    a {
      font-size: 1rem;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .download-links {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding-left: 0.5rem;
    flex-wrap: wrap;

    a {
      text-transform: capitalize;
    }
  }

  .download-links a {
    text-decoration: none;
    text-transform: uppercase;
    font-weight: 1.2em;
    color: var(--link-blue);
    height: 20px;

    :global(svg) {
      height: 36px;
      width: 36px;
    }

    &:hover {
      color: var(--cardinal-red);
      border-color: var(--cardinal-red);
    }
  }
</style>

<script>
  import { onMount } from "svelte";

  import catalog from "../config/catalog.json";
  import IconButton from "../ui-components/IconButton.svelte";
  import {
    notify,
    clearNotification,
  } from "../ui-components/Notification.svelte";
  import { appMode } from "../stores";

  export let metadata;

  let dialogState = { midi: null, roll: null };

  // Allow values from the catalog to override the matching keys in the roll data
  // const catalogRecord = catalog.find((r) => r.druid === metadata.druid);
  // for (const [key, value] of Object.entries(metadata)) {
  //   if (catalogRecord[key] !== undefined && catalogRecord[key] !== value) {
  //     metadata[key] = catalogRecord[key];
  //   }
  // }

  const similarWorksByPerformer = metadata.performer
    ? catalog.filter(
        (w) => w.performer === metadata.performer && w.druid !== metadata.druid,
      )
    : [];

  const linkToDownload = (dialogType, itemType) => {
    // Create an ephemeral link to the image and click it
    const element = document.createElement("a");
    element.setAttribute("href", downloadLinks[dialogType][itemType]);
    if (itemType === "exp_midi")
      element.setAttribute("download", `${metadata.druid}_exp.mid`);
    else if (itemType === "note_midi")
      element.setAttribute("download", `${metadata.druid}_note.mid`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    // The dialog will close automatically, so make a note of that
    dialogState[dialogType] = null;
  };

  const downloadDialog = (dialogType) => {
    if (dialogState[dialogType] !== null) {
      // Don't allow more than one instance of a dialog type to appear
      clearNotification(dialogState[dialogType]);
      dialogState[dialogType] = null;
      return;
    }
    dialogState[dialogType] = notify({
      title:
        dialogType === "midi"
          ? "MIDI Download Options"
          : "Roll Image Download Options",
      type: "dialog",
      message: "",
      closable: true,
      callOnClose: () => {
        dialogState[dialogType] = null;
      },
      actions: Object.keys(downloadLinks[dialogType]).flatMap((itemType) =>
        activeLinks.includes(itemType)
          ? {
              label: linkLabels[itemType],
              fn: () => linkToDownload(dialogType, itemType),
            }
          : [],
      ),
    });
  };

  let activeLinks = ["exp_midi", "note_midi"];

  const linkLabels = {
    exp_midi: "Expression MIDI",
    note_midi: "Note MIDI",
    color_tiff: "Color TIFF",
    color_jp2: "Color JPEG 2000",
    green_tiff: "Green-Channel TIFF (Monochrome)",
    mono_jp2: "Infrared JPEG 2000 (Monochrome)",
  };

  const downloadLinks = {
    roll: {
      color_jp2: `https://stacks.stanford.edu/file/${metadata.druid}/${metadata.image_url.split("/").slice(-2, -1)[0]}.jp2`,
      color_tiff: `https://stacks.stanford.edu/file/${metadata.druid}/${metadata.image_url.split("/").slice(-2, -1)[0]}.tiff`,
      green_tiff: `https://stacks.stanford.edu/file/${metadata.druid}/${metadata.image_url.split("/").slice(-2, -1)[0]}_gr.tiff`,
      mono_jp2: `https://stacks.stanford.edu/file/${metadata.druid}/${metadata.image_url.split("/").slice(-2, -1)[0]}_ir.jp2`,
    },
    midi: {
      exp_midi: `/midi/${metadata.druid}.mid`,
      note_midi: `/note_midi/${metadata.druid}.mid`,
    },
  };

  const unavailable = "<span>Unavailable</span>";

  async function checkLink(url) {
    try {
      const response = await fetch(url, { method: "HEAD" });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  onMount(async () =>
    Object.entries(downloadLinks["roll"]).forEach(([imageType, imageLink]) =>
      checkLink(imageLink).then((res) =>
        res ? activeLinks.push(imageType) : null,
      ),
    ),
  );
</script>

<dl>
  <dt>Title</dt>
  <dd class="large">
    {@html metadata.title || unavailable}
  </dd>
  {#if metadata.performer}
    <dt>Performer</dt>
    <dd class="large">
      {@html metadata.performer || unavailable}
    </dd>
  {/if}
  <dt>Composer</dt>
  <dd class="large">
    {@html metadata.composer || unavailable}
  </dd>
  {#if metadata.arranger}
    <dt>Arranger</dt>
    <dd class="large">
      {@html metadata.arranger || unavailable}
    </dd>
  {/if}
  {#if metadata.original_composer}
    <dt>Composer (original)</dt>
    <dd class="large">
      {@html metadata.original_composer || unavailable}
    </dd>
  {/if}
  <dt>Label/Publisher</dt>
  <dd class="large">
    {@html metadata.label || unavailable}
  </dd>
  {#if similarWorksByPerformer.length > 0}
    <dt>Other Rolls Featuring This Performer</dt>
    <dd class="large">
      <ul>
        {#each similarWorksByPerformer as work}
          <li>
            <a
              href={`${$appMode === "perform" ? "/perform/" : "/"}?druid=${work.druid}`}
              target="_blank">{@html work.title}</a
            >
          </li>
        {/each}
      </ul>
    </dd>
  {/if}
  <dt>Library Records</dt>
  <dd>
    <div class="download-links">
      <a
        href={metadata.PURL}
        title="Record in the Stanford Digital Repository for roll {metadata.title}"
        target="_blank">Archive</a
      >
      |
      <a
        href="https://searchworks.stanford.edu/view/{metadata.catkey}"
        title="Stanford library catalog entry for roll {metadata.title}"
        target="_blank">Catalog</a
      >
    </div>
  </dd>
  {#if metadata.work}
    <dt>Work</dt>
    <dd class="large">
      {@html metadata.work || unavailable}
    </dd>
  {/if}
  <dt>Download</dt>
  <dd>
    <div class="download-links">
      <IconButton
        class="player-button"
        disabled={false}
        on:click={() => downloadDialog("midi")}
        iconName="midi"
        label="Download MIDI files for roll {metadata.title}"
        height="28"
        width="28"
        title="Download MIDI files for roll {metadata.title}"
      />
      <IconButton
        class="player-button"
        disabled={false}
        on:click={() => downloadDialog("roll")}
        iconName="roll-image"
        label="Download images for roll {metadata.title}"
        height="28"
        width="28"
        title="Download images for roll {metadata.title}"
      />
    </div>
  </dd>
  <dt>Roll Type</dt>
  <dd class="medium">
    {#if metadata.type === "welte-red"}
      T-100 “Red” Welte
    {:else if metadata.type === "welte-green"}
      T-98 “Green” Welte
    {:else if metadata.type === "welte-licensee"}
      Welte Licensee
    {:else if metadata.type === "duo-art"}
      Duo-Art
    {:else if metadata.type === "ampico-a"}
      Ampico (A)
    {:else if metadata.type === "ampico-b"}
      Ampico (B)
    {:else if metadata.type === "65-note"}
      65-note Pianola
    {:else}
      88-note Pianola
    {/if}
  </dd>
  {#if metadata.recording_date}
    <dt>Recorded</dt>
    <dd class="medium">
      {metadata.recording_date
        .replace("Recorded", "")
        .replace(/[-/\\^$*+?.()|[\]{}]/g, "")}
    </dd>
  {/if}
  {#if metadata.publish_date || metadata.publish_place}
    <dt>Published</dt>
    <dd class="medium">
      {#if metadata.publish_date}
        {metadata.publish_date.replace(/[\[\]]/g, "")}
      {/if}
      {#if metadata.publish_place}
        {#if metadata.publish_date}
          -
        {/if}
        {metadata.publish_place.replace(/[\[\]]/g, "")}
      {/if}
    </dd>
  {/if}
</dl>
