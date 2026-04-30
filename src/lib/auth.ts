const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

export function validateCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('sirkasir_auth') === 'true';
}

export function login(username: string, password: string): boolean {
  if (validateCredentials(username, password)) {
    localStorage.setItem('sirkasir_auth', 'true');
    localStorage.setItem('sirkasir_user', username);
    return true;
  }
  return false;
}

export function logout(): void {
  localStorage.removeItem('sirkasir_auth');
  localStorage.removeItem('sirkasir_user');
}
