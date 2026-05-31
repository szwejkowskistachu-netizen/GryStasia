const Utils = {
    dist: (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),
    clamp: (val, min, max) => Math.max(min, Math.min(max, val)),
    randomRange: (min, max) => Math.random() * (max - min) + min,
    lerp: (a, b, t) => a + (b - a) * t
};
