type Listener = (isSlow: boolean) => void;

let slowCount = 0;
const listeners = new Set<Listener>();

function notify() {
  const slow = slowCount > 0;
  listeners.forEach((fn) => fn(slow));
}

export const slowLoadStore = {
  increment() {
    slowCount++;
    notify();
  },
  decrement() {
    if (slowCount > 0) {
      slowCount--;
      notify();
    }
  },
  isSlow(): boolean {
    return slowCount > 0;
  },
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
