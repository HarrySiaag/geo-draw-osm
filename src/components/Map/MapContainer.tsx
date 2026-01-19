import { MapContainer as LeafletMap, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import DrawControl from './DrawControl';
import ShapeLayer from './ShapeLayer';

import ExportButton from './ExportButton';

const MapContainer = () => {
    return (
        <div className="h-screen w-full relative">
            <ExportButton />
            <LeafletMap
                center={[51.505, -0.09]}
                zoom={13}
                scrollWheelZoom={true}
                className="h-full w-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ShapeLayer />
                <DrawControl />
            </LeafletMap>
        </div>
    );
};

export default MapContainer;
