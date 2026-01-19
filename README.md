# CYBER JOAR AI - Intelligent Spatial Drawing Tool

## 1. Project Overview
CYBER JOAR AI is an intelligent web-based mapping application that allows users to draw and manage spatial geometries on an OpenStreetMap interface. Unlike standard drawing tools, it enforces strict spatial rules to prevent invalid overlaps and ensures data integrity.

**Key Features:**
- **OpenStreetMap Rendering:** High-performance mapping using React-Leaflet.
- **Support for Multiple Shapes:** Polygon, Rectangle, Circle, and LineString.
- **Intelligent Overlap Prevention:**
  - **Blocks** shapes that are fully fully contained within another or fully contain an existing shape.
  - **Auto-Trims** overlapping shapes to resolve conflicts dynamically.
- **Valid GeoJSON Export:** Export your work as a standard FeatureCollection.
- **Dynamic Shape Limits:** Configurable maximum counts per shape type.

## 2. Tech Stack
- **Frontend Framework:** React + TypeScript + Vite
- **Mapping Engine:** React-Leaflet + Leaflet Draw
- **Spatial Analysis:** Turf.js
- **State Management:** Zustand
- **Styling:** Tailwind CSS

## 3. Setup & Run Instructions

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd cyber-joar-ai

# Install dependencies
npm install
```

### Development Server
```bash
# Start the dev server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production
```bash
npm run build
```

## 4. Spatial Logic Explanation
This project enforces non-overlapping rules for polygonal geometries using Turf.js.

- **Overlap Detection:** Uses `turf.booleanIntersects` to detect collisions between the new shape and existing shapes.
- **Containment Rules (Blocking):**
  - If Existing contains New → **BLOCKED**
  - If New contains Existing → **BLOCKED**
  - This ensures no shape is strictly nested inside another.
- **Auto-Trim Logic:**
  - If a partial overlap occurs, `turf.difference` is used to subtract the intersecting area from the new shape.
  - If the resulting shape is a `MultiPolygon`, it is accepted and stored as-is.
- **Circle Handling:**
  - Circles are stored as a Point geometry with a `radius` property.
  - For spatial checks, they are temporarily converted to Polygons using `turf.circle`.
  - If no overlap occurs, it remains a Circle.
  - If trimming occurs, the result is stored permanently as a Polygon (or MultiPolygon).
- **LineStrings:**
  - LineStrings are **excluded** from all overlap checks. They can cross any shape freely.

## 5. Shape Limits
Maximum counts for each shape type are strictly enforced to manage performance and map clutter.

- **Configuration:** Limits are defined in `src/config/shapeLimits.ts`.
- **Default Limits:** (Currently set to 10 per type, but configurable).
- **Behavior:** If a user attempts to draw a shape that exceeds the limit for that type, the action is blocked, and an alert is shown.

## 6. GeoJSON Export
Users can export their drawn features at any time.

- **Format:** Standard GeoJSON `FeatureCollection`.
- **Properties:** Includes unique `id`, `shapeType`, and `radius` (if applicable).
- **How to Export:** Click the "Export GeoJSON" button in the top-right corner.

**Sample Export Snippet:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "uuid-1234",
        "shapeType": "circle",
        "radius": 500
      },
      "geometry": {
        "type": "Point",
        "coordinates": [ -0.09, 51.505 ]
      }
    }
  ]
}
```

## 7. Live Demo
[Link to Hosted Demo](https://example.com) *(Placeholder)*

## 8. Folder Structure
- `src/components/Map`: Core map components (MapContainer, DrawControl, ShapeLayer).
- `src/store`: Zustand state management (`useStore.ts`).
- `src/utils`: Helper functions, including `spatialUtils.ts` for logic.
- `src/config`: Configuration files like `shapeLimits.ts`.
- `src/types`: TypeScript definitions for GeoJSON and custom features.
