export default ({ config }) => ({
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
  plugins: [
    ...config.plugins || [],
    [
      "react-native-maps",
      {
        "googleMapsApiKey": process.env.MAPS_API_KEY || ""
      }
    ]
  ],
});
