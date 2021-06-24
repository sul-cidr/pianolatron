import { writable } from "svelte/store";

export default (mediaQueries) => {
  const calculateMedia = (mediaQueryLists) => {
    const media = {};
    Object.keys(mediaQueryLists).forEach(
      (name) => (media[name] = mediaQueryLists[name].matches),
    );
    return media;
  };
  return writable({}, (set) => {
    const mediaQueryLists = {};
    const updateMedia = () => set(calculateMedia(mediaQueryLists));
    Object.entries(mediaQueries).forEach(([key, mediaQueryString]) => {
      mediaQueryLists[key] = window.matchMedia(mediaQueryString);
      mediaQueryLists[key].addListener(updateMedia);
    });
    updateMedia();
    return () =>
      Object.keys(mediaQueryLists).forEach((key) =>
        mediaQueryLists[key].removeListener(updateMedia),
      );
  });
};
