import { apiClient } from './client'
import { sha256Hex } from './hash'

export class InvalidUsernameError extends Error {
  constructor() {
    super('Invalid username')
    this.name = 'InvalidUsernameError'
  }
}

export class UsernameTakenError extends Error {
  constructor() {
    super('Username already taken')
    this.name = 'UsernameTakenError'
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials')
    this.name = 'InvalidCredentialsError'
  }
}

export async function join(username: string, password: string): Promise<void> {
  const passhash = await sha256Hex(password)
  try {
    await apiClient.post('/account/join', { username, passhash })
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 400) throw new InvalidUsernameError()
    if (status === 409) throw new UsernameTakenError()
    throw err
  }
}

export async function login(username: string, password: string): Promise<void> {
  const passhash = await sha256Hex(password)
  try {
    await apiClient.post('/account/login', { username, passhash })
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 401) throw new InvalidCredentialsError()
    throw err
  }
}
