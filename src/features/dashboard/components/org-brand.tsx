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
}: {
  logoUrl: string | null;
  name: string;
  subtitle?: string | null;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

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
