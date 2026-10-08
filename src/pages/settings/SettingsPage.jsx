import { useState, useEffect } from 'react'
import { Settings, Save, User, Shield, Tag, Database, Plus, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { Button, Card, Input, PageHeader, Badge, Tabs, SearchableSelect } from '../../components/ui'

export default function SettingsPage() {
  const { user, profile } = useAuth()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState('umum')
  const [loading, setLoading] = useState(false)

  // Institution settings
  const [instSettings, setInstSettings] = useState({
    org_name: 'LPK Bahtera Mitra Unggulan',
    org_short: 'BMU',
    doc_number_prefix: 'BMU',
    expiry_warning_days: '90',
    expiry_critical_days: '30',
  })

  // Categories
  const [categories, setCategories] = useState([])
  const [newCatName, setNewCatName] = useState('')
  const [newCatCode, setNewCatCode] = useState('')
  const [newCatType, setNewCatType] = useState('peserta')
  const [addingCat, setAddingCat] = useState(false)

  // Profile
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    loadSettings()
    loadCategories()
  }, [])

  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name)
    }
  }, [profile])

  async function loadSettings() {
    try {
      const { data } = await supabase.from('system_settings').select('*')
      if (data) {
        const mapped = {}
        data.forEach(s => { mapped[s.key] = s.value })
        setInstSettings(prev => ({ ...prev, ...mapped }))
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function loadCategories() {
    try {
      const { data } = await supabase.from('document_categories').select('*').order('name')
      setCategories(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  async function handleSaveSettings(e) {
    e.preventDefault()
    setLoading(true)
    try {
      for (const [key, value] of Object.entries(instSettings)) {
        await supabase
          .from('system_settings')
          .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      }
      toast.success('Pengaturan lembaga berhasil disimpan')
    } catch (err) {
      toast.error('Gagal menyimpan: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    setLoading(true)
    try {
      if (fullName !== profile?.full_name) {
        const { error } = await supabase
          .from('profiles')
          .update({ full_name: fullName, updated_at: new Date().toISOString() })
          .eq('id', user.id)
        if (error) throw error
      }

      if (newPassword) {
        const { error: pwdErr } = await supabase.auth.updateUser({ password: newPassword })
        if (pwdErr) throw pwdErr
        setNewPassword('')
      }

      toast.success('Profil berhasil diperbarui')
    } catch (err) {
      toast.error('Gagal memperbarui profil: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddCategory(e) {
    e.preventDefault()
    if (!newCatName || !newCatCode) return
    setAddingCat(true)
    try {
      const { error } = await supabase.from('document_categories').insert({
        name: newCatName,
        code: newCatCode.toUpperCase(),
        type: newCatType,
        is_active: true,
      })
      if (error) throw error
      toast.success('Kategori baru berhasil ditambahkan')
      setNewCatName('')
      setNewCatCode('')
      loadCategories()
    } catch (err) {
      toast.error('Gagal menambahkan kategori: ' + err.message)
    } finally {
      setAddingCat(false)
    }
  }

  const tabs = [
    { id: 'umum', label: 'Pengaturan Lembaga' },
    { id: 'kategori', label: 'Kategori Dokumen' },
    { id: 'profil', label: 'Profil Admin' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan Sistem"
        description="Konfigurasi lembaga, master kategori dokumen, dan akun administrator"
        breadcrumb={['Dashboard', 'Pengaturan']}
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'umum' && (
        <Card className="max-w-2xl">
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Identitas Lembaga</h2>

            <Input
              id="set-org-name"
              label="Nama Resmi Lembaga"
              value={instSettings.org_name}
              onChange={e => setInstSettings(prev => ({ ...prev, org_name: e.target.value }))}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                id="set-org-short"
                label="Singkatan / Kode Lembaga"
                value={instSettings.org_short}
                onChange={e => setInstSettings(prev => ({ ...prev, org_short: e.target.value }))}
              />

              <Input
                id="set-doc-prefix"
                label="Prefix Penomoran Dokumen"
                value={instSettings.doc_number_prefix}
                onChange={e => setInstSettings(prev => ({ ...prev, doc_number_prefix: e.target.value }))}
              />
            </div>

            <h2 className="text-base font-semibold text-gray-900 pt-4 border-t border-gray-100">
              Kebijakan Masa Berlaku (Kedaluwarsa)
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <Input
                id="set-warning-days"
                label="Batas Hari Peringatan (Warning)"
                type="number"
                value={instSettings.expiry_warning_days}
                onChange={e => setInstSettings(prev => ({ ...prev, expiry_warning_days: e.target.value }))}
                hint="Hari sebelum berkas kedaluwarsa (kuning)"
              />

              <Input
                id="set-critical-days"
                label="Batas Hari Kritis (Critical)"
                type="number"
                value={instSettings.expiry_critical_days}
                onChange={e => setInstSettings(prev => ({ ...prev, expiry_critical_days: e.target.value }))}
                hint="Hari sebelum berkas kedaluwarsa (merah)"
              />
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <Button type="submit" variant="primary" loading={loading} icon={<Save className="w-4 h-4" />}>
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'kategori' && (
        <div className="space-y-6 max-w-4xl">
          {/* Add Category Form */}
          <Card>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Tambah Kategori Baru</h2>
            <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <Input
                id="new-cat-name"
                label="Nama Kategori"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="Contoh: Medical Check Up"
                required
              />

              <Input
                id="new-cat-code"
                label="Kode Singkatan"
                value={newCatCode}
                onChange={e => setNewCatCode(e.target.value)}
                placeholder="Contoh: MCU"
                required
              />

              <SearchableSelect
                id="new-cat-type"
                label="Tipe"
                value={newCatType}
                onChange={val => setNewCatType(val)}
                options={[
                  { value: 'peserta', label: 'Peserta' },
                  { value: 'lembaga', label: 'Lembaga' },
                  { value: 'perusahaan', label: 'Perusahaan' },
                  { value: 'umum', label: 'Umum' },
                ]}
              />

              <Button type="submit" variant="primary" loading={addingCat} icon={<Plus className="w-4 h-4" />}>
                Tambah
              </Button>
            </form>
          </Card>

          {/* Existing Categories */}
          <Card padding={false}>
            <div className="p-4 border-b border-gray-100 font-semibold text-sm text-gray-900">
              Master Kategori Dokumen Terdaftar ({categories.length})
            </div>
            <div className="divide-y divide-gray-50">
              {categories.map(cat => (
                <div key={cat.id} className="p-3.5 flex items-center justify-between hover:bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                      {cat.code}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{cat.type}</Badge>
                    <Badge variant={cat.is_active ? 'success' : 'default'}>
                      {cat.is_active ? 'Aktif' : 'Non-aktif'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'profil' && (
        <Card className="max-w-xl">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Akun Administrator</h2>

            <Input
              id="prof-email"
              label="Email Administrator"
              value={user?.email || ''}
              disabled
              hint="Email akun Supabase Auth"
            />

            <Input
              id="prof-name"
              label="Nama Lengkap"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Administrator BMU"
            />

            <Input
              id="prof-pwd"
              label="Ganti Kata Sandi (Kosongkan jika tidak diubah)"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
            />

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <Button type="submit" variant="primary" loading={loading} icon={<Save className="w-4 h-4" />}>
                Simpan Profil
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}
