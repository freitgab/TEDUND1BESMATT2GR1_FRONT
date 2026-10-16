/**
 * Storage em memória para os testes. O Node 25 expõe um `localStorage` global
 * experimental (incompleto) que sobrepõe o do jsdom; este stub torna os specs
 * determinísticos em qualquer versão do Node.
 *
 * Obs.: não depende de `vitest`, pois este arquivo também é visto pelo tsconfig do app.
 */
export function installMemoryStorage(): void {
  const data = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => Array.from(data.keys())[index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, String(value)),
  };
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true, writable: true });
}
