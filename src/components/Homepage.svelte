<style lang="scss">
  .background {
    background-color: rgba(183, 0, 0, 0.9);
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
    font-family: SourceSans3, sans-serif;
    justify-content: flex-end;
    font-weight: 400;
    text-shadow: 1px 1px 0 #212529;
    .logo {
      display: flex;
      flex-direction: column;
      padding-right: 5%;
      h1 {
        font-size: 3rem;
        line-height: 3rem;
        margin: 2rem 1rem 0.5rem;
      }
      h4 {
        font-size: 1rem;
        line-height: 1rem;
        margin: 0rem 1rem 1rem;
      }
    }
  }
  .page-container {
    display: flex;
    flex-direction: row;
    font-family: "Trebuchet MS", "Lucida Sans Unicode", "Lucida Grande",
      "Lucida Sans", Arial, sans-serif, sans-serif;
    gap: 0.5rem;
    height: 60%;
    justify-content: center;
    .want {
      display: flex;
      flex-direction: column;
      flex-grow: 2;
      max-width: 28%;
      h2 {
        font-size: 4.25rem;
        font-style: italic;
        margin: 0;
        text-align: right;
      }
      p {
        font-size: 20px;
        line-height: 24px;
        margin: 1rem auto;
        text-align: right;
        width: 65%;
      }
    }
    .navigation-container {
      align-items: center;
      display: flex;
      flex-direction: row;
      .navigation {
        align-items: center;
        column-gap: 2rem;
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr 1fr;
        row-gap: 2rem;
        a {
          color: #ffffff;
          font-size: 70px;
          text-decoration: none;
          span {
            display: block;
            font-size: 16px;
          }
        }
      }
    }
  }
</style>

<div class="background">
  <div class="logo-container">
    <div class="logo">
      <h1>Pianolatron</h1>
      <h4>Piano Rolls in the Stanford University Archive</h4>
    </div>
  </div>
  <div class="page-container">
    <div class="want">
      <h2>I want to...</h2>
      <p>
        Pianolatron simulates a player piano. It plays piano rolls collected in
        the Stanford University piano roll archive, and you can control it in
        real time with a game controller or computer keyboard to give your own
        expressive performance.
      </p>
    </div>

    <div class="navigation-container">
      <div class="navigation">
        <a href="/?druid=qm069fy5200">listen<span>to piano rolls</span></a>
        <a href="/perform/?druid=qm069fy5200"
          >perform<span>my own interpretation</span></a
        >
        <a href="https://exhibits.stanford.edu/supra"
          >learn<span>about piano rolls</span></a
        >
        <a href="/search/">explore<span>the archive</span></a>
      </div>
    </div>
  </div>
</div>
