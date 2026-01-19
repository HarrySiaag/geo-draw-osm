export const SHAPE_LIMITS = {
    polygon: 10,
    rectangle: 10,
    circle: 10,
    line: 10, // Mapped from 'polyline'
} as const;

export type ShapeType = keyof typeof SHAPE_LIMITS;
