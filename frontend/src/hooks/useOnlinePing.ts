import { useEffect } from 'react';
import { usersApi } from '../api/users';

export function useOnlinePing() {
  useEffect(() => {
    usersApi.ping().catch(() => {});
    const id = setInterval(() => {
      usersApi.ping().catch(() => {});
    }, 60_000);
    return () => clearInterval(id);
  }, []);
}
