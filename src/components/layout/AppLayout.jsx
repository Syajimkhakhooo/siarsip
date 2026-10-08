import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024
    }
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(v => !v)}
        onClose={() => setSidebarOpen(false)}
      />
      <Topbar
        isSidebarOpen={sidebarOpen}
        onMenuToggle={() => setSidebarOpen(v => !v)}
      />

      <main
        className={`pt-14 min-h-screen transition-all duration-200 ${
          sidebarOpen ? 'lg:ml-60' : 'ml-0'
        }`}
        id="main-content"
        role="main"
      >
        <div className="p-5 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
