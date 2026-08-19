// Tiny pub/sub so a toast rendered outside React's tree (Chakra's imperative
// toast) can open the bell dropdown without a state library.
type Listener = () => void;

const listeners = new Set<Listener>();

export function openNotificationBell(): void {
  listeners.forEach((fn) => fn());
}

export function subscribeToNotificationBell(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
