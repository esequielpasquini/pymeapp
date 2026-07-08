/**
 * Bloque de marca del top nav: logo (o iniciales del negocio en un avatar
 * circular si todavia no subieron uno) + nombre del negocio, con el nombre
 * de quien esta logueado como subtitulo. Todo en una sola fila con
 * `items-center` para que el logo y el texto queden alineados y centrados
 * entre si en vez de quedar el nombre "flotando" abajo sin relacion visual
 * con el logo (que ademas era chico -- ahora es un circulo de 44/48px).
 */
export function OrgBrand({
  logoUrl,
  name,
  subtitle,
  compact = false,
}: {
  logoUrl: string | null;
  name: string;
  subtitle?: string | null;
  /**
   * Version chica para headers horizontales (top nav del empleado y del
   * dueño en mobile/tablet): avatar mas chico y todo en una sola linea, para
   * no comerse espacio vertical que deberia ser para los resultados de
   * busqueda y los filtros. La version normal (mas alta, con el subtitulo en
   * su propia linea) sigue siendo la del sidebar de escritorio, donde sobra
   * alto de sobra.
   */
  compact?: boolean;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  if (compact) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-primary">{initial}</span>
          )}
        </div>
        <p className="truncate text-sm font-semibold leading-tight">
          {name}
          {subtitle && <span className="font-normal text-muted-foreground"> · {subtitle}</span>}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 md:h-12 md:w-12">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-lg font-bold text-primary md:text-xl">{initial}</span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold leading-tight md:text-base">{name}</p>
        {subtitle && (
          <p className="truncate text-xs text-muted-foreground leading-tight md:text-sm">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
