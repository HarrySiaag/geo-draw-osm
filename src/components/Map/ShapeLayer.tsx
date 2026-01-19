import { GeoJSON, Circle } from 'react-leaflet';
import { useStore } from '../../store/useStore';
import type { Point } from 'geojson';

const ShapeLayer = () => {
    const features = useStore((state) => state.features);
    const featureList = Object.values(features);

    return (
        <>
            {featureList.map((feature) => {
                // Handle Circle
                if (feature.properties?.shapeType === 'circle' && feature.geometry.type === 'Point') {
                    const point = feature.geometry as Point;
                    const [lng, lat] = point.coordinates;
                    const radius = feature.properties.radius || 0;

                    return (
                        <Circle
                            key={feature.properties.id}
                            center={[lat, lng]}
                            radius={radius}
                            pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }}
                        />
                    );
                }

                // Handle other shapes via GeoJSON
                return (
                    <GeoJSON
                        key={feature.properties.id}
                        data={feature}
                        style={() => ({
                            color: 'blue',
                            weight: 3,
                            opacity: 0.5
                        })}
                    />
                );
            })}
        </>
    );
};

export default ShapeLayer;
