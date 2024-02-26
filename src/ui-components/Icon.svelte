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
    skipForward: {
      svg: `
      <path d="M8.46448 7.75739L7.05026 9.1716L9.87869 12L7.05029 14.8284L8.46451 16.2426L12.7071 12L8.46448 7.75739Z" fill="currentColor" /><path d="M11.2929 9.1716L12.7071 7.75739L16.9498 12L12.7071 16.2426L11.2929 14.8284L14.1213 12L11.2929 9.1716Z" fill="currentColor" /><path fill-rule="evenodd" clip-rule="evenodd" d="M1 12C1 18.0751 5.92487 23 12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1C5.92487 1 1 5.92487 1 12ZM3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12Z" fill="currentColor" />
      `,
      attribs: { "stroke-width": 0.5 },
    },
    skipBack: {
      svg: `
      <path d="M12.7071 9.1716L11.2929 7.75739L7.05024 12L11.2929 16.2426L12.7071 14.8284L9.87869 12L12.7071 9.1716Z" fill="currentColor" /><path d="M15.5355 7.75739L16.9497 9.1716L14.1213 12L16.9497 14.8284L15.5355 16.2426L11.2929 12L15.5355 7.75739Z" fill="currentColor" /><path fill-rule="evenodd" clip-rule="evenodd" d="M23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12ZM21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" fill="currentColor" />
      `,
      attribs: { "stroke-width": 0.5 },
    },
    bookmark: {
      svg: `
        <path fill-rule="evenodd" clip-rule="evenodd" d="M19 20H17.1717L12.7072 15.5354C12.3166 15.1449 11.6835 15.1449 11.2929 15.5354L6.82843 20L5 20V7C5 5.34315 6.34315 4 8 4H16C17.6569 4 19 5.34314 19 7V20ZM17 7C17 6.44772 16.5523 6 16 6H8C7.44772 6 7 6.44772 7 7V17L9.87873 14.1212C11.0503 12.9497 12.9498 12.9497 14.1214 14.1212L17 16.9999V7Z" fill="currentColor" />
      `,
      attribs: { "stroke-width": 0.5 },
    },
    check: {
      svg: `
        <path d="M10.2426 16.3137L6 12.071L7.41421 10.6568L10.2426 13.4853L15.8995 7.8284L17.3137 9.24262L10.2426 16.3137Z" fill="currentColor" />
        <path fill-rule="evenodd" clip-rule="evenodd" d="M1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12ZM12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21Z" fill="currentColor" />
      `,
      attribs: { "stroke-width": 0.5 },
    },
    replay: {
      svg: `
        <path d="M4.56079 10.6418L6.35394 3.94971L8.25402 5.84979C11.7312 3.6588 16.3814 4.07764 19.41 7.1063L17.9958 8.52052C15.7536 6.27827 12.3686 5.87519 9.71551 7.31128L11.2529 8.84869L4.56079 10.6418Z" fill="currentColor" />
        <path d="M19.4392 13.3581L17.646 20.0502L15.7459 18.1501C12.2688 20.3411 7.61857 19.9223 4.58991 16.8936L6.00413 15.4794C8.24638 17.7217 11.6313 18.1247 14.2844 16.6887L12.747 15.1512L19.4392 13.3581Z" fill="currentColor" />
      `,
      attribs: { "stroke-width": 0.5 },
    },
    rewind: {
      svg: `
        <path d="M2 7H5V17H2V7Z" fill="currentColor" />
        <path d="M6 12L13.0023 7.00003V17L6 12Z" fill="currentColor" />
        <path d="M21.0023 7.00003L14 12L21.0023 17V7.00003Z" fill="currentColor" />
      `,
      attribs: { "stroke-width": 0.5 },
    },
    play: {
      svg: `
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21ZM12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23Z"
          fill="currentColor"
        />
        <path d="M16 12L10 16.3301V7.66987L16 12Z" fill="currentColor" />
      `,
      attribs: { "stroke-width": 0.5 },
    },
    pause: {
      svg: `
        <path d="M9 9H11V15H9V9Z" fill="currentColor" />
        <path d="M15 15H13V9H15V15Z" fill="currentColor" />
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12ZM21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
          fill="currentColor"
        />
      `,
      attribs: { "stroke-width": 0.5 },
    },
    record: {
      svg: `
        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" fill="currentColor" /><path fill-rule="evenodd" clip-rule="evenodd" d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12Z" fill="currentColor" />      
      `,
      attribs: { "stroke-width": 0.5 },
    },
    markStart: {
      svg: `
        <path
          d="M22.2877 11.0001V13.0001H7.80237L11.045 16.2428L9.63079 17.657L3.97394 12.0001L9.63079 6.34326L11.045 7.75748L7.80236 11.0001H22.2877Z"
          fill="currentColor"
        />
        <path d="M3 18V6H1V18H3Z" fill="currentColor" />
      `,
      attribs: { "stroke-width": 0.5 },
    },
    markEnd: {
      svg: `
        <path
          d="M1 12.9999V10.9999H15.4853L12.2427 7.75724L13.6569 6.34303L19.3137 11.9999L13.6569 17.6567L12.2427 16.2425L15.4853 12.9999H1Z"
          fill="currentColor"
        />
        <path d="M20.2877 6V18H22.2877V6H20.2877Z" fill="currentColor" />
      `,
      attribs: { "stroke-width": 0.5 },
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
