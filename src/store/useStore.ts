import { create } from 'zustand';
import type { GeoState, CustomFeature } from '../types/geo';
import { validateAndTrimFeature } from '../utils/spatialUtils';
import { SHAPE_LIMITS } from '../config/shapeLimits';


export const useStore = create<GeoState>((set, get) => ({
    features: {},
    addFeature: (feature: CustomFeature) => {
        const { features } = get();
        const featureList = Object.values(features);

        // Limit Check
        const type = feature.properties.shapeType as keyof typeof SHAPE_LIMITS;
        const currentCount = featureList.filter((f) => f.properties.shapeType === type).length;
        const limit = SHAPE_LIMITS[type] || 10; // Default fallback

        if (currentCount >= limit) {
            return { success: false, error: `Limit reached for ${String(type)} (Max: ${limit})` };
        }

        const result = validateAndTrimFeature(feature, featureList);

        if (result.success && result.trimmedFeature) {
            set((state) => ({
                features: { ...state.features, [result.trimmedFeature!.properties.id]: result.trimmedFeature! }
            }));
            return { success: true };
        }
        return { success: false, error: result.error };
    },
    removeFeature: (id: string) =>
        set((state) => {
            const newFeatures = { ...state.features };
            delete newFeatures[id];
            return { features: newFeatures };
        }),
    setFeatures: (features: CustomFeature[]) =>
        set(() => ({
            features: features.reduce((acc, feat) => {
                acc[feat.properties.id] = feat;
                return acc;
            }, {} as Record<string, CustomFeature>)
        })),
    clearFeatures: () => set({ features: {} })
}));
