/**
 * API error response
 */
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: unknown;
}

/**
 * API success response wrapper
 */
export interface ApiResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  services: {
    database: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
    exchanges: {
      id: string;
      status: 'ok' | 'error';
      lastCheck?: string;
    }[];
  };
}
