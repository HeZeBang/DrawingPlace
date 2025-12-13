export interface SettingsConfig {
  useOverlay: boolean; // Whether to use overlay indicator
  showGuideOnLoad: boolean; // Whether to show the guide modal on load
}

export interface SettingsEntry {
  label: string;
  description?: string;
  displayType: "boolean" | "number" | "string";
}

export const SettingsEntries: Record<keyof SettingsConfig, SettingsEntry> = {
  useOverlay: {
    label: "使用指针指示器",
    description: "在画板的叠加层显示当前指针所在像素点和颜色",
    displayType: "boolean",
  },
  showGuideOnLoad: {
    label: "加载时显示使用说明",
    description: "是否自动显示使用说明指南",
    displayType: "boolean",
  }
};

export const defaultSettingsConfig: SettingsConfig = {
  useOverlay: true,
  showGuideOnLoad: true,
};

export interface FrontendStatus {
  isLoading: boolean;
  isConnected: boolean;
  isTokenValid: boolean;
  isLoggedIn: boolean;
}

export interface StatusEntry {
  label: string;
  description?: string;
  isHidden?: boolean;
  mapFunction?: (value: any) => string;
}

export const StatusEntries: Record<keyof FrontendStatus, StatusEntry> = {
  isLoading: {
    label: "加载中",
    description: "应用是否正在加载",
    isHidden: true,
  },
  isConnected: {
    label: "连接状态",
    description: "是否已连接到绘图 Websocket 服务器",
    mapFunction: (value: boolean) => (value ? "已连接" : "未连接"),
  },
  isTokenValid: {
    label: "Token 有效性",
    description: "当前绘图 Token 是否有效",
    mapFunction: (value: boolean) => (value ? "有效" : "无效"),
  },
  isLoggedIn: {
    label: "登录状态",
    description: "用户是否已通过身份验证登录",
    isHidden: true,
    mapFunction: (value: boolean) => (value ? "已登录" : "未登录"),
  },
};