/**
 * Nombre/logo de la app en el nav. Si la organizacion subio un logo
 * (Configuracion > Logo del negocio) se muestra esa imagen; si no, el
 * nombre generico de siempre. Se usa tanto en el layout del dueño (aside +
 * header mobile) como en el del empleado.
 */
export function OrgBrand({ logoUrl }: { logoUrl: string | null }) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt="Logo del negocio" className="h-8 max-w-[10rem] object-contain" />
    );
  }

  return <p className="text-sm font-semibold">Asistente de Precios</p>;
}
