with open('src/app/admin/page.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace header signout button
old_btn = """              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="admin-signout inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition"
              >
                <Icon name="close" size={13} />
                <span className="hidden sm:inline">Sign out</span>
              </button>"""

new_btn = """              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="admin-signout inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-red-500/50 hover:bg-red-950/40 text-slate-300 hover:text-red-200 text-xs font-semibold transition cursor-pointer shadow-xs"
                title="Log out of Admin Console"
              >
                <Icon name="logout" size={14} />
                <span>Log out</span>
              </button>"""

if old_btn in content:
    content = content.replace(old_btn, new_btn)
    print("Replaced header signout button")
else:
    print("Header button not found by exact string, using line replacement")
    content = content.replace('<Icon name="close" size={13} />\n                <span className="hidden sm:inline">Sign out</span>', '<Icon name="logout" size={14} />\n                <span>Log out</span>')
    content = content.replace('<Icon name="close" size={13} />\r\n                <span className="hidden sm:inline">Sign out</span>', '<Icon name="logout" size={14} />\r\n                <span>Log out</span>')

# Replace sidebar footer signout
content = content.replace(
    '<Icon name="close" size={15} /> Sign out',
    '<Icon name="logout" size={15} /> Log out'
)

# Replace popover sign out
content = content.replace(
    '<button type="button" onClick={() => signOut({ callbackUrl: "/login" })}>Sign out</button>',
    '<button type="button" onClick={() => signOut({ callbackUrl: "/login" })}>Log out</button>'
)

with open('src/app/admin/page.js', 'w', encoding='utf-8', newline='') as f:
    f.write(content)

print("Finished updating admin page")

