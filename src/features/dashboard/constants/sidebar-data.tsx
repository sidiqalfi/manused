import {
  LayoutDashboardIcon,
  Wallet,
  Users,
  HandCoins,
  Shuffle,
  CalendarDays,
  CircleUser,
  ScrollText,
  Settings,
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
      title: "Profile",
      url: "/dashboard/profile",
      icon: <CircleUser />,
      guestHidden: true,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: <Settings />,
      guestHidden: true,
    },
  ],
}
