import type { Feature, Geometry } from 'geojson';

export interface CustomFeatureProperties {
    id: string;
    shapeType: 'polygon' | 'circle' | 'rectangle' | 'line' | 'marker';
    radius?: number; // For circles
    [key: string]: any;
}

export type CustomFeature = Feature<Geometry, CustomFeatureProperties>;

export interface GeoState {
    features: Record<string, CustomFeature>; // Using Record for O(1) access
    addFeature: (feature: CustomFeature) => { success: boolean; error?: string };
    removeFeature: (id: string) => void;
    setFeatures: (features: CustomFeature[]) => void;
    clearFeatures: () => void;
}
