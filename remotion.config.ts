import { Config } from "remotion";

Config.setCodec("h264");
Config.setPixelFormat("yuv420p");
Config.setCrf(18);
Config.setPreset("medium");
Config.setFrameRange([0, 300]);
Config.setDotEnvLocation(".env.local");

// Browser settings for rendering
Config.setBrowser("chrome");
Config.setChromiumOpenGlRenderer("swiftshader");
Config.setMultiProcessOnLinux(true);

export default undefined;
