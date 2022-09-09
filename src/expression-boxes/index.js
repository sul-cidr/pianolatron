import ExpressiveMidiExpressionizer from "./expressive-midi";
import WelteRedExpressionizer from "./welte-red";
import WelteGreenExpressionizer from "./welte-green";
import WelteLicenseeExpressionizer from "./welte-licensee";
import DuoArtExpressionizer from "./duo-art";
import EightyEightNoteExpressionizer from "./88-note";

export default {
  expressiveMidi: ExpressiveMidiExpressionizer,
  "welte-red": WelteRedExpressionizer,
  "welte-green": WelteGreenExpressionizer,
  "welte-licensee": WelteLicenseeExpressionizer,
  "duo-art": DuoArtExpressionizer,
  "88-note": EightyEightNoteExpressionizer,
};
