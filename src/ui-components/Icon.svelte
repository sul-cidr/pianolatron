<script>
  export let name;
  export let width = "1rem";
  export let height = "1rem";
  export let customAttribs = {};

  const defaultAttribs = {
    viewBox: "0 0 24 24",
    "stroke-width": 2,
    stroke: "currentColor",
    fill: "none",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  };

  const icons = {
    cog: {
      svg: `
        <path
            d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z"
          />
        <circle cx="12" cy="12" r="3" />
      `,
      attribs: { "stroke-width": 1.5 },
    },
    exp_curves: {
      svg: `
        <line x1="8" y1="4" x2="10" y2="10" />
        <line x1="10" y1="10" x2="5" y2="15" />
        <line x1="5" y1="15" x2="4" y2="17" />
        <line x1="4" y1="17" x2="6" y2="20" />
        <line x1="16" y1="4" x2="20" y2="8" />
        <line x1="20" y1="8" x2="14" y2="19" />
        <line x1="14" y1="19" x2="13" y2="20" />
      `,
      attribs: { "stroke-width": 1.5 },
    },
    sliders: {
      svg: `
        <circle cx="14" cy="6" r="2" />
        <line x1="4" y1="6" x2="12" y2="6" />
        <line x1="16" y1="6" x2="20" y2="6" />
        <circle cx="8" cy="12" r="2" />
        <line x1="4" y1="12" x2="6" y2="12" />
        <line x1="10" y1="12" x2="20" y2="12" />
        <circle cx="17" cy="18" r="2" />
        <line x1="4" y1="18" x2="15" y2="18" />
        <line x1="19" y1="18" x2="20" y2="18" />
      `,
      attribs: { "stroke-width": 1.5 },
    },
    "arrow-down": {
      svg: `
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="16" y1="15" x2="12" y2="19" />
        <line x1="8" y1="15" x2="12" y2="19" />
      `,
    },
    "arrow-up": {
      svg: `
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="16" y1="9" x2="12" y2="5" />
        <line x1="8" y1="9" x2="12" y2="5" />
      `,
    },
    "arrow-left": {
      svg: `
        <line x1="5" y1="12" x2="19" y2="12" />
        <line x1="5" y1="12" x2="9" y2="16" />
        <line x1="5" y1="12" x2="9" y2="8" />
      `,
    },
    "arrow-right": {
      svg: `
        <line x1="5" y1="12" x2="19" y2="12" />
        <line x1="15" y1="16" x2="19" y2="12" />
        <line x1="15" y1="8" x2="19" y2="12" />
      `,
    },
    "fit-width": {
      svg: `
        <path d="M1 4v16"/>
        <path d="M23 4v16"/>
        <path style="stroke-width:1.5" d="M5.8 12h12.4"/>
        <path style="stroke-width:1.5" d="m8.5 8-4 4 4 4m7-8 4 4-4 4"/>
      `,
    },
    edit: {
      svg: `
        <path d="M9 7h-3a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-3" />
        <path d="M9 15h3l8.5 -8.5a1.5 1.5 0 0 0 -3 -3l-8.5 8.5v3" />
        <line x1="16" y1="5" x2="19" y2="8" />
      `,
    },
    minus: {
      svg: `<line x1="5" y1="12" x2="19" y2="12" />`,
    },
    plus: {
      svg: `
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      `,
    },
    cross: {
      svg: `
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      `,
    },
    reset: {
      svg: `<path d="m 10.953,20.006141 a 8,8 0 1 1 4,-0.5 m 5,0.5 h -5 v -5" />`,
    },
    piano: {
      svg: `
        <rect x="2" y="7" width="20" height="12" rx="2" />
        <line
          x1="7"
          y1="9"
          x2="7"
          y2="13.5"
          style="stroke-width:2.5;stroke-linecap:square"
        />
        <line
          x1="12"
          y1="9"
          x2="12"
          y2="13.5"
          style="stroke-width:2.5;stroke-linecap:square"
        />
        <line
          x1="17"
          y1="9"
          x2="17"
          y2="13.5"
          style="stroke-width:2.5;stroke-linecap:square"
        />
      `,
    },
    "piano-out": {
      svg: `
        <path d="M11 19h-6a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v4" />
        <rect x="14" y="14" width="7" height="5" rx="1" />
        <line x1="7" y1="9" x2="11" y2="13" />
        <path d="M7 12v-3h3" />
      `,
    },
    "piano-in": {
      svg: `
        <path d="M11 19h-6a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v4" />
        <rect x="14" y="14" width="7" height="5" rx="1" />
        <line x1="7" y1="9" x2="11" y2="13" />
        <path d="M8 13h3v-3" />
      `,
    },
    "piano-down": {
      svg: `
        <rect x="2" y="3" width="20" height="12" rx="2" />
        <line x1="7" y1="5" x2="7" y2="9.5" style="stroke-width:2.5;stroke-linecap:square" />
        <line x1="12" y1="5" x2="12" y2="9.5" style="stroke-width:2.5;stroke-linecap:square" />
        <line x1="17" y1="5" x2="17" y2="9.5" style="stroke-width:2.5;stroke-linecap:square" />
        <path d="m 10,19.000041 2,2 2,-2" />
      `,
    },
    "piano-up": {
      svg: `
        <rect x="2" y="3" width="20" height="12" rx="2" />
        <line x1="7" y1="5" x2="7" y2="9.5" style="stroke-width:2.5;stroke-linecap:square" />
        <line x1="12" y1="5" x2="12" y2="9.5" style="stroke-width:2.5;stroke-linecap:square" />
        <line x1="17" y1="5" x2="17" y2="9.5" style="stroke-width:2.5;stroke-linecap:square" />
        <path d="M10 21l2 -2l2 2" />
      `,
    },
    midi: {
      svg: `
        <path aria-label="M" text-data="M" d="m 0,0 h 233 c 19.6,0 31,16.9 31,37 V 266 H 199 V 67 H 161 V 266 H 102 V 67 H 65 V 266 H 0 Z" />
        <rect aria-label="I" text-data="I" x="296" y="0" width="65" height="266" />
        <path aria-label="D" text-data="D" d="m 392,0 h 193 c 19.6,0 31,16.9 31,37 v 196 c 0,24.9 -10.4,33 -33,33 H 392 V 97 h 66 v 104 h 93 V 60 H 392 Z" />
        <rect aria-label="I" text-data="I" x="646" y="0" width="66" height="266" />
      `,
      attribs: { viewBox: "0 0 712 266", fill: "currentColor" },
    },
  };
  const { attribs, svg } = icons[name];
</script>

<svg
  {height}
  {width}
  {...defaultAttribs}
  {...attribs}
  {...customAttribs}
  {...$$props}>{@html svg}</svg
>
