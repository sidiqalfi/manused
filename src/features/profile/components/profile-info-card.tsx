"use client"

import { useQuery } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { profileQuery } from "../queries"
import { formatDate } from "@/lib/format"

export function ProfileInfoCard() {
  const query = useQuery(profileQuery)
  const profile = query.data?.success ? query.data.data : null

  if (query.isPending || !profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Informasi Akun</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-48" />
        </CardContent>
      </Card>
    )
  }

  const initialSource = profile.name || profile.email || "?"
  const initial = initialSource.charAt(0).toUpperCase()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informasi Akun</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar>
            {profile.avatarUrl && (
              <AvatarImage
                src={profile.avatarUrl}
                alt={profile.name ?? profile.email}
              />
            )}
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{profile.name ?? "–"}</span>
            <span className="truncate text-xs text-muted-foreground">
              {profile.email}
            </span>
          </div>
          <Badge variant={profile.role === "guest" ? "outline" : "default"}>
            {profile.role === "guest" ? "Tamu" : "Pengguna"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Terdaftar sejak {formatDate(profile.createdAt)}
        </p>
        {profile.role !== "guest" && profile.email && (
          <p className="text-xs text-muted-foreground">
            Foto profil diambil dari{" "}
            <a
              href="https://gravatar.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Gravatar
            </a>{" "}
            dengan email akun ini.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
