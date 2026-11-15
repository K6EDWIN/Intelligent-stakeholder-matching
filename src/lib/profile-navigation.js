export function profilePathForRole(role) {
  return role === "ADMIN" ? "/admin/profile" : "/profile";
}
