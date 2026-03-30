require('dotenv').config();

module.exports = ({ config }) => {
  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey: process.env.MAPS_API_KEY || "",
        },
      },
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "FOREGROUND_SERVICE",
      ],
    },
    // Note: react-native-maps is NOT a config plugin. 
    // It is configured via the android.config.googleMaps.apiKey instead.
    plugins: [
      ...config.plugins || [],
    ],
    extra: {
      ...config.extra,
      mapsApiKey: process.env.MAPS_API_KEY || "",
    },
  };
};
