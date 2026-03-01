export const USER_ROLES = {
  ADMIN: 'Admin',
  USER: 'User',
  ROOT: 'Root',
  VIEWER: 'Viewer'
} as const;

export const ROLE_TRANSLATIONS: { [key: string]: string } = {
  [USER_ROLES.ADMIN]: 'Administrador',
  [USER_ROLES.USER]: 'Usuario',
  [USER_ROLES.ROOT]: 'Super Usuario',
  [USER_ROLES.VIEWER]: 'Visor'
};

export const ROLES_LIST = Object.values(USER_ROLES).map(role => ({
  value: role,
  label: ROLE_TRANSLATIONS[role]
}));
