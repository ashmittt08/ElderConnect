import React, { useEffect, useRef } from 'react';

const mapHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { margin: 0; padding: 0; background: #0F172A; overflow: hidden; }
    #map { width: 100vw; height: 100vh; }
    .leaflet-container { background: #0F172A; }
    /* Dark mode tiles styling */
    .leaflet-layer,
    .leaflet-control-zoom-in,
    .leaflet-control-zoom-out,
    .leaflet-control-attribution {
      filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
    }
    .custom-div-icon { 
      background: none; 
      border: none; 
      font-size: 28px; 
      text-align: center; 
      line-height: 28px;
      display: flex;
      justify-content: center;
      align-items: center;
      filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.5));
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', { zoomControl: false, attributionControl: false }).setView([23.0772, 76.8513], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    let volMarker, destMarker, routeLine;
    const volIcon = L.divIcon({ className: 'custom-div-icon', html: '🛵', iconSize: [36, 36], iconAnchor: [18, 18] });
    const destIcon = L.divIcon({ className: 'custom-div-icon', html: '📍', iconSize: [36, 36], iconAnchor: [18, 36] });

    window.addEventListener('message', (event) => {
      const data = event.data;
      if (data.type === 'UPDATE_MAP') {
        const { volunteer, destination } = data;
        
        if (volunteer && volunteer.latitude && volunteer.longitude) {
          if (!volMarker) {
            volMarker = L.marker([volunteer.latitude, volunteer.longitude], { icon: volIcon, zIndexOffset: 1000 }).addTo(map);
          } else {
            // Smoothly move the marker if we wanted to (CSS transitions could be added), but setting LatLng works
            volMarker.setLatLng([volunteer.latitude, volunteer.longitude]);
          }
        }
        
        if (destination && destination.latitude && destination.longitude) {
          if (!destMarker) {
            destMarker = L.marker([destination.latitude, destination.longitude], { icon: destIcon }).addTo(map);
          } else {
            destMarker.setLatLng([destination.latitude, destination.longitude]);
          }
        }
        
        if (volunteer && destination) {
          if (routeLine) map.removeLayer(routeLine);
          
          routeLine = L.polyline([
            [volunteer.latitude, volunteer.longitude],
            [destination.latitude, destination.longitude]
          ], { color: '#60B246', weight: 4, dashArray: '8, 8' }).addTo(map);
          
          map.fitBounds(L.latLngBounds([volunteer.latitude, volunteer.longitude], [destination.latitude, destination.longitude]), { padding: [40, 40] });
        } else if (volunteer) {
          map.panTo([volunteer.latitude, volunteer.longitude]);
        }
      }
    });

    // Notify ready
    window.parent.postMessage({ type: 'MAP_READY' }, '*');
  </script>
</body>
</html>
`;

export const MapView = ({ volunteer, destination, style }) => {
  const iframeRef = useRef(null);
  
  const updateMap = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'UPDATE_MAP', volunteer, destination }, '*');
    }
  };

  useEffect(() => {
    updateMap();
  }, [volunteer, destination]);

  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data?.type === 'MAP_READY') {
        updateMap();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [volunteer, destination]);

  return (
    <iframe
      ref={iframeRef}
      title="Live Delivery Tracking Map"
      style={{ border: 'none', width: '100%', height: '100%', ...(style || {}) }}
      srcDoc={mapHtml}
      onLoad={updateMap}
    />
  );
};

export const Marker = ({ coordinate, title }) => {
  // Polyfill for native Marker if accidentally used inside MapView tags.
  return null;
};
