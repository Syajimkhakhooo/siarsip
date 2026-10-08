import { useState } from 'react'
import { createCompany, updateCompany } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { Modal, Button, Input, SearchableSelect, Textarea } from '../ui'

export default function AddCompanyModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const { user } = useAuth()
  const isEdit = !!initialData

  const [form, setForm] = useState(initialData || {
    name: '',
    country: 'Jepang',
    city: '',
    address: '',
    pic: '',
    contact: '',
    email: '',
    industry: '',
    notes: '',
    status: 'aktif',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Nama perusahaan wajib diisi')
      return
    }

    setSaving(true)
    setError('')

    try {
      if (isEdit) {
        const { error: err } = await updateCompany(initialData.id, form)
        if (err) throw err
      } else {
        const { error: err } = await createCompany(form, user?.id)
        if (err) throw err
      }
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err.message || 'Gagal menyimpan data perusahaan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Perusahaan' : 'Tambah Perusahaan Baru'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            {isEdit ? 'Simpan Perubahan' : 'Tambah Perusahaan'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="company-name"
            label="Nama Perusahaan *"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Contoh: Tanaka Seisakusho Co., Ltd."
            required
            className="md:col-span-2"
          />

          <Input
            id="company-country"
            label="Negara"
            name="country"
            value={form.country}
            onChange={handleChange}
            placeholder="Jepang"
          />

          <Input
            id="company-city"
            label="Kota / Prefektur"
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="Tokyo, Osaka, dsb."
          />

          <Input
            id="company-industry"
            label="Bidang Industri"
            name="industry"
            value={form.industry}
            onChange={handleChange}
            placeholder="Manufaktur, Pengelasan, Kaigo..."
          />

          <SearchableSelect
            label="Status"
            value={form.status}
            onChange={v => setForm(prev => ({ ...prev, status: v }))}
            placeholder="Pilih status"
            options={[
              { value: 'aktif', label: 'Aktif' },
              { value: 'tidak aktif', label: 'Tidak Aktif' },
            ]}
          />

          <Input
            id="company-pic"
            label="Person in Charge (PIC)"
            name="pic"
            value={form.pic}
            onChange={handleChange}
            placeholder="Nama PIC atau Kontak BMU"
          />

          <Input
            id="company-contact"
            label="Nomor Telepon / Kontak"
            name="contact"
            value={form.contact}
            onChange={handleChange}
            placeholder="+81..."
          />

          <Input
            id="company-email"
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="contact@company.jp"
            className="md:col-span-2"
          />

          <Textarea
            id="company-address"
            label="Alamat Lengkap"
            name="address"
            value={form.address}
            onChange={handleChange}
            rows={2}
            placeholder="Alamat kantor perusahaan di Jepang / Indonesia"
            className="md:col-span-2"
          />

          <Textarea
            id="company-notes"
            label="Catatan Tambahan"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={2}
            placeholder="Persyaratan khusus, riwayat kerja sama, dsb."
            className="md:col-span-2"
          />
        </div>
      </form>
    </Modal>
  )
}
