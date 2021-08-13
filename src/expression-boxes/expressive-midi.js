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

export { buildNoteVelocitiesMap };
