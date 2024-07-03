<style>
  a {
    align-items: center;
    background: white;
    color: var(--primary-accent);
    display: flex;
    font-size: 1em;
    font-weight: bold;
    justify-content: center;
    overflow: hidden;
    position: fixed;
    text-transform: uppercase;
    z-index: 5;

    /* Visually hidden */
    clip-path: inset(50%);
    height: 1px; /* Safari doesn’t focus elements with zero dimensions */
    width: 1px; /* so this remains necessary. */
    white-space: nowrap; /* Screen readers (particularly NVDA) will sometimes remove line-breaks in wrapped text. */

    &:focus,
    &:active {
      clip-path: initial;
      height: 48px;
      width: 100vw;
    }
  }
</style>

<a href="#content">Skip to main content</a>
