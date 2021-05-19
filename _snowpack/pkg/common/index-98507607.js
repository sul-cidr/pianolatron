function cubicOut(t) {
    const f = t - 1.0;
    return f * f * f + 1.0;
}
function quartInOut(t) {
    return t < 0.5
        ? +8.0 * Math.pow(t, 4.0)
        : -8.0 * Math.pow(t - 1.0, 4.0) + 1.0;
}

export { cubicOut as c, quartInOut as q };
