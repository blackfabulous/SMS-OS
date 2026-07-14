export interface SettingValue {
  key: string;
  value: unknown;
  updatedById?: string | null;
  updatedAt: Date;
}

export interface SettingDto {
  key: string;
  value: unknown;
  updatedById?: string | null;
  updatedAt: Date;
}
