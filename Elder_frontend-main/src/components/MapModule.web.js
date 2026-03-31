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
    const map = L.map('map', { zoomControl: false, attributionControl: false }).setView([23.2599, 77.4126], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    let volMarker, destMarker, routeLine;
    const volIcon = L.divIcon({ className: 'custom-div-icon', html: '🛵', iconSize: [36, 36], iconAnchor: [18, 18] });
    const destIcon = L.divIcon({ className: 'custom-div-icon', html: '📍', iconSize: [36, 36], iconAnchor: [18, 36] });

    async function fetchOSRMRoute(start, end) {
      try {
        const url = \`https://router.project-osrm.org/route/v1/driving/\${start[1]},\${start[0]};\${end[1]},\${end[0]}?overview=full&geometries=polyline\`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          // Send route info (duration + distance) back to parent
          window.parent.postMessage({
            type: 'ROUTE_INFO',
            distance: route.distance,
            duration: route.duration,
          }, '*');
          return route.geometry;
        }
      } catch (err) {
        console.error("OSRM Fetch Error:", err);
      }
      return null;
    }

    // Polyline decoding helper for Leaflet
    function decode(str, precision) {
      var index = 0, lat = 0, lng = 0, coordinates = [], shift = 0, result = 0, byte = null, latitude_change, longitude_change, factor = Math.pow(10, precision || 5);
      while (index < str.length) {
        byte = null; shift = 0; result = 0;
        do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
        latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1)); lat += latitude_change;
        shift = 0; result = 0;
        do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
        longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1)); lng += longitude_change;
        coordinates.push([lat / factor, lng / factor]);
      }
      return coordinates;
    };

    window.addEventListener('message', async (event) => {
      const data = event.data;
      if (data.type === 'UPDATE_MAP') {
        const { volunteer, destination } = data;
        
        if (volunteer && volunteer.latitude && volunteer.longitude) {
          if (!volMarker) {
            volMarker = L.marker([volunteer.latitude, volunteer.longitude], { icon: volIcon, zIndexOffset: 1000 }).addTo(map);
          } else {
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
          const encoded = await fetchOSRMRoute([volunteer.latitude, volunteer.longitude], [destination.latitude, destination.longitude]);
          
          if (routeLine) map.removeLayer(routeLine);
          
          if (encoded) {
            const points = decode(encoded);
            routeLine = L.polyline(points, { color: '#60B246', weight: 5, lineJoin: 'round' }).addTo(map);
          } else {
            // Fallback to straight line
            routeLine = L.polyline([
              [volunteer.latitude, volunteer.longitude],
              [destination.latitude, destination.longitude]
            ], { color: '#60B246', weight: 4, dashArray: '8, 8' }).addTo(map);
          }
          
          map.fitBounds(L.latLngBounds([volunteer.latitude, volunteer.longitude], [destination.latitude, destination.longitude]), { padding: [50, 50] });
        } else if (volunteer) {
          map.panTo([volunteer.latitude, volunteer.longitude]);
        }
      }
    });

    window.parent.postMessage({ type: 'MAP_READY' }, '*');
  </script>
</body>
</html>
`;

export const MapView = ({ volunteer, destination, style, onRouteUpdate }) => {
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
      if (e.data?.type === 'ROUTE_INFO' && onRouteUpdate) {
        onRouteUpdate({
          distance: e.data.distance,
          duration: e.data.duration,
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [volunteer, destination, onRouteUpdate]);

  return (
    <iframe
      ref={iframeRef}
      title="Live Delivery Tracking Map"
      style={{ border: 'none', width: '100%', height: '100%', borderRadius: '12px', ...(style || {}) }}
      srcDoc={mapHtml}
      onLoad={updateMap}
    />
  );
};

export const Marker = ({ coordinate, title }) => {
  return null;
};
