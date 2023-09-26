export const enforcePrecision = (value, precision) => {
  const multiplier = 10 ** (precision || 0);
  return Math.round(value * multiplier) / multiplier;
};

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Return a float between 0 and 1 proportional to value's position between min
// and max
export const normalizeInRange = (value, min, max) => {
  if (max - min === 0) return 0.5;
  return (value - min) / (max - min);
};

export const getKeyByValue = (object, value) =>
  Object.keys(object).find((key) => object[key] === value);

// Return a float between min and max proportional to value's position between
// 0 and 1
export const mapToRange = (value, min, max) => value * (max - min) + min;

export const easingInterval = (
  fn,
  startInterval = 200,
  endInterval = 5,
  divisor = 1.1,
) => {
  let timeoutId;
  let interval = startInterval;
  const wrapped = () => {
    fn();
    interval = Math.max(Math.floor(interval / divisor), endInterval);
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
