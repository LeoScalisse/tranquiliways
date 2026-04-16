import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.tranquiliways.app",
  appName: "TranquiliWays",
  webDir: "dist",
  bundledWebRuntime: false,
  backgroundColor: "#d8f0ff",
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
    StatusBar: {
      style: "light",
      backgroundColor: "#d8f0ff",
      overlaysWebView: true,
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
