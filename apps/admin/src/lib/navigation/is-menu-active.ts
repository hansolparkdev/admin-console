/**
 * Returns true when the current pathname matches the menu href.
 * Uses segment-level prefix matching to prevent false positives
 * (e.g. /usersettings must not match /users).
 */
export function isMenuActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}
