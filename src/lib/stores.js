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
  let initialValue;
  try {
    initialValue = persistedValue ? JSON.parse(persistedValue) : defaultValue;
  } catch {
    initialValue = defaultValue;
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
      this.set(defaultValue);
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
