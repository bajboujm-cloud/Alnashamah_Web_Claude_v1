/** What each staff role may do. Checked on every admin page and every admin action. */
export const roles = ["owner", "manager", "order_staff", "content_editor"] as const;
export type Role = (typeof roles)[number];

export const permissions = [
  "dashboard.view",
  "stock.toggle", // switch breeds / sizes / options in or out of stock
  "catalog.content", // names, descriptions, photos, illustrations
  "catalog.prices", // prices, ages, weights, adding/removing sizes, categories & seasons
  "settings.edit",
  "staff.manage",
  "audit.view",
] as const;
export type Permission = (typeof permissions)[number];

const grants: Record<Role, readonly Permission[]> = {
  owner: permissions,
  manager: [
    "dashboard.view",
    "stock.toggle",
    "catalog.content",
    "catalog.prices",
    "settings.edit",
    "audit.view",
  ],
  order_staff: ["dashboard.view", "stock.toggle"],
  content_editor: ["dashboard.view", "catalog.content"],
};

export const can = (role: Role, permission: Permission) => grants[role].includes(permission);
