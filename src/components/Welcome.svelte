<style lang="scss">
  article {
    background-color: white;
    border-radius: 5px;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.12), 0 1px 2px 0 rgba(0, 0, 0, 0.24);
    left: 50%;
    max-height: 80vh;
    max-width: 728px;
    padding: 20px;
    position: absolute;
    text-align: center;
    top: 10vh;
    transform: translate(-50%);
    width: calc(100% - 40px);
    z-index: z($main-context, notifications);
  }

  header {
    color: var(--primary-accent);
    font-family: $primary-typeface;
    font-size: 40px;
    font-weight: bold;
    text-decoration: underline;
    text-decoration-color: rgba(38, 50, 56, 0.2);
    width: 100%;
  }

  p {
    margin-top: 1em;
  }

  a {
    color: var(--primary-accent);
    text-decoration: none;
  }

  a:hover {
    color: #333;
    text-decoration: none;
  }

  button {
    float: right;
  }
</style>

<script context="module">
  import { writable } from "svelte/store";
  import { fly } from "svelte/transition";
  import { createPersistedStore } from "../lib/stores";

  export const showWelcomeScreen = writable(true);
  export const welcomeScreenInhibited = createPersistedStore(
    "welcomeScreenInhibited",
    false,
  );
</script>

<article
  transition:fly={{ y: -400 }}
  on:click={() => ($showWelcomeScreen = false)}
>
  <header>Welcome to the Pianolatron</header>
  <p>
    This site is under active development.<br />Please direct enquiries and
    feedback to
    <a href="mailto:contact-cidr@stanford.edu">contact-cidr@stanford.edu</a>.
    <a
      href="http://cidr.stanford.edu/"
      title="Center for Interdisciplinary Digital Research @ Stanford Libraries"
    >
      <img src="cidr.trsp.300x176.png" alt="CIDR logo" height="176" />
    </a>
  </p>
  <button
    on:click={() => {
      $welcomeScreenInhibited = true;
      $showWelcomeScreen = false;
    }}>Dismiss, and don't show again</button
  >
</article>

<svelte:window
  on:keydown={(event) => {
    if (event.code === "Escape") $showWelcomeScreen = false;
  }}
/>
