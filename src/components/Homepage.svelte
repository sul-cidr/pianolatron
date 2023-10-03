<style lang="scss">
  .background {
    background-color: rgba(183, 0, 0, 0.90);
    display: flex;
    flex-direction: column;
    gap: 2rem;
    height: 100vh;
    margin: 0;
    padding: 0;
    width: 100vw;
  }
  .logo-container {
    display: flex;
    flex-direction: row;
    font-family: Garamond, serif;
    justify-content: end;
    .logo {
      display: flex;
      flex-direction: column;
      h1 {
        font-size: 4rem;
        line-height: 4rem;
        margin: 2rem 1rem 0.5rem;
      }
      h4 {
        font-size: 1rem;
        line-height: 1rem;
        margin: 0rem 1rem 1rem;
      }
    }
  }
  .want-container {
    display: flex;
    flex-direction: row;
    .want {
      display: flex;
      flex-direction: column;
      flex-grow: 2;
    }
    .navigation {
      display: flex;
      flex-direction: row;
      flex-grow: 3;
    }
  }

</style>
  
<div class="background">
  <div class="logo-container">
    <div class="logo">
      <h1>Pianolatron</h1>
      <h4>Stanford University Piano Roll Project</h4>
    </div>
  </div>
  <div class="want-container">
    <div class="want">
      <h2>I want to...</h2>
      <p>Pianolatron simulates a player piano. It plays piano rolls collected in the Stanford University piano roll archive, and you can control it in realtime with a game controller to give your own expressive performance.</p>
    </div>

    <div class="navigation">
      <h2>listen</h2>
      <h2>perform</h2>
      <h2>analyze</h2>
      <h2>explore</h2>
    </div>
  </div>  
</div>
  