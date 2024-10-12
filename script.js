document.addEventListener('DOMContentLoaded', () => {
    // Initialize the map
    let map = L.map('map').setView([39.963, -75.172], 13);

    // Load map tiles from OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    let rectangle;
    let cornerMarkers = [];

    document.getElementById('showSelectionButton').addEventListener('click', () => {
        // Define the initial square bounds
        const bounds = [[39.945, -75.15], [39.963, -75.17]];
        if (rectangle) {
            map.removeLayer(rectangle);
            cornerMarkers.forEach(marker => map.removeLayer(marker));
        }

        // Create a locked square using the initial bounds
        rectangle = L.rectangle(bounds, { color: "#ff7800", weight: 1, fillColor: "green" }).addTo(map);
        addCornerMarkers(bounds);
        updateInfo();
    });

    function addCornerMarkers(bounds) {
        // Remove old markers if they exist
        cornerMarkers.forEach(marker => map.removeLayer(marker));
        cornerMarkers = [];

        // Add draggable markers to each corner of the rectangle
        const corners = [bounds.getNorthWest(), bounds.getNorthEast(), bounds.getSouthWest(), bounds.getSouthEast()];
        corners.forEach((corner, index) => {
            const marker = L.marker(corner, { draggable: true }).addTo(map);
            marker.on('drag', () => updateRectangle(marker, index));
            cornerMarkers.push(marker);
        });
    }

    function updateRectangle(draggedMarker, cornerIndex) {
        // Update the rectangle to maintain a square aspect ratio
        let latLngs = rectangle.getLatLngs()[0];

        // Calculate new coordinates while maintaining a square
        const otherCornerIndex = (cornerIndex + 2) % 4; // The opposite corner
        const oppositeCorner = cornerMarkers[otherCornerIndex].getLatLng();

        // Determine distance in both directions to lock to a square
        const deltaLat = Math.abs(oppositeCorner.lat - draggedMarker.getLatLng().lat);
        const deltaLng = Math.abs(oppositeCorner.lng - draggedMarker.getLatLng().lng);
        const size = Math.min(deltaLat, deltaLng); // Ensure square layout

        // Update other corner markers to ensure it's a square
        const newLatLngs = [
            [oppositeCorner.lat, oppositeCorner.lng],
            [oppositeCorner.lat, oppositeCorner.lng - size],
            [oppositeCorner.lat - size, oppositeCorner.lng],
            [oppositeCorner.lat - size, oppositeCorner.lng - size]
        ];

        rectangle.setBounds(newLatLngs);
        updateInfo();
    }

    function updateInfo() {
        const bounds = rectangle.getBounds();
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        document.getElementById('coordinates').value = `NE: ${ne.lat}, ${ne.lng}, SW: ${sw.lat}, ${sw.lng}`;

        // Calculate area in km² (rough estimate)
        const latDiff = Math.abs(ne.lat - sw.lat);
        const lngDiff = Math.abs(ne.lng - sw.lng);
        const area = (latDiff * lngDiff * 111 * 111).toFixed(2); // Rough km² estimation
        document.getElementById('area').innerText = `${area} km²`;

        // Update rectangle color based on area size
        if (area <= 4) {
            rectangle.setStyle({ fillColor: "green" });
        } else {
            rectangle.setStyle({ fillColor: "red" });
        }
    }

    document.getElementById('copyButton').addEventListener('click', () => {
        const coordinates = document.getElementById('coordinates').value;
        navigator.clipboard.writeText(coordinates).then(() => {
            alert('Coordinates copied to clipboard');
        });
    });
});
