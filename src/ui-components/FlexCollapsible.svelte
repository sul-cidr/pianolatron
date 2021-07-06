<style lang="scss">
  input {
    display: none;
  }

  .flex-collapsible {
    transition: all 0.3s ease;

    > div {
      bottom: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5em;
      overflow: visible;
      padding: 0.5em;
      position: absolute;
      top: 0;
    }

    &:hover {
      &:not(.hidden) {
        box-shadow: 2px -3px 3px rgba(0, 0, 0, 0.4);

        &.left {
          box-shadow: -2px -3px 3px rgba(0, 0, 0, 0.4);
        }
      }

      label {
        opacity: 1;
      }
    }

    &.left {
      label {
        left: -40px;
        border-radius: 4px 0 0 4px;

        &::after {
          content: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="white" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="14" y1="12" x2="4" y2="12" /><line x1="14" y1="12" x2="10" y2="16" /><line x1="14" y1="12" x2="10" y2="8" /><line x1="20" y1="4" x2="20" y2="20" /></svg>');
        }
      }
    }
  }

  .hidden {
    label {
      opacity: 1;

      &::after {
        content: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="white" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="20" y1="12" x2="10" y2="12" /><line x1="20" y1="12" x2="16" y2="16" /><line x1="20" y1="12" x2="16" y2="8" /><line x1="4" y1="4" x2="4" y2="20" /></svg>');
      }
    }

    &.left label::after {
      content: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="white" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="12" x2="14" y2="12" /><line x1="4" y1="12" x2="8" y2="16" /><line x1="4" y1="12" x2="8" y2="8" /><line x1="20" y1="4" x2="20" y2="20" /></svg>');
    }
  }

  label {
    background: rgba(0, 0, 0, 0.4);
    border-radius: 0 4px 4px 0;
    cursor: pointer;
    display: grid;
    height: 40px;
    left: 100%;
    opacity: 0;
    place-items: center;
    position: relative;
    top: 1em;
    transition: all 0.3s ease;
    width: 40px;
    z-index: z($main-context, sidebar-collapse-labels);

    &::after {
      content: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="white" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="12" x2="20" y2="12" /><line x1="10" y1="12" x2="14" y2="16" /><line x1="10" y1="12" x2="14" y2="8" /><line x1="4" y1="4" x2="4" y2="20" /></svg>');
    }
  }
</style>

<script>
  export let id;
  export let width;
  export let position = "right";
  let hidden = false;
</script>

<div
  {id}
  class={`flex-collapsible ${position}`}
  class:hidden
  style={`width: ${hidden ? 0 : width};`}
>
  <input type="checkbox" id={`${id}_collapse`} bind:checked={hidden} />
  <label for={`${id}_collapse`} />
  <div style={`width: ${width};`}>
    <slot />
  </div>
</div>
