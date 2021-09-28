<style lang="scss">
  .notification {
    border-radius: 4px;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.12), 0 1px 2px 0 rgba(0, 0, 0, 0.24);
    display: flex;
    justify-content: space-between;
    left: 50%;
    min-width: 400px;
    position: absolute;
    top: 10vh;
    transform: translate(-50%);
    z-index: z($main-context, notifications);
    border-left-width: 6px;

    color: white;

    :global(a) {
      color: white;
      font-weight: bold;
    }

    &.default {
      background: white;
      border: 1px solid var(--primary-accent);
      color: black;

      header {
        color: var(--primary-accent);
      }

      .close {
        color: var(--primary-accent);
        border-left-color: var(--primary-accent-semiopaque);
      }
    }

    &.success {
      background: #8bc34a;
      border: 1px solid desaturate(darken(#8bc34a, 12), 10);
    }

    &.error {
      background: rgb(255, 72, 72);
      border: 1px solid rgb(235, 15, 15);
    }
  }

  section {
    display: flex;
    flex-direction: column;
    padding: 0.75em 0.5em;
    width: 100%;
  }

  header {
    font-size: 1.25em;
    font-weight: bold;
    padding: 0 0.25em 0.25em;
    margin-bottom: 0.5em;
  }

  p {
    margin: 0;
    padding: 0.25em;
  }

  .close {
    align-items: center;
    border-left: 1px solid rgba(0, 0, 0, 0.2);
    cursor: pointer;
    display: flex;
    font-weight: bold;
    padding: 0 6px;
  }

  button {
    @include button;
    margin-left: 1em;
    margin-right: 1em;

    &:first-of-type {
      margin-top: 1em;
    }
  }
</style>

<script context="module">
  import { writable } from "svelte/store";
  import { fly } from "svelte/transition";

  const NotificationStore = writable();
  let timeout;

  export const notify = (detail) => NotificationStore.set(detail);
  export const clearNotification = () => {
    clearTimeout(timeout);
    NotificationStore.set();
  };
</script>

<script>
  $: if ($NotificationStore?.timeout)
    timeout = setTimeout(NotificationStore.set, $NotificationStore?.timeout);
</script>

{#if $NotificationStore}
  <div
    transition:fly={{
      y: -200,
      duration: $NotificationStore.timeout ? 1000 : 400,
    }}
    class="notification {$NotificationStore.type || 'default'}"
  >
    <section>
      {#if $NotificationStore.title}
        <header>{$NotificationStore.title}</header>
      {/if}
      <p>{@html $NotificationStore.message}</p>
      {#each $NotificationStore.actions || [] as action}
        <button
          on:click={() => {
            clearNotification();
            action.fn();
          }}>{action.label}</button
        >
      {/each}
    </section>
    {#if $NotificationStore.closable !== false}
      <div class="close" on:click={clearNotification}>&times;</div>
    {/if}
  </div>
{/if}
