import { apiClient } from './client'

export interface RuleEntry {
  id: string
  displayName: string
}

export interface MetaValues {
  rules?: RuleEntry[]
  [key: string]: unknown
}

export async function getMetaValues(): Promise<MetaValues> {
  const res = await apiClient.get<MetaValues>('/meta/values')
  return res.data
}
