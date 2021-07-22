<style lang="scss">
  .notification {
    border-radius: 4px;
    box-shadow: 0 3px 6px rgb(0, 0, 0, 0.3);
    display: flex;
    justify-content: space-between;
    left: 50%;
    min-width: 400px;
    position: absolute;
    top: 20%;
    transform: translate(-50%);
    z-index: z($main-context, notifications);

    &.error {
      background: rgb(255, 72, 72);
      border: 1px solid rgb(235, 15, 15);
      border-left-width: 6px;
      color: white;

      :global(a) {
        color: white;
        font-weight: bold;
      }

      .close {
        color: white;
        border-left-color: rgba(255, 255, 255, 0.5);
      }
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
</style>

<script context="module">
  import { writable } from "svelte/store";

  const NotificationStore = writable();
  export const notify = (detail) => NotificationStore.set(detail);
</script>

{#if $NotificationStore}
  <div class="notification {$NotificationStore.type || 'default'}">
    <section>
      {#if $NotificationStore.title}
        <header>{$NotificationStore.title}</header>
      {/if}
      <p>{@html $NotificationStore.message}</p>
    </section>
    {#if $NotificationStore.closable !== false}
      <div class="close" on:click={() => NotificationStore.set()}>&times;</div>
    {/if}
  </div>
{/if}
