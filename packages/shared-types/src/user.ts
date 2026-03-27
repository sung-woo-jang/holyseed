export interface User {
  id: string
  email: string
  name: string
  phone: string
  createdAt: string
  updatedAt: string
}

export interface CreateUserRequest {
  email: string
  name: string
  phone: string
}

export interface UpdateUserRequest {
  name?: string
  phone?: string
}

export interface UserResponse {
  user: User
}
