import {
  LifeBuoyIcon,
  SendIcon,
  FrameIcon,
  PieChartIcon,
  MapIcon,
  LayoutDashboardIcon,
  Wallet,
  Users,
  HandCoins,
  Shuffle,
  Settings,
} from "lucide-react"

export const sidebarData = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
      isActive: true,
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
      title: "Members",
      url: "/dashboard/members",
      icon: <Users />,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: <Settings />,
    },
    {
      title: "Support",
      url: "#",
      icon: <LifeBuoyIcon />,
    },
    {
      title: "Feedback",
      url: "#",
      icon: <SendIcon />,
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: <FrameIcon />,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: <PieChartIcon />,
    },
    {
      name: "Travel",
      url: "#",
      icon: <MapIcon />,
    },
  ],
}
