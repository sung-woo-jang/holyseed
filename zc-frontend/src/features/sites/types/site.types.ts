export interface Site {
  id: string;
  code: string;
  name: string;
  baseUrl: string;
  isActive: boolean;
  crawlerConfig?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
