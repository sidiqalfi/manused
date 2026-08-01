"use client"

import { usePathname } from "next/navigation"
import { Fragment } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

/**
 * Membuat breadcrumb otomatis dari pathname.
 *
 * Contoh:
 *   /dashboard            → Dashboard
 *   /dashboard/settings   → Dashboard > Settings
 *   /dashboard/users/edit → Dashboard > Users > Edit
 */
export function DashboardBreadcrumb() {
  const pathname = usePathname()

  // Pecah path jadi segments, filter yang kosong
  // "/dashboard/settings" → ["dashboard", "settings"]
  const segments = pathname.split("/").filter(Boolean)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          // Capitalize: "dashboard" → "Dashboard"
          const label = segment
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())

          // Build href dari segments sampai index ini
          const href = "/" + segments.slice(0, index + 1).join("/")

          const isLast = index === segments.length - 1

          return (
            <Fragment key={href}>
              {index > 0 && (
                <BreadcrumbSeparator className="hidden md:block" />
              )}
              <BreadcrumbItem className={!isLast ? "hidden md:block" : ""}>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
