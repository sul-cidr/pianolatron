---
layout: ../layouts/markdownLayoutFullHeader.astro
title: Using the Pianolatron
---

# Using the Pianolatron

Please consult the menu items in the navigation strip above for details on how to use specific aspects of the Pianolatron app, such as input from MIDI devices and game controllers.

## System Specifications and Compatibility

The Pianolatron web app will play on most notebook and desktop systems of fairly recent vintage, as well as some large-format tablets. Mobile phones will have limited functionality. All major operating systems (Linux, Mac OS, Windows, Android, iOS) are supported. Firefox and Chrome/Edge-family web browsers are recommended; the Safari browser for Mac OS and iOS is not supported and is unlikely to provide an acceptable experience.

## Troubleshooting Playback Difficulties

If you receive a playback latency warning, or notice that the audio and video are not smooth and synchronized, or find yourself waiting a long time for resources to load, the following steps may help to improve the situation:

- Close other browser tabs, or shut down the browser entirely and re-open it with only the Pianolatron open.
- Open the Pianolatron in a "private" or "incognito" window (usually done via the browser's "File" menu).
- Quit other programs on the system that may be using considerable processing, memory or network resources, or reboot the system.
- In the [Perform](/perform/) view, select the Audio Settings menu in the right-hand panel and reduce the Sample Count value, possibly to 4 or 2 (this reduces the memory requirements of the Pianolatron, at the cost of lower audio fidelity).

The "Loading resources..." animation may appear for a long time when the Pianolatron is first opened as the browser downloads the string sound samples necessary to emulate a piano. These samples then tend to be stored locally until the browser's file cache is cleared, resulting in faster subsequent load times. The images for newly selected piano rolls must, however, always be loaded directly from the Stanford Digital Repository, so the Pianolatron requires a reliable network connection.

## Contacting Us

Questions, bug reports and other feedback regarding the Pianolatron and the Piano Roll Archive may be sent to [pianoroll_dataset@lists.stanford.edu](mailto:pianoroll_dataset@lists.stanford.edu).

Those who are technically inclined are welcome to file issues against the project's [GitHub repository](https://github.com/sul-cidr/pianolatron).
