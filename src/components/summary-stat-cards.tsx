import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
}

export function SummaryStatCards({ stats }: Props) {
  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">—</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat, i) => {
        const Icon = stat.icon
        return (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              {Icon ? (
                <Icon className="h-4 w-4 text-muted-foreground" />
              ) : null}
            </CardHeader>
            <CardContent>
              <div
                className={cn("text-2xl font-bold", stat.valueClassName)}
              >
                {stat.value}
              </div>
              {stat.caption ? (
                <p className="text-xs text-muted-foreground">{stat.caption}</p>
              ) : null}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
