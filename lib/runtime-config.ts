// 运行时配置 - 从服务器端环境变量获取配置
export const getRuntimeConfig = () => {
  return {
    // 优先使用动态变量，回退到 NEXT_PUBLIC_ 变量，最后使用默认值
    CASDOOR_SERVER_URL:
      process.env.CASDOOR_SERVER_URL ||
      process.env.NEXT_PUBLIC_CASDOOR_SERVER_URL ||
      "https://door.casdoor.com",

    CASDOOR_CLIENT_ID:
      process.env.CASDOOR_CLIENT_ID ||
      process.env.NEXT_PUBLIC_CASDOOR_CLIENT_ID ||
      "default_client_id",

    CASDOOR_CLIENT_SECRET:
      process.env.CASDOOR_CLIENT_SECRET ||
      process.env.NEXT_PUBLIC_CASDOOR_CLIENT_SECRET ||
      "",

    CASDOOR_APP_NAME:
      process.env.CASDOOR_APP_NAME ||
      process.env.NEXT_PUBLIC_CASDOOR_APP_NAME ||
      "",

    CASDOOR_ORGANIZATION_NAME:
      process.env.CASDOOR_ORGANIZATION_NAME ||
      process.env.NEXT_PUBLIC_CASDOOR_ORGANIZATION_NAME ||
      "",

    MONGO_URI_CLIENT:
      process.env.MONGO_URI_CLIENT ||
      process.env.NEXT_PUBLIC_MONGO_URI ||
      process.env.MONGO_URI ||
      "mongodb://mongo/place",

    DRAW_DELAY_MS: parseInt(
      process.env.DRAW_DELAY_MS ||
        process.env.NEXT_PUBLIC_DRAW_DELAY_MS ||
        "5000",
      10,
    ),

    CANVAS_WIDTH: parseInt(
      process.env.CANVAS_WIDTH || process.env.NEXT_PUBLIC_CANVAS_WIDTH || "620",
      10,
    ),

    CANVAS_HEIGHT: parseInt(
      process.env.CANVAS_HEIGHT ||
        process.env.NEXT_PUBLIC_CANVAS_HEIGHT ||
        "300",
      10,
    ),
  };
};

// 客户端配置类型
export interface RuntimeConfig {
  CASDOOR_SERVER_URL: string;
  CASDOOR_CLIENT_ID: string;
  CASDOOR_CLIENT_SECRET: string;
  CASDOOR_APP_NAME: string;
  CASDOOR_ORGANIZATION_NAME: string;
  MONGO_URI_CLIENT: string;
  DRAW_DELAY_MS: number;
  CANVAS_WIDTH: number;
  CANVAS_HEIGHT: number;
}
