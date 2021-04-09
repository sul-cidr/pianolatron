<style lang="scss">
  #keyboard {
    background: linear-gradient(-60deg, #000, #333, #000, #666, #333 70%);
    border-radius: 0 0 5px 5px;
    border: 2px solid #333;
    box-shadow: 0 2px 0px #666, 0 3px 0px #555, 0 4px 0px #444, 0 6px 6px #000,
      inset 0 -1px 1px rgba(255, 255, 255, 0.5), inset 0 -4px 5px #000;
    display: grid;
    margin: 1em 0;
    place-content: center;
    position: relative;
  }

  ul {
    border-top: 2px solid #222;
    display: block;
    height: 240px;
    margin: 0;
    padding: 0;
    width: 100%;
  }

  ul li {
    background: #aaa;
    display: inline;
    float: left;
    list-style: none;
    position: relative;
    width: 40px;

    /* White Keys */
    div {
      background: linear-gradient(-30deg, #f5f5f5, #fff);
      border-radius: 0 0 3px 3px;
      border: 1px solid #ccc;
      box-shadow: inset 0 1px 0px #fff, inset 0 -1px 0px #fff,
        inset 1px 0px 0px #fff, inset -1px 0px 0px #fff,
        0 4px 3px rgba(0, 0, 0, 0.7);
      display: block;
      height: 220px;

      &:active {
        box-shadow: 0 2px 2px rgba(0, 0, 0, 0.4);
        height: 216px;
        position: relative;
        top: 2px;

        &:before {
          border-color: transparent transparent transparent rgba(0, 0, 0, 0.1);
          border-style: solid;
          border-width: 216px 5px 0px;
          content: "";
          height: 0px;
          left: 0px;
          position: absolute;
          top: 0px;
          width: 0px;
        }

        &:after {
          border-color: transparent rgba(0, 0, 0, 0.1) transparent transparent;
          border-style: solid;
          border-width: 216px 5px 0px;
          content: "";
          height: 0px;
          position: absolute;
          right: 0px;
          top: 0px;
          width: 0px;
        }
      }
    }

    /* Black Keys */
    span {
      background: linear-gradient(-20deg, #333, #000, #333);
      border-color: #666 #222 #111 #555;
      border-radius: 0 0 2px 2px;
      border-style: solid;
      border-width: 1px 2px 7px;
      box-shadow: inset 0px -1px 2px rgba(255, 255, 255, 0.4),
        0 2px 3px rgba(0, 0, 0, 0.4);
      height: 120px;
      left: -12px;
      position: absolute;
      top: 0px;
      width: 20px;
      z-index: 10;

      &:active {
        border-bottom-width: 2px;
        box-shadow: inset 0px -1px 1px rgba(255, 255, 255, 0.4),
          0 1px 0px rgba(0, 0, 0, 0.8), 0 2px 2px rgba(0, 0, 0, 0.4),
          0 -1px 0px #000;
        height: 123px;
      }
    }
  }
</style>

<div id="keyboard">
  <ul>
    <li>
      <div />
    </li>
    <li>
      <div /><span />
    </li>
    <li>
      <div /><span />
    </li>
    <li>
      <div />
    </li>
    <li>
      <div /><span />
    </li>
    <li>
      <div /><span />
    </li>
    <li>
      <div />
    </li>
    <li>
      <div /><span />
    </li>
    <li>
      <div /><span />
    </li>
    <li>
      <div /><span />
    </li>
    <li>
      <div />
    </li>
    <li>
      <div /><span />
    </li>
    <li>
      <div /><span />
    </li>
    <li>
      <div />
    </li>
    <li>
      <div /><span />
    </li>
    <li>
      <div /><span />
    </li>
    <li>
      <div /><span />
    </li>
    <li>
      <div />
    </li>
    <li>
      <div /><span />
    </li>
    <li>
      <div /><span />
    </li>
    <li>
      <div />
    </li>
    <li>
      <div /><span />
    </li>
    <li>
      <div /><span />
    </li>
    <li>
      <div /><span />
    </li>
    <li>
      <div />
    </li>
    <li>
      <div /><span />
    </li>
    <li>
      <div /><span />
    </li>
    <li>
      <div />
    </li>
    <li>
      <div /><span />
    </li>
    <li>
      <div /><span />
    </li>
    <li>
      <div /><span />
    </li>
  </ul>
</div>
