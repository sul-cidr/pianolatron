export const enforcePrecision = (value, precision) => {
  const multiplier = 10 ** (precision || 0);
  return Math.round(value * multiplier) / multiplier;
};

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const easingInterval = (interval, fn) => {
  let timeoutId;

  const wrapped = () => {
    fn();
    // eslint-disable-next-line no-param-reassign
    interval = Math.max(Math.floor(interval / 1.2), 10);
    timeoutId = setTimeout(wrapped, interval);
  };

  timeoutId = setTimeout(wrapped, interval);

  return {
    clear: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
  };
};
