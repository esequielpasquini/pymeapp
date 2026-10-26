/**
 * Mensaje "flash" de una sola lectura, para avisar algo en la pantalla a
 * la que se navega despues (ej. "Producto guardado" al volver del
 * formulario de edicion). Vive en sessionStorage: sobrevive a router.back()
 * pero no queda dando vueltas entre pestañas. Lo muestra FlashToast.
 */
const KEY = "flash-message";

export function setFlash(message: string) {
  try {
    window.sessionStorage.setItem(KEY, message);
  } catch {
    // sessionStorage bloqueado: simplemente no se muestra el aviso.
  }
}

export function takeFlash(): string | null {
  try {
    const message = window.sessionStorage.getItem(KEY);
    if (message !== null) window.sessionStorage.removeItem(KEY);
    return message;
  } catch {
    return null;
  }
}
