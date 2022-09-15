import IntervalTree from "node-interval-tree";
import { rollProfile } from "../config/roll-config";
import { enforcePrecision, mapToRange, normalizeInRange } from "./utils";

// This is the "coolwarm" color map -- blue to red
// RdYlBu (reversed) sort of works, but the yellows are too ambiguous
// (values in H, S, L)
const holeColorMap = [
  "232, 53%, 49%",
  "229, 64%, 58%",
  "225, 78%, 66%",
  "223, 91%, 73%",
  "221, 98%, 79%",
  "219, 95%, 83%",
  "217, 73%, 86%",
  "21, 28%, 86%",
  "20, 69%, 83%",
  "18, 85%, 79%",
  "16, 85%, 73%",
  "13, 80%, 67%",
  "9, 70%, 59%",
  "2, 59%, 51%",
  "348, 96%, 36%",
];

const defaultHoleColor = "60, 100%, 50%"; // yellow (default)
const controlHoleColor = "120, 73%, 75%"; // light green
const pedalHoleColor = "39, 100%, 50%"; // orange;

const getNoteName = (midiNumber) => {
  const octave = parseInt(midiNumber / 12, 10) - 1;
  const name = [
    "A",
    "A#",
    "B",
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
  ][(midiNumber - 21) % 12];
  return `${name}${octave}`;
};

const getHoleType = ({ m: midiNumber }, rollType) => {
  const {
    bassNotesBegin: notesBegin,
    trebleNotesEnd: notesEnd,
    ctrlMap,
  } = rollProfile[rollType];

  if (midiNumber >= notesBegin && midiNumber <= notesEnd) return "note";
  if (
    ctrlMap[midiNumber]?.includes("soft") ||
    ctrlMap[midiNumber]?.includes("sust")
  )
    return "pedal";
  return "control";
};

const getHoleLabel = (midiNumber, rollType) => {
  const {
    bassNotesBegin: notesBegin,
    trebleNotesEnd: notesEnd,
    ctrlMap,
  } = rollProfile[rollType];

  if (midiNumber >= notesBegin && midiNumber <= notesEnd)
    return getNoteName(midiNumber);

  if (ctrlMap && ctrlMap[midiNumber]) return ctrlMap[midiNumber];

  return `mid_${midiNumber}`;
};

const annotateHoleData = (
  holeData,
  rollType,
  firstHolePx,
  imageLengthPx,
  scrollDownwards,
  noteVelocitiesMap,
) => {
  const [minNoteVelocity, maxNoteVelocity] = Object.values(
    noteVelocitiesMap,
  ).reduce(
    (acc, v) => [
      Math.min(Object.values(v)) < acc[0] ? Math.min(Object.values(v)) : acc[0],
      Math.max(Object.values(v)) > acc[1] ? Math.max(Object.values(v)) : acc[1],
    ],
    [Infinity, -Infinity],
  );

  const getNoteHoleColor = ({ v: velocity }) => {
    if (!velocity) return defaultHoleColor;
    return holeColorMap[
      Math.round(
        mapToRange(
          normalizeInRange(velocity, minNoteVelocity, maxNoteVelocity),
          0,
          holeColorMap.length - 1,
        ),
      )
    ];
  };

  return holeData.map((hole) => {
    // hole.y is the coordinate of the beginning of the hole *in the direction
    //  of scroll*, so to turn it into a an image coordinate with the usual
    //  computer graphics coordinate system of (0,0) in the top left (.startY),
    //  some arithmetic is required for rolls that scroll upwards.
    hole.startY = scrollDownwards ? hole.y : imageLengthPx - hole.y - hole.h;
    hole.endY = scrollDownwards ? hole.y + hole.h : imageLengthPx - hole.y;

    const tickOn = hole.y - firstHolePx;
    hole.v = enforcePrecision(noteVelocitiesMap[tickOn]?.[hole.m], 2);

    hole.label = getHoleLabel(hole.m, rollType);

    switch (getHoleType(hole, rollType)) {
      case "pedal":
        hole.color = pedalHoleColor;
        hole.type = "pedal";
        break;

      case "control":
        hole.color = controlHoleColor;
        hole.type = "control";
        break;

      case "note":
        hole.color = getNoteHoleColor(hole);
        hole.type = "note";
        break;

      default:
        hole.color = defaultHoleColor;
    }

    return hole;
  });
};

const buildHolesIntervalTree = (holeData, firstHolePx) => {
  const holesIntervalTree = new IntervalTree();

  holeData.forEach((hole) => {
    const { y: offsetY, h: height } = hole;
    const tickOn = offsetY - firstHolePx;
    const tickOff = offsetY + height - firstHolePx;

    holesIntervalTree.insert(tickOn, tickOff, hole);
  });
  return holesIntervalTree;
};

const processHoleData = (
  holeData,
  rollMetadata,
  scrollDownwards,
  noteVelocitiesMap,
) => {
  const {
    ROLL_TYPE: rollType,
    IMAGE_LENGTH: imageLength,
    FIRST_HOLE: firstHole,
  } = rollMetadata;

  const firstHolePx = parseInt(firstHole, 10);
  const imageLengthPx = parseInt(imageLength, 10);

  const annotatedHoleData = annotateHoleData(
    holeData,
    rollType,
    firstHolePx,
    imageLengthPx,
    scrollDownwards,
    noteVelocitiesMap,
  );
  return buildHolesIntervalTree(annotatedHoleData, firstHolePx);
};

export { getNoteName, getHoleType, annotateHoleData, processHoleData };
