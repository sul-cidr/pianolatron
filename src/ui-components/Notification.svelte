<style lang="scss">
  .notifications {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    left: 50%;
    min-width: 400px;
    position: absolute;
    top: 5vh;
    transform: translate(-50%);
    z-index: z($main-context, notifications);
  }

  .notification {
    border-left-width: 6px;
    border-radius: 4px;
    box-shadow:
      0 1px 3px 0 rgba(0, 0, 0, 0.12),
      0 1px 2px 0 rgba(0, 0, 0, 0.24);
    color: white;
    display: flex;
    justify-content: space-between;

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
        border-left-color: var(--primary-accent-semiopaque);
        color: var(--primary-accent);
      }
    }

    &.success {
      background: #30ba0e;
      border: 1px solid desaturate(darken(#30ba0e, 12), 10);
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

  .modal-screen {
    background-color: rgba(black, 0.6);
    height: 100vh;
    left: 0;
    position: absolute;
    top: 0;
    width: 100vw;
    z-index: z($main-context, modal-screen);
  }
</style>

<script context="module">
  import { writable } from "svelte/store";
  import { fly, fade } from "svelte/transition";

  const NotificationsStore = writable([]);
  const timeouts = {};
  let nextId = 0;

  export const clearNotification = (id) => {
    clearTimeout(timeouts[id]);
    delete timeouts[id];
    NotificationsStore.update((notifications) =>
      notifications.filter((notification) => notification.id !== id),
    );
  };

  export const notify = (detail) => {
    const id = nextId;
    nextId += 1;
    NotificationsStore.update((notifications) => [
      ...notifications,
      { id, ...detail },
    ]);
    if (detail.timeout) {
      timeouts[id] = setTimeout(() => clearNotification(id), detail.timeout);
    }
  };
</script>

<script>
  import { onDestroy } from "svelte";

  onDestroy(() =>
    Object.values(timeouts).forEach((timeout) => clearTimeout(timeout)),
  );
</script>

{#if $NotificationsStore}
  {#if $NotificationsStore.some((notification) => notification.modal)}
    <div class="modal-screen" transition:fade />
  {/if}
  <div class="notifications">
    {#each $NotificationsStore as notification (notification.id)}
      <div
        transition:fly={{
          y: -200,
          duration: notification.timeout ? 1000 : 400,
        }}
        class="notification {notification.type || 'default'}"
      >
        <section>
          {#if notification.title}
            <header>{notification.title}</header>
          {/if}
          <p>{@html notification.message}</p>
          {#each notification.actions || [] as action}
            <button
              on:click={() => {
                clearNotification(notification.id);
                action.fn();
              }}>{action.label}</button
            >
          {/each}
        </section>
        {#if notification.closable !== false}
          <div
            class="close"
            role="button"
            tabindex="0"
            on:click={() => clearNotification(notification.id)}
            on:keypress={(event) => {
              if (event.code === "Enter") clearNotification(notification.id);
            }}
          >
            X
          </div>
        {/if}
      </div>
    {/each}
  </div>
{/if}
