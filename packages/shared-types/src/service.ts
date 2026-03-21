export interface ServiceableRegion {
  regionId: string
  name: string
  travelCost: number
}

export interface Service {
  id: string
  title: string
  description: string
  basePrice: number
  requiresTimeSelection: boolean
  serviceableRegions: ServiceableRegion[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AvailableTimesRequest {
  serviceId: string
  date: string
}

export interface AvailableTimesResponse {
  date: string
  availableTimes: string[]
}
