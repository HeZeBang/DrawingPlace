// Frontend settings interface and entries

export interface SettingsConfig {
  useOverlay: boolean; // Whether to use overlay indicator
  showGuideOnLoad: boolean; // Whether to show the guide modal on load
  startAutoDraw: boolean; // Whether to start auto-draw feature
  xAutoDraw: number; // X coordinate for auto-draw start
  yAutoDraw: number; // Y coordinate for auto-draw start
  dataAutoDraw?: string; // Image data for auto-draw
  progressAutoDraw?: number; // Number of pixels drawn by auto-draw
  ignoreTransparentAutoDraw?: boolean; // Whether to ignore transparent pixels in auto-draw
  announcementVersion?: string; // Version of the current announcement
}

export interface SettingsEntry {
  label: string;
  description?: string;
  isHidden?: boolean;
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
  },
  startAutoDraw: {
    label: "自动绘图",
    description: "开启后，应用将自动根据上传的图片进行绘图",
    displayType: "boolean",
  },
  xAutoDraw: {
    label: "自动绘图 x 轴起点",
    description: "自动绘图时的起始 x 坐标",
    isHidden: true,
    displayType: "number",
  },
  yAutoDraw: {
    label: "自动绘图 y 轴起点",
    description: "自动绘图时的起始 y 坐标",
    isHidden: true,
    displayType: "number",
  },
  dataAutoDraw: {
    label: "自动绘图图片数据",
    description: "用于自动绘图的图片数据",
    isHidden: true,
    displayType: "string",
  },
  progressAutoDraw: {
    label: "自动绘图进度",
    description: "自动绘图已绘制的像素数量",
    isHidden: true,
    displayType: "number",
  },
  ignoreTransparentAutoDraw: {
    label: "忽略透明像素",
    description: "自动绘图时是否忽略透明像素",
    isHidden: true,
    displayType: "boolean",
  },
  announcementVersion: {
    label: "公告版本",
    description: "当前应用公告的版本号",
    // isHidden: true,
    displayType: "string",
  },
};

export const defaultSettingsConfig: SettingsConfig = {
  useOverlay: true,
  showGuideOnLoad: true,
  startAutoDraw: false,
  xAutoDraw: -1,
  yAutoDraw: -1,
  ignoreTransparentAutoDraw: true,
};

// Frontend status interface and entries

export enum ViewMode {
  MapOnly = 0,
  CanvasOnly = 1,
  Mix = 2,
}

export interface FrontendStatus {
  isLoading: boolean;
  isConnected: boolean;
  isTokenValid: boolean;
  isLoggedIn: boolean;
  onlineClients: number;
  currentViewMode: ViewMode;
  // totalActions: number;
  // totalUsers: number;
}

export const defaultFrontendStatus: FrontendStatus = {
  isLoading: false,
  isConnected: false,
  isTokenValid: false,
  isLoggedIn: false,
  onlineClients: 0,
  currentViewMode: ViewMode.Mix,
  // totalActions: 0,
  // totalUsers: 0,
};

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
    // description: "当前绘图 Token 是否有效",
    mapFunction: (value: boolean) => (value ? "有效" : "无效"),
  },
  isLoggedIn: {
    label: "登录状态",
    // description: "用户是否已通过身份验证登录",
    isHidden: true,
    mapFunction: (value: boolean) => (value ? "已登录" : "未登录"),
  },
  onlineClients: {
    label: "当前在线",
    // description: "当前正在使用应用的在线客户端数量",
  },
  // totalActions: {
  //   label: "总落笔数",
  //   // description: "自应用启动以来的落笔总数",
  // },
  // totalUsers: {
  //   label: "总用户数",
  //   // description: "自应用启动以来的独立用户总数",
  // },
  currentViewMode: {
    label: "当前视图模式",
    // description: "应用当前的视图显示模式",
    isHidden: true,
  },
};
