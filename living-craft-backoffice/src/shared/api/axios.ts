import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import type { TypedAxiosInstance } from './axios-types'

export enum ContentType {
  Json = 'application/json',
  FormData = 'multipart/form-data',
  UrlEncoded = 'application/x-www-form-urlencoded',
  Text = 'text/plain',
}

// baseURL에 /api 포함
const BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api`

const createAxiosInstance = (
  contentType: string,
  baseURL: string
): AxiosInstance => {
  const config: AxiosRequestConfig = {
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': contentType,
    },
  }

  return axios.create(config)
}

const axiosInstance = createAxiosInstance(
  ContentType.Json,
  BASE_URL
) as TypedAxiosInstance
const formInstance = createAxiosInstance(
  ContentType.FormData,
  BASE_URL
) as TypedAxiosInstance

export { axiosInstance, formInstance }
