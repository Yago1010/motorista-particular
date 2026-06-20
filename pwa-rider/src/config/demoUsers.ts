/** Utilizadores demo — mesmo banco (scripts/seed-demo-users.php). Senha: Admin123! */

export const DEMO_PASSWORD = 'Admin123!'

export const DEMO_RIDER = {
  email: 'passageiro@demo.local',
  password: DEMO_PASSWORD,
  user: {
    id: 9001,
    first_name: 'Demo',
    last_name: 'Passageiro',
    email: 'passageiro@demo.local',
    phone: '+5511999990001',
    wallet_balance: 50,
  },
}

export const DEMO_DRIVER = {
  email: 'motorista@demo.local',
  password: DEMO_PASSWORD,
  user: {
    id: 9002,
    first_name: 'Demo',
    last_name: 'Motorista',
    email: 'motorista@demo.local',
    phone: '+5511999990002',
  },
}

export function isDemoRiderCredentials(email: string, password: string) {
  return email.trim().toLowerCase() === DEMO_RIDER.email && password === DEMO_RIDER.password
}

export function isDemoDriverCredentials(email: string, password: string) {
  return email.trim().toLowerCase() === DEMO_DRIVER.email && password === DEMO_DRIVER.password
}

export function buildDemoRiderSession() {
  return {
    token: 'demo-rider-token',
    user: DEMO_RIDER.user,
  }
}

export function buildDemoDriverSession() {
  return {
    token: 'demo-driver-token',
    user: { ...DEMO_DRIVER.user, token: 'demo-driver-token' },
  }
}
