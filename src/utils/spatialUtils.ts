import * as turf from '@turf/turf';
import type { Feature, Polygon, MultiPolygon } from 'geojson';
import type { CustomFeature } from '../types/geo';

export interface SpatialValidationResult {
    success: boolean;
    trimmedFeature?: CustomFeature;
    error?: string;
}

const MIN_AREA_SQ_METERS = 10; // Minimum area threshold to avoid tiny artifacts

/**
 * Validates and trims a new feature against existing features.
 * Rules:
 * 1. LineString: Skipped (Always success).
 * 2. Circle: Converted to Polygon for checks.
 * 3. Containment: Block if new contains existing OR existing contains new.
 * 4. Overlap: Trim new feature using difference against all overlapping existing features.
 * 5. Guards: Block if result is null or area is too small.
 */
export const validateAndTrimFeature = (
    newFeature: CustomFeature,
    existingFeatures: CustomFeature[]
): SpatialValidationResult => {
    // Rule 1: Skip LineString
    if (
        newFeature.geometry.type === 'LineString' ||
        newFeature.properties.shapeType === 'line' ||
        newFeature.properties.shapeType === 'marker'
    ) {
        return { success: true, trimmedFeature: newFeature };
    }

    // Helper to get geometry for calculations (handling Circles)
    const getCalcGeometry = (feat: CustomFeature): Feature<Polygon | MultiPolygon> | null => {
        if (feat.properties.shapeType === 'circle' && feat.properties.radius && feat.geometry.type === 'Point') {
            const options = { steps: 64, units: 'meters' as const, properties: feat.properties };
            // turf.circle returns a Feature<Polygon>
            return turf.circle(feat.geometry.coordinates as [number, number], feat.properties.radius, options) as Feature<Polygon>;
        }
        if (feat.geometry.type === 'Polygon' || feat.geometry.type === 'MultiPolygon') {
            return feat as Feature<Polygon | MultiPolygon>;
        }
        return null;
    };

    let currentGeometry = getCalcGeometry(newFeature);
    if (!currentGeometry) {
        // Should not happen if inputs are valid and not LineString/Marker
        return { success: false, error: 'Invalid geometry for spatial check' };
    }

    // Retrieve all relevant existing geometries (Polygons/Circles only)
    const relevantExisting = existingFeatures
        .filter(f => f.properties.id !== newFeature.properties.id) // check just in case
        .filter(f => f.properties.shapeType !== 'line' && f.properties.shapeType !== 'marker');

    for (const existing of relevantExisting) {
        const existingGeom = getCalcGeometry(existing);
        if (!existingGeom) continue;

        // Initial check: Intersects?
        if (turf.booleanIntersects(currentGeometry!, existingGeom!)) {

            // Rule 3: Containment Checks (BLOCK)
            // Check 3a: Existing fully contains New
            if (turf.booleanContains(existingGeom!, currentGeometry!)) {
                return { success: false, error: 'New shape is fully inside an existing shape.' };
            }
            // Check 3b: New fully contains Existing
            if (turf.booleanContains(currentGeometry!, existingGeom!)) {
                return { success: false, error: 'New shape fully encompasses an existing shape.' };
            }

            // Rule 4: Sequential Trimming
            const diff = turf.difference(turf.featureCollection([currentGeometry!, existingGeom!]));

            // Rule 5: Guards
            if (!diff) {
                return { success: false, error: 'Shape fully consumed by overlap.' };
            }

            const area = turf.area(diff);
            if (area < MIN_AREA_SQ_METERS) {
                return { success: false, error: 'Resulting shape is too small.' };
            }

            // Update currentGeometry for next iteration
            currentGeometry = diff as Feature<Polygon | MultiPolygon>;
        }
    }

    // Construct result feature
    // If it was a circle and got trimmed (geometry changed from initial circle conversion), 
    // we must return it as a Polygon/MultiPolygon feature. 
    // Note: currentGeometry is now the potentially trimmed version.

    // Logic: 
    // If input was Circle:
    //    If NO overlap occurred (we never entered the `if intersects` block that modified currentGeometry? 
    //    Wait, `currentGeometry` was initialized via `getCalcGeometry`. 
    //    We need to track if modification happened.

    // Let's re-verify logic.
    // We can just return the `currentGeometry` with the properties of `newFeature`.
    // BUT strict rule: "If no trimming occurs -> keep Circle as-is."

    // We can handle this by comparing geometries, or just a flag.
    // Actually, `currentGeometry` starts as the polygon-converted circle.
    // If we just return `currentGeometry`, we lose the "Circle" nature (it becomes a Polygon).

    // Better approach:
    // Re-run intersection check to see if we *need* to return the polygon version?
    // Or just flag `isModified`.

    let isModified = false;

    // We can re-loop? No, that's inefficient.
    // Let's restart the loop with modification tracking.
    // I will rewrite the loop slightly below to track `isModified`.

    currentGeometry = getCalcGeometry(newFeature)!; // Reset to start fresh for the loop with tracking

    for (const existing of relevantExisting) {
        const existingGeom = getCalcGeometry(existing);
        if (!existingGeom) continue;

        // Use intersection to detect if we need to process
        if (turf.booleanIntersects(currentGeometry!, existingGeom!)) {
            // Containment checks again
            if (turf.booleanContains(existingGeom!, currentGeometry!)) {
                return { success: false, error: 'New shape is fully inside an existing shape.' };
            }
            if (turf.booleanContains(currentGeometry!, existingGeom!)) {
                return { success: false, error: 'New shape fully encompasses an existing shape.' };
            }

            const diff = turf.difference(turf.featureCollection([currentGeometry!, existingGeom!]));
            if (!diff) {
                return { success: false, error: 'Shape fully consumed by overlap.' };
            }
            const area = turf.area(diff);
            if (area < MIN_AREA_SQ_METERS) {
                return { success: false, error: 'Resulting shape is too small.' };
            }

            currentGeometry = diff as Feature<Polygon | MultiPolygon>;
            isModified = true;
        }
    }

    if (isModified) {
        // Return as Polygon/MultiPolygon
        const resultFeature: CustomFeature = {
            ...newFeature,
            geometry: currentGeometry.geometry,
            properties: {
                ...newFeature.properties,
                shapeType: 'polygon', // Force type to polygon if trimmed, even if it was circle
                // If it was circle, we might want to remove 'radius' property to avoid confusion, 
                // but keeping it is harmless as long as shapeType implies how to render.
                // Let's keep it clean:
                radius: undefined
            }
        };

        // Ensure shapeType is correct for MultiPolygon if that happened? 
        // The CustomFeatureProperties shapeType 'polygon' is generic enough logic-wise 
        // but usually GeoJSON types are specific. 
        // Our `shapeType` is our own property. 'polygon' works for MultiPolygon too in our domain likely?
        // Checking types/geo.ts... 
        // export interface CustomFeatureProperties { shapeType: 'polygon' | 'circle' ... }
        // So 'polygon' is fine.

        return { success: true, trimmedFeature: resultFeature };
    } else {
        // No modification needed, return original (preserving Circle type if applicable)
        return { success: true, trimmedFeature: newFeature };
    }
};
