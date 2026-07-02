<script>
  import { driver } from "driver.js";
  import "driver.js/dist/driver.css";
  import { appMode } from "../stores";

  const showTourIfRequested = () => {
    const everyTourSteps = [
      {
        element: ".filtered-select",
        popover: {
          title: "Roll Selector",
          description:
            "Welcome to Pianolatron! Type search terms here or <a href='/search/'>visit the Search page</a> to find another piano roll to play.",
        },
      },
      {
        element: ".mode-switch-container > .player-button",
        popover: {
          title: "Mode Toggle",
          description: `Use this button to switch between "Play Mode" and "Perform Mode." You are presently viewing the roll in ${$appMode === "perform" ? "Perform" : "Play"} Mode. ${$appMode === "play" ? "Take this tour again in Perform Mode to learn more about the advanced features available there." : "Perform Mode adds several more menus and options for influencing how a roll plays back interactively."}`,
        },
      },
      {
        element: "#left-sidebar",
        popover: {
          title: "Roll Information",
          description:
            "The left panel presents information and links for the current roll. It can be hidden via the arrow tab that appears when it has mouse or keyboard focus.",
        },
      },
      {
        element: ".player-button-container",
        popover: {
          title: "Roll Player Controls",
          description: `Use these buttons to play, pause, and rewind the roll, as well as to skip forward and backward, highlight a section of the roll, get a bookmark URL, and set the roll to auto-repeat. In Perform Mode, you also can use ${$appMode === "play" ? "a" : "the"} record button to create and export MIDI and sound clips.`,
        },
      },
      {
        element: "#piano-toggle > button",
        popover: {
          title: "Piano Keyboard Visibility",
          description:
            "These buttons can reveal and hide the live piano keyboard visualization, as well as overlay it on the roll image.",
        },
      },
      {
        element: "#roll-viewer",
        popover: {
          title: "Piano Roll Viewer",
          description: `Use the mouse, keyboard, or navigation buttons to scroll, zoom, or pan the roll image and to explore the functions of the perforations. ${$appMode === "perform" ? "You also can use the menus in the right panel to choose the annotations that appear over the detected perforations on the roll when selected and while active during playback." : ""}`,
        },
      },
    ];

    const playTourSteps = [
      {
        element: ".tempo-control-container",
        popover: {
          title: "Tempo Control",
          description: "Use this slider to adjust the roll playback speed.",
        },
      },
    ];

    const performTourSteps = [
      {
        element: "#viewer-metrics",
        popover: {
          title: "Playback Metrics",
          description:
            "These values update dynamically as the roll plays. Note how the roll moves faster as it accumulates over time on the (virtual) takeup spool.",
        },
      },
      {
        element: "#perform-controls",
        popover: {
          title: "Pedal and Accent Controls",
          description:
            "These buttons display the current state of the pedals, just like the pedal graphics below the keyboard visualization, and also can be clicked to override the pedaling settings on the roll, as well as to boost (accent) the volume of playback temporarily.",
        },
      },
      {
        element: "button[aria-label='Performance controls']",
        popover: {
          title: "Performance Controls",
          side: "top",
          alignt: "start",
          description:
            "This menu exposes options for modifying volume, tempo, and transposition dynamically during roll playback.",
        },
      },
      {
        element: "button[aria-label='Advanced settings']",
        popover: {
          title: "Advanced Settings",
          description:
            "This extensive menu enables changing the appearance of the roll, toggling emulation settings, remapping keyboard bindings for playback controls, and configuring settings for a game controller (when one is connected).",
        },
      },
      {
        element: "button[aria-label='Audio settings']",
        popover: {
          title: "Audio Settings",
          description:
            "Use this menu to change aspects of how the emulated piano sounds during playback, including sample resolution and volume, reverb, and other acoustic modifications.",
        },
      },
      {
        element: "button[aria-label='MIDI settings']",
        popover: {
          title: "MIDI Settings",
          description:
            "This menu provides information and options for connecting virtual and physical MIDI devices, such as digital keyboards.",
        },
      },
      {
        element: "button[aria-label='Expression settings']",
        popover: {
          title: "Expression Settings",
          description:
            'Use this menu to choose between hearing precalculated note velocities (from a bespoke "expression MIDI" file) and the advanced "in-app expression" mode, which allows for dynamic modification of the applicable emulation parameters during playback, as well as downloading the resulting MIDI and settings as files, and loading a previously exported settings file.',
        },
      },
    ];

    const driverObj = driver({
      showProgress: true,
      steps:
        $appMode === "play"
          ? everyTourSteps.concat(playTourSteps)
          : everyTourSteps.concat(performTourSteps),
      onHighlighted: (e) => {
        switch (e) {
          // This only highlights one of the buttons, but that's enough
          case document.querySelector("#keyboard > .overlay-buttons > button"):
            e.focus();
            break;
          case document.querySelector("#left-sidebar"):
            document
              .querySelector("#left-sidebar > div > .panel-show-hide-button ")
              .setAttribute("style", "opacity: 1");
            break;
          case document.querySelector("#roll-viewer"):
            const rollViewerControlBar = document.querySelector(
              "#roll-viewer > .overlay-buttons",
            );
            rollViewerControlBar.tabIndex = -1;
            rollViewerControlBar.focus();
            break;
          case document.querySelector(
            "button[aria-label='Performance controls']",
          ):
            e.click();
            break;
          case document.querySelector("button[aria-label='Advanced settings']"):
            e.click();
            break;
          case document.querySelector("button[aria-label='Audio settings']"):
            e.click();
            break;
          case document.querySelector("button[aria-label='MIDI settings']"):
            e.click();
            break;
          case document.querySelector(
            "button[aria-label='Expression settings']",
          ):
            e.click();
            break;
          default:
            break;
        }
      },
      onDeselected: (e) => {
        switch (e) {
          case document.querySelector("#keyboard > .overlay-buttons > button"):
            e.blur();
            break;
          case document.querySelector("#left-sidebar"):
            document
              .querySelector("#left-sidebar > div > .panel-show-hide-button ")
              .removeAttribute("style");
            break;
          case document.querySelector("#roll-viewer"):
            document
              .querySelector("#roll-viewer > .overlay-buttons")
              .removeAttribute("tabIndex");
            break;
          default:
            break;
        }
      },
      onDestroyed: () => {
        if ($appMode === "perform")
          document
            .querySelector("button[aria-label='Performance controls']")
            .click();
      },
    });

    driverObj.drive();
  };

  export { showTourIfRequested };
</script>
