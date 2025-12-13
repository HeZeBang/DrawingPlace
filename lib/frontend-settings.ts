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