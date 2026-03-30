import React, { useEffect, useRef, useState } from "react";
import MapViewDefault, { Marker as MarkerComp, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import { Platform } from "react-native";
import Constants from "expo-constants";
import axios from "axios";

export const Marker = MarkerComp;

// Standard Polyline decoding algorithm (5-digit precision)
const decodePolyline = (encoded) => {
  if (!encoded) return [];
  let poly = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    poly.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return poly;
};

export const MapView = ({ 
  volunteer, 
  destination, 
  style, 
  children, 
  initialRegion,
  ...props 
}) => {
  const mapRef = useRef(null);
  const [routePoints, setRoutePoints] = useState([]);
  
  const config = Constants.expoConfig || Constants.manifest2?.extra?.expoConfig || {};
  const mapsApiKey = config.extra?.mapsApiKey || "";

  // Fetch route using FREE OSRM Public API (No Google Billing Required)
  useEffect(() => {
    const getFreeRoute = async () => {
      if (!volunteer || !destination) return;

      try {
        console.log("[MAP_DEBUG] Fetching route via FREE OSRM service...");
        
        // OSRM expects coordinates as lng,lat;lng,lat
        const response = await axios.get(
          `https://router.project-osrm.org/route/v1/driving/${volunteer.longitude},${volunteer.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=polyline`,
          { timeout: 5000 }
        );

        if (response.data?.routes?.[0]?.geometry) {
          const encodedPath = response.data.routes[0].geometry;
          const decodedPoints = decodePolyline(encodedPath);
          console.log(`[MAP_DEBUG] OSRM Route ready: ${decodedPoints.length} points, Dist: ${response.data.routes[0].distance}m`);
          setRoutePoints(decodedPoints);
        } else {
          console.warn("[MAP_DEBUG] No route found in OSRM response");
          setRoutePoints([]);
        }
      } catch (err) {
        console.error("[MAP_DEBUG] OSRM FREE ROUTING ERROR:", err.message);
        // Clear or keep straight line fallback
        setRoutePoints([]);
      }
    };

    getFreeRoute();
  }, [volunteer?.latitude, volunteer?.longitude, destination?.latitude, destination?.longitude]);

  // Auto-fit logic
  useEffect(() => {
    if (mapRef.current) {
      if (routePoints.length > 0) {
        mapRef.current.fitToCoordinates(routePoints, {
          edgePadding: { top: 70, right: 70, bottom: 70, left: 70 },
          animated: true,
        });
      } else if (volunteer && destination) {
        mapRef.current.fitToCoordinates(
          [
            { latitude: volunteer.latitude, longitude: volunteer.longitude },
            { latitude: destination.latitude, longitude: destination.longitude }
          ],
          {
            edgePadding: { top: 70, right: 70, bottom: 70, left: 70 },
            animated: true,
          }
        );
      }
    }
  }, [volunteer, destination, routePoints]);

  return (
    <MapViewDefault
      ref={mapRef}
      provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
      style={style || { flex: 1 }}
      initialRegion={initialRegion || (volunteer ? {
        latitude: volunteer.latitude,
        longitude: volunteer.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      } : (destination ? {
        latitude: destination.latitude,
        longitude: destination.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      } : undefined))}
      {...props}
    >
      {/* Volunteer Marker */}
      {volunteer && (
        <Marker
          coordinate={{ latitude: volunteer.latitude, longitude: volunteer.longitude }}
          title="Volunteer Partner"
          pinColor="#60B246"
        />
      )}

      {/* Destination Marker */}
      {destination && (
        <Marker
          coordinate={{ latitude: destination.latitude, longitude: destination.longitude }}
          title="Delivery Destination"
          pinColor="#FC8019"
        />
      )}

      {/* Real-time Directions (OSRM Path) */}
      {routePoints.length > 0 ? (
        <Polyline
          coordinates={routePoints}
          strokeWidth={4}
          strokeColor="#60B246"
          lineJoin="round"
          lineCap="round"
        />
      ) : (
        /* Fallback: Direct dashed line */
        volunteer && destination && (
          <Polyline
            coordinates={[
              { latitude: volunteer.latitude, longitude: volunteer.longitude },
              { latitude: destination.latitude, longitude: destination.longitude }
            ]}
            strokeColor="#60B246"
            strokeWidth={3}
          />
        )
      )}

      {children}
    </MapViewDefault>
  );
};
