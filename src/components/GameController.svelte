<script>
  import { clamp } from "../lib/utils";
  import { defaultControlsConfig as controlsConfig } from "../config/controls-config";
  import {
    gameController,
    bassVolumeCoefficient,
    trebleVolumeCoefficient,
    tempoCoefficient,
    softOnOff,
    sustainOnOff,
    accentOnOff,
    volumeSensitivity,
    tempoSensitivity,
  } from "../stores";

  export let playPauseApp;
  export let stopApp;
  export let updateTickByViewportIncrement;
  export let panHorizontal;
  export let adjustZoom;

  let controllerLoop = null;
  let lastControllerState = null;
  let gamepad = null;

  const buttonPressed = (b) => (typeof b === "object" ? b.pressed : b === 1.0);

  const buttonToggled = (buttonIndex) =>
    !lastControllerState ||
    buttonPressed(lastControllerState.buttons[buttonIndex]) !==
      buttonPressed(gamepad.buttons[buttonIndex]);

  const buttonToggledOn = (buttonIndex) =>
    !lastControllerState ||
    (!buttonPressed(lastControllerState.buttons[buttonIndex]) &&
      buttonPressed(gamepad.buttons[buttonIndex]));

  const pollController = () => {
    [gamepad] = navigator.getGamepads();

    $bassVolumeCoefficient =
      Math.round(
        clamp(
          $bassVolumeCoefficient - gamepad.axes[1] / (100 - $volumeSensitivity),
          controlsConfig.bassVolume.min,
          controlsConfig.bassVolume.max,
        ) * 100,
      ) / 100;
    $trebleVolumeCoefficient =
      Math.round(
        clamp(
          $trebleVolumeCoefficient - gamepad.axes[3] / (100 - $tempoSensitivity),
          controlsConfig.trebleVolume.min,
          controlsConfig.trebleVolume.max,
        ) * 100,
      ) / 100;
    $tempoCoefficient =
      Math.round(
        clamp(
          $tempoCoefficient +
            (gamepad.buttons[7].value - gamepad.buttons[6].value) /
              (100 - $volumeSensitivity),
          controlsConfig.tempo.min,
          controlsConfig.tempo.max,
        ) * 100,
      ) / 100;

    // For Play/Pause and Stop buttons, only trigger the function calls
    //  if they were previously up at the last state update and are now down
    if (buttonToggledOn(0, lastControllerState, gamepad)) playPauseApp();
    if (buttonToggledOn(1, lastControllerState, gamepad)) stopApp();
    if (buttonPressed(gamepad.buttons[2])) adjustZoom("zoomIn");
    if (buttonPressed(gamepad.buttons[3])) adjustZoom("zoomOut");

    if (buttonToggled(4, lastControllerState, gamepad))
      $softOnOff = buttonPressed(gamepad.buttons[4]);

    if (buttonToggled(5, lastControllerState, gamepad))
      $sustainOnOff = buttonPressed(gamepad.buttons[5]);

    if (buttonPressed(gamepad.buttons[8])) adjustZoom("resetZoom");
    if (
      buttonToggled(10, lastControllerState, gamepad) ||
      buttonToggled(11, lastControllerState, gamepad)
    )
      $accentOnOff =
        buttonPressed(gamepad.buttons[10]) ||
        buttonPressed(gamepad.buttons[11]);

    if (buttonPressed(gamepad.buttons[12]))
      updateTickByViewportIncrement(/* up = */ true);
    if (buttonPressed(gamepad.buttons[13]))
      updateTickByViewportIncrement(/* up - */ false);
    if (buttonPressed(gamepad.buttons[14])) panHorizontal(/* left = */ true);
    if (buttonPressed(gamepad.buttons[15])) panHorizontal(/* left = */ false);


    lastControllerState = {
      timestamp: "timestamp" in gamepad ? gamepad.timestamp : undefined,
      axes: gamepad.axes,
      buttons: gamepad.buttons,
    };
  };

  if (navigator.getGamepads) {
    addEventListener("gamepadconnected", (event) => {
      $gameController = event.gamepad;
      gamepad = event.gamepad;
      controllerLoop = setInterval(pollController, 10);
    });

    addEventListener("gamepaddisconnected", () => {
      clearInterval(controllerLoop);
      controllerLoop = undefined;
      $gameController = undefined;
      gamepad = null;
    });
  }
</script>
