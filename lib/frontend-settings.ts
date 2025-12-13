export interface SettingsConfig {
  useOverlay: boolean; // Whether to use overlay indicator
}

export interface SettingsEntry {
  label: string;
  description?: string;
  displayType: "boolean" | "number" | "string";
}

export const SettingsEntries: Record<keyof SettingsConfig, SettingsEntry> = {
  useOverlay: {
    label: "使用位置指示器",
    description: "在画板的叠加层显示当前指针所在像素点和颜色",
    displayType: "boolean",
  },
};

export const defaultSettingsConfig: SettingsConfig = {
  useOverlay: true,
};