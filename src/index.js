import App from "./App.svelte";

document.getElementById("loading").remove();
const app = new App({ target: document.body });

export default app;
