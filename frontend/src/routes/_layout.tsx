import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
} from "@tanstack/react-router"
import { useEffect } from "react"

import { Footer } from "@/components/Common/Footer"
import AppSidebar from "@/components/Sidebar/AppSidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { isLoggedIn } from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout")({
  component: Layout,
  beforeLoad: async () => {
    const authenticated = isLoggedIn()
    console.log("[Auth] beforeLoad check:", {
      authenticated,
      token: localStorage.getItem("access_token"),
    })
    if (!authenticated) {
      console.log("[Auth] Redirecting to login...")
      throw redirect({
        to: "/login",
      })
    }
    console.log("[Auth] User authenticated, proceeding...")
  },
})

function Layout() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoggedIn()) {
      console.log("[Auth] Layout useEffect - not logged in, redirecting...")
      navigate({ to: "/login", replace: true })
    }
  }, [navigate])

  if (!isLoggedIn()) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1 text-muted-foreground" />
        </header>
        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  )
}

export default Layout
