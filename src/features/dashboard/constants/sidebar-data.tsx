import {
  LayoutDashboardIcon,
  Wallet,
  Users,
  HandCoins,
  Shuffle,
  CalendarDays,
  ScrollText,
  Settings,
  UserCog,
} from "lucide-react"

export const sidebarData = {
  user: {
    name: "Pengguna",
    email: "",
    avatar: "",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Kas",
      url: "/dashboard/cash",
      icon: <Wallet />,
    },
    {
      title: "Sosial",
      url: "/dashboard/sosial",
      icon: <HandCoins />,
    },
    {
      title: "Arisan",
      url: "/dashboard/arisan",
      icon: <Shuffle />,
    },
    {
      title: "Kegiatan",
      url: "/dashboard/kegiatan",
      icon: <CalendarDays />,
    },
    {
      title: "Members",
      url: "/dashboard/members",
      icon: <Users />,
      guestHidden: true,
    },
    {
      title: "Log",
      url: "/dashboard/log",
      icon: <ScrollText />,
      guestHidden: true,
    },
  ],
  navSecondary: [
    {
      title: "Kelola Pengguna",
      url: "/dashboard/users",
      icon: <UserCog />,
      adminOnly: true,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: <Settings />,
      guestHidden: true,
    },
  ],
}
