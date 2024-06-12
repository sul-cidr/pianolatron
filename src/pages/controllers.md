---
layout: ../layouts/markdownLayoutFullHeader.astro
title: Controlling the Pianolatron
---

# Controlling the Pianolatron

In the basic "Listen" mode, the Pianolatron can only be controlled via the transport control buttons (play/pause, rewind, loop) and tempo slider at the top of the player, which can be accessed via a pointer device or keyboard navigation.

In the more advanced "Perform" mode, it is possible to modify many aspects of the playback of a piano roll interactively, including bass and treble volume, pedaling, accents, and transposition, as well as recording and all features available in "Listen" mode. In addition to the on-screen transport strip buttons, pedaling buttons and sliders in the Performance Controls menu, the app supports control of these features via mapped keyboard buttons, a gamepad controller, and a MIDI input device.

## Keyboard button mappings

The assignment of keys on the computer keyboard to specific performance parameters (tempo, volume) and player piano controls (pedaling, accents) can be managed by selecting the "Configure Key Bindings" button in the Advanced Settings menu.

## Game controller button mappings

In "Perform" mode, the Pianolatron supports interactive modification of many playback parameters via a gamepad controller that has been connected to the computer wirelessly or via USB. Information about recognized controllers (if any) is available at the bottom of the Advanced Settings menu, along with some adjustible sensitivity settings.

Please note that the mappings given below may not be available or consistent for all combinations of game controller, web browser and operating system.

<img src="/assets/gamepad_mappings.png" alt="Diagram of how the Pianolatron's playback functions map to gamepad controller buttons, triggers and sticks" width="100%" />

- **Left Trigger:** Decrease tempo (pressure sensitive)
- **Right Trigger:** Increase tempo (pressure sensitive)
- **Left Bumper:** Soft pedal
- **Right Bumper:** Sustain pedal
- **Left Stick:** Bass volume (up/down - pressure sensitive)
- **Right Stick:** Treble volume (up/down - pressure sensitive)
- **Y Button:** Zoom in on roll image
- **X Button:** Zoom out on roll image
- **D-Pad Up:** Pan roll image up
- **D-Pad Right:** Pan roll image right
- **D-Pad Left:** Pan roll image left
- **D-Pad Down:** Pan roll image down
- **A Button:** Play/pause roll
- **B Button:** Rewind roll
- **Left Stick Click:** Accent (entire keyboard)
- **Right Stick Click:** Accent (entire keyboard)
- **Back Button:** Fit roll image to viewer
- **Start Button:** Get bookmark link

## MIDI input devices

The Pianolatron app will send and receive note and pedaling messages automatically to and from most MIDI piano keyboards and pedal devices that are connected to the computer, usually via a MIDI to USB adapter cable. The app also can interact with virtual MIDI devices running in other programs on the computer. Most modern web browsers include this MIDI support, though it may need to be enabled via a notification that appears in the browser when the device is first connected, and the operating system on the computer also may need to be configured to interact with MIDI devices. Settings vary by operating system.

Information about detected MIDI devices can be found in the MIDI Settings menu in "Perform" mode; the "Enable WebMIDI" option in this menu must also be active. Note that enabling "Sustain from External MIDI" or "Soft from External MIDI" will cause the app to derive all pedaling from the external pedal and to disregard any pedaling indicated on the piano roll being played. This is done to avoid pedal message "feedback loops" that can occur when pedal messages from the roll are sent to an external device and then immediately bounce back.
