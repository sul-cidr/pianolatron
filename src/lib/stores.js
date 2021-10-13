import { writable, get } from "svelte/store";

export const createStore = (defaultValue) => {
  const { set, subscribe, update } = writable(defaultValue);
  return {
    reset: () => set(defaultValue),
    set,
    subscribe,
    update,
  };
};

export const createPersistedStore = (key, defaultValue) => {
  const persistedValue = localStorage.getItem(key);
  // If @defaultValue is an object then take a shallow copy so as not to pass
  //  by reference and mutate it such that it can't be used to reset the store.
  let initialValue =
    typeof defaultValue === "object" ? { ...defaultValue } : defaultValue;
  try {
    if (persistedValue) {
      initialValue =
        typeof defaultValue === "object"
          ? Object.assign(initialValue, JSON.parse(persistedValue))
          : JSON.parse(persistedValue);
    }
  } catch {
    // pass
  }
  const store = writable(initialValue);
  const { set, subscribe } = store;
  return {
    set(value) {
      localStorage.setItem(key, JSON.stringify(value));
      set(value);
    },
    update(fn) {
      const value = fn(get(store));
      this.set(value);
    },
    reset() {
      localStorage.removeItem(key);
      this.set(
        typeof defaultValue === "object" ? { ...defaultValue } : defaultValue,
      );
    },
    subscribe,
  };
};

export const createSetStore = () => {
  const { subscribe, update, set } = writable(new Set());
  return {
    subscribe,
    add: (el) => update((wrappedSet) => wrappedSet.add(el)),
    delete: (el) =>
      update((wrappedSet) => {
        wrappedSet.delete(el);
        return wrappedSet;
      }),
    reset: (newValue) => set(new Set(newValue)),
  };
};
