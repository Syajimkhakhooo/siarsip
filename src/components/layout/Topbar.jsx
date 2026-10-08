import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Search, Bell, LogOut, User, Settings, Plus } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { Avatar, DropdownMenu } from '../ui'

export default function Topbar({ isSidebarOpen, onMenuToggle }) {
  const { profile, signOut } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState('')

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      toast.error('Gagal logout')
    } else {
      toast.success('Berhasil logout')
    }
  }

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      navigate(`/arsip?search=${encodeURIComponent(searchValue.trim())}`)
    }
  }

  const userMenuItems = [
    {
      label: 'Profil',
      icon: <User className="w-4 h-4" />,
      onClick: () => navigate('/pengaturan'),
    },
    {
      label: 'Pengaturan',
      icon: <Settings className="w-4 h-4" />,
      onClick: () => navigate('/pengaturan'),
    },
    { divider: true },
    {
      label: 'Logout',
      icon: <LogOut className="w-4 h-4" />,
      onClick: handleSignOut,
      danger: true,
    },
  ]

  return (
    <header
      className={`fixed top-0 right-0 left-0 h-14 bg-white border-b border-gray-100 z-20 flex items-center px-4 gap-3 transition-all duration-200 ${
        isSidebarOpen ? 'lg:left-60' : 'left-0'
      }`}
      role="banner"
    >
      {/* Menu toggle button */}
      <button
        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors flex-shrink-0"
        onClick={onMenuToggle}
        aria-label="Toggle menu"
        title={isSidebarOpen ? 'Tutup sidebar' : 'Buka sidebar'}
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Brand shown when sidebar is closed */}
      {!isSidebarOpen && (
        <div
          onClick={onMenuToggle}
          className="flex items-center gap-2 cursor-pointer select-none py-1 px-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
          title="Buka sidebar"
        >
          <img
            src="/logo.png"
            alt="BMU Logo"
            className="w-7 h-7 rounded-md object-contain"
          />
          <span className="text-sm font-bold text-gray-900 tracking-wide hidden sm:inline">SIARSIP</span>
        </div>
      )}

      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Cari dokumen, peserta, perusahaan..."
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            onKeyDown={handleSearch}
            className="w-full h-8 pl-9 pr-3 rounded-lg bg-gray-50 border border-gray-100 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="flex-1" />

      {/* Quick action */}
      <DropdownMenu
        trigger={
          <button
            className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-gray-700 transition-colors"
            aria-label="Tambah baru"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah
          </button>
        }
        items={[
          { label: 'Upload Dokumen', onClick: () => navigate('/arsip?action=upload') },
          { label: 'Tambah Peserta', onClick: () => navigate('/peserta?action=tambah') },
          { label: 'Tambah Perusahaan', onClick: () => navigate('/perusahaan?action=tambah') },
          { label: 'Tambah Job Order', onClick: () => navigate('/perusahaan/job-order?action=tambah') },
        ]}
        align="right"
      />

      {/* User menu */}
      <DropdownMenu
        trigger={
          <button className="flex items-center gap-2 rounded-lg p-1 hover:bg-gray-50 transition-colors" aria-label="Menu pengguna">
            <Avatar name={profile?.full_name || 'Admin'} size="sm" />
            <span className="hidden md:block text-xs font-medium text-gray-700 max-w-[100px] truncate">
              {profile?.full_name || 'Admin'}
            </span>
          </button>
        }
        items={userMenuItems}
        align="right"
      />
    </header>
  )
}
