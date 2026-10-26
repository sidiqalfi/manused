import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type SummaryStat = {
  label: string
  value: string
  caption?: string | null
  icon?: LucideIcon
  valueClassName?: string
}

type Props = {
  stats: SummaryStat[] | null
  columns?: 3 | 4
}

export function SummaryStatCards({ stats, columns = 3 }: Props) {
  const gridClass =
    columns === 4 ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-3"

  return (
    <div className={cn("grid gap-4", gridClass)}>
      {(stats ?? [null, null, null]).map((stat, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            {stat ? (
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
            ) : (
              <Skeleton className="h-4 w-24" />
            )}
            {stat?.icon ? (
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            ) : null}
          </CardHeader>
          <CardContent>
            {stat ? (
              <>
                <div
                  className={cn("text-2xl font-bold", stat.valueClassName)}
                >
                  {stat.value}
                </div>
                {stat.caption ? (
                  <p className="text-xs text-muted-foreground">{stat.caption}</p>
                ) : null}
              </>
            ) : (
              <Skeleton className="h-8 w-20" />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
