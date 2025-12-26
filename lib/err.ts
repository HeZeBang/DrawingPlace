export enum AppErrorCode {
  Success = 0,
  InvalidToken = -1,
  UnknownError = -2,
  InvalidRequest = -3,
  InsufficientPoints = -4,
  InvalidPosition = -5,
  Expired = -6,
}

export interface AppError {
  code: AppErrorCode;
  message: string;
  pointsLeft?: number;
  lastUpdate?: number;
}
