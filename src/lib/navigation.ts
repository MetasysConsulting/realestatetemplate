export type NavItem = {
  label: string;
  href: string;
  children?: NavItem[];
};

export const mainNavigation: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "Listings",
    href: "/properties",
    children: [
      { label: "Grid – Full Width", href: "/properties" },
      { label: "Grid – Sidebar", href: "/properties?view=sidebar" },
      { label: "List View", href: "/properties?view=list" },
    ],
  },
  {
    label: "Pages",
    href: "#",
    children: [
      { label: "Agents", href: "/agents" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
    ],
  },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];
