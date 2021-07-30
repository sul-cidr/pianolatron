function cubicOut(t) {
  const f = t - 1;
  return f * f * f + 1;
}
function quartInOut(t) {
  return t < 0.5 ? 8 * Math.pow(t, 4) : -8 * Math.pow(t - 1, 4) + 1;
}

export { cubicOut as c, quartInOut as q };
