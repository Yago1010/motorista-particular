/** Utilizadores demo — mesmo banco (scripts/seed-demo-users.php). Senha: Admin123! */

export const DEMO_PASSWORD = 'Admin123!'

export const DEMO_RIDER = {
  email: 'passageiro@demo.local',
  password: DEMO_PASSWORD,
}

export const DEMO_DRIVER = {
  email: 'motorista@demo.local',
  password: DEMO_PASSWORD,
  user: {
    id: 9002,
    token: 'demo-driver-token',
    first_name: 'Demo',
    last_name: 'Motorista',
    email: 'motorista@demo.local',
    phone: '+5511999990002',
  },
}

export function isDemoDriverCredentials(email: string, password: string) {
  return email.trim().toLowerCase() === DEMO_DRIVER.email && password === DEMO_DRIVER.password
}

export function buildDemoDriverSession() {
  return {
    token: 'demo-driver-token',
    user: DEMO_DRIVER.user,
  }
}
