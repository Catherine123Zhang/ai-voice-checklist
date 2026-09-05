import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.vivian.voicechecklist",
  appName: "AI Voice Checklist",
  webDir: "dist",
  server: {
    // Allow loading from the Worker API
    allowNavigation: ["voice-checklist-api.autopartsalive-images.workers.dev"],
  },
  plugins: {
    StatusBar: {
      style: "DARK",
      backgroundColor: "#07080b",
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
  },
  android: {
    backgroundColor: "#07080b",
    allowMixedContent: true,
  },
};

export default config;
