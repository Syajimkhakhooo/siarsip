import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, FolderOpen, Users, Building2, FileText,
  Activity, BarChart2, Settings, ChevronDown, ChevronRight,
  Inbox, Send, BookOpen, Archive, Clock, Star, Trash2
} from 'lucide-react'

const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/',
  },
  {
    id: 'arsip',
    label: 'Arsip',
    icon: Archive,
    children: [
      { label: 'Semua Dokumen', path: '/arsip', icon: FolderOpen },
      { label: 'Terbaru', path: '/arsip/terbaru', icon: Clock },
      { label: 'Akan Kedaluwarsa', path: '/arsip/kedaluwarsa', icon: Clock },
      { label: 'Favorit', path: '/arsip/favorit', icon: Star },
      { label: 'Trash', path: '/arsip/trash', icon: Trash2 },
    ],
  },
  {
    id: 'peserta',
    label: 'Peserta',
    icon: Users,
    children: [
      { label: 'Semua Peserta', path: '/peserta' },
      { label: 'Aktif', path: '/peserta?status=aktif' },
      { label: 'Selesai', path: '/peserta?status=selesai' },
      { label: 'Alumni', path: '/peserta?status=alumni' },
    ],
  },
  {
    id: 'perusahaan',
    label: 'Perusahaan',
    icon: Building2,
    children: [
      { label: 'Semua Perusahaan', path: '/perusahaan' },
      { label: 'Job Order', path: '/perusahaan/job-order' },
    ],
  },
  {
    id: 'administrasi',
    label: 'Administrasi',
    icon: FileText,
    children: [
      { label: 'Surat Masuk', path: '/administrasi/surat-masuk', icon: Inbox },
      { label: 'Surat Keluar', path: '/administrasi/surat-keluar', icon: Send },
      { label: 'Dokumen Lembaga', path: '/administrasi/dokumen-lembaga', icon: BookOpen },
    ],
  },
  {
    id: 'aktivitas',
    label: 'Aktivitas',
    icon: Activity,
    path: '/aktivitas',
  },
  {
    id: 'laporan',
    label: 'Laporan',
    icon: BarChart2,
    path: '/laporan',
  },
  {
    id: 'pengaturan',
    label: 'Pengaturan',
    icon: Settings,
    path: '/pengaturan',
  },
]

export default function Sidebar({ isOpen, onClose, onToggle }) {
  const location = useLocation()
  const [expanded, setExpanded] = useState({})

  // Auto-expand active section
  useEffect(() => {
    NAV_ITEMS.forEach(item => {
      if (item.children) {
        const isActive = item.children.some(c => location.pathname.startsWith(c.path?.split('?')[0]))
        if (isActive) {
          setExpanded(prev => ({ ...prev, [item.id]: true }))
        }
      }
    })
  }, [location.pathname])

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleNavClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose?.()
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen z-40 flex flex-col
          bg-white border-r border-gray-100
          transition-transform duration-250 ease-in-out
          w-60
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        role="navigation"
        aria-label="Navigasi utama"
      >
        {/* Logo - clickable to toggle sidebar */}
        <div
          className="flex items-center h-14 px-4 border-b border-gray-100 flex-shrink-0 cursor-pointer group hover:bg-gray-50/70 transition-colors"
          onClick={() => (onToggle ? onToggle() : onClose?.())}
          title="Klik logo atau nama untuk menutup sidebar"
        >
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="BMU Logo"
              className="w-8 h-8 rounded-lg object-contain flex-shrink-0"
            />
            <div>
              <p className="text-sm font-bold text-gray-900 leading-none tracking-wide">SIARSIP</p>
              <p className="text-[10px] text-gray-400 leading-none mt-0.5">LPK Bahtera Mitra Unggulan</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV_ITEMS.map(item => (
            <div key={item.id} className="mb-0.5">
              {item.path ? (
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-100
                    ${isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                  onClick={handleNavClick}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </NavLink>
              ) : (
                <>
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-100"
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {expanded[item.id]
                      ? <ChevronDown className="w-3.5 h-3.5" />
                      : <ChevronRight className="w-3.5 h-3.5" />
                    }
                  </button>

                  {expanded[item.id] && (
                    <div className="ml-4 mt-0.5 pl-3 border-l border-gray-100 space-y-0.5">
                      {item.children.map(child => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          className={({ isActive }) =>
                            `flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors duration-100
                            ${isActive
                              ? 'text-gray-900 font-medium bg-gray-100'
                              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                            }`
                          }
                          onClick={handleNavClick}
                        >
                          {child.icon && <child.icon className="w-3.5 h-3.5" />}
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2 py-3 border-t border-gray-100 flex-shrink-0">
          <p className="px-3 text-[10px] text-gray-400">
            © {new Date().getFullYear()} SIARSIP · BMU
          </p>
        </div>
      </aside>
    </>
  )
}
