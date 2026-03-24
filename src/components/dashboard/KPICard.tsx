interface KPICardProps {
    label:    string
    value:    string | number
    sub?:     string
    color?:   string
  }
  
  export function KPICard({
    label,
    value,
    sub,
    color = '#1D9E75',
  }: KPICardProps) {
    return (
      <div 
        className="bg-card border border-border rounded-xl p-5"
        style={{ borderLeft: `3px solid ${color}` }}
      >
        <p className="text-xs text-muted-foreground mb-2.5">
          {label}
        </p>
        <p className="text-3xl font-bold text-foreground leading-none m-0">
          {value}
        </p>
        {sub && (
          <p className="text-xs text-muted-foreground/80 mt-1.5 m-0 pt-1">
            {sub}
          </p>
        )}
      </div>
    )
  }