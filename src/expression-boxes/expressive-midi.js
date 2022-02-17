import IntervalTree from "node-interval-tree";

const SOFT_PEDAL = 67;
const SUSTAIN_PEDAL = 64;

const buildNoteVelocitiesMap = (midiSamplePlayer) => {
  const noteVelocitiesMap = {};

  const [, ...musicTracks] = midiSamplePlayer.events;

  musicTracks.forEach((track) => {
    track
      .filter(({ name, velocity }) => name === "Note on" && velocity > 0)
      .forEach(({ noteNumber, velocity, tick }) => {
        noteVelocitiesMap[tick] = noteVelocitiesMap[tick] || {};
        noteVelocitiesMap[tick][noteNumber] = velocity;
      });
  });

  return noteVelocitiesMap;
};

const buildPedalingMap = (eventsTrack) => {
  const _pedalingMap = new IntervalTree();
  const controllerEvents = eventsTrack.filter(
    (event) => event.name === "Controller Change",
  );

  const enterEvents = (eventNumber) => {
    let tickOn = false;
    controllerEvents
      .filter(({ number }) => number === eventNumber)
      .forEach(({ value, tick }) => {
        if (value === 0) {
          if (tickOn) _pedalingMap.insert(tickOn, tick, eventNumber);
          tickOn = false;
        } else if (value === 127) {
          if (!tickOn) tickOn = tick;
        }
      });
  };

  enterEvents(SOFT_PEDAL);
  enterEvents(SUSTAIN_PEDAL);

  return _pedalingMap;
};

export { buildNoteVelocitiesMap, buildPedalingMap };
