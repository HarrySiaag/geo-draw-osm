import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../../store/useStore';
import type { CustomFeature, CustomFeatureProperties } from '../../types/geo';

const DrawControl = () => {
    const map = useMap();
    // We don't 'need' a featureGroup for visual persistence anymore as ShapeLayer handles it,
    // but DrawControl usually requires one for the edit toolbar.
    // However, since we are not implementing Edit/Delete via Leaflet.Draw's toolbar on the 'stored' shapes yet
    // (we are just doing creation), we can pass a dummy feature group or just not bind it to the stored shapes.
    // The 'edit' property in drawOptions controls editing. We want creation only for this phase?
    // "Create a global store... On shape creation... Remove original... Render all approved from Zustand".
    // So editing existing shapes via Leaflet-Draw is likely next phase or different logic.
    // For now, let's keep the FeatureGroup ref for the DrawControl to bind to, but we won't add the *created* layers to it.

    const drawControlRef = useRef<L.Control.Draw | null>(null);

    const addFeature = useStore((state) => state.addFeature);

    useEffect(() => {
        // FeatureGroup to store editable layers (required by Draw Control)
        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        const drawOptions: L.Control.DrawConstructorOptions = {
            position: 'topleft',
            draw: {
                polygon: {},
                rectangle: {},
                circle: {},
                polyline: {}, // LineString
                marker: false,
                circlemarker: false,
            },
            edit: {
                featureGroup: drawnItems,
                remove: false,
                edit: false
            }
        };

        const drawControl = new L.Control.Draw(drawOptions);
        map.addControl(drawControl);
        drawControlRef.current = drawControl;

        const onCreated = (e: L.LeafletEvent) => {
            const event = e as L.DrawEvents.Created;
            const layer = event.layer;
            const layerType = event.layerType;

            // Convert to GeoJSON
            // We cast to any temporarily to construct our CustomFeature
            const geoJSON: any = layer.toGeoJSON();

            let shapeType = layerType as string;
            if (shapeType === 'polyline') {
                shapeType = 'line';
            }

            const properties: CustomFeatureProperties = {
                id: uuidv4(),
                shapeType: shapeType as any, // 'polygon' | 'circle' | 'rectangle' | 'line'
                ...geoJSON.properties
            };

            // Handle Circle specifically
            if (layerType === 'circle' && layer instanceof L.Circle) {
                properties.radius = layer.getRadius();
                // GeoJSON geometry for circle is Point
            }

            geoJSON.properties = properties;

            // Add to store
            const result = addFeature(geoJSON as CustomFeature);
            if (!result.success) {
                alert(result.error);
                // Optionally remove the layer from the map if it was somehow added, but 
                // Leaflet Draw handles the removal of the drawing layer itself.
                // We just don't add it to our store.
            }

            // Do NOT add the layer to the map (drawnItems). 
            // The original drawing layer is removed by Leaflet Draw automatically.
        };

        map.on(L.Draw.Event.CREATED, onCreated);

        return () => {
            map.removeControl(drawControl);
            map.off(L.Draw.Event.CREATED, onCreated);
            map.removeLayer(drawnItems);
        };
    }, [map, addFeature]);

    return null;
};

export default DrawControl;
