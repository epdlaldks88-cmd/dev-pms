export function getAccessToken(): string | null {
  return sessionStorage.getItem('accessToken') ?? localStorage.getItem('accessToken');
}
