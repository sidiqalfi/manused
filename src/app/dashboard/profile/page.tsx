"use client"

import { ProfileInfoCard } from "@/features/profile/components/profile-info-card"
import { UpdateProfileForm } from "@/features/profile/components/update-profile-form"
import { ChangePasswordForm } from "@/features/profile/components/change-password-form"

export default function ProfilePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Kelola akun kamu.
        </p>
      </div>

      <ProfileInfoCard />
      <UpdateProfileForm />
      <ChangePasswordForm />
    </div>
  )
}
