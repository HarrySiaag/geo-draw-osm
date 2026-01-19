import React from 'react';
import { useStore } from '../../store/useStore';
import type { FeatureCollection } from 'geojson';

const ExportButton: React.FC = () => {
    const features = useStore((state) => state.features);

    const handleExport = () => {
        const featureList = Object.values(features);

        const featureCollection: FeatureCollection = {
            type: 'FeatureCollection',
            features: featureList
        };

        const jsonString = JSON.stringify(featureCollection, null, 2);
        const blob = new Blob([jsonString], { type: 'application/geo+json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'export.geojson';
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <button
            onClick={handleExport}
            className="absolute top-4 right-4 z-[1000] bg-white text-gray-800 font-semibold py-2 px-4 rounded shadow hover:bg-gray-100 transition-colors"
            style={{ pointerEvents: 'auto' }}
        >
            Export GeoJSON
        </button>
    );
};

export default ExportButton;
