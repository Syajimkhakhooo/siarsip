import { useState, useEffect } from 'react'
import { createJobOrder, updateJobOrder, getCompanies } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { Modal, Button, Input, SearchableSelect, Textarea, DatePicker } from '../ui'

export default function AddJobOrderModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const { user } = useAuth()
  const isEdit = !!initialData

  const [companies, setCompanies] = useState([])
  const [form, setForm] = useState(initialData || {
    company_id: '',
    title: '',
    position: '',
    industry: '',
    location: 'Jepang',
    quota: 1,
    deadline: '',
    status: 'draft',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      getCompanies().then(({ data }) => setCompanies(data || []))
    }
  }, [isOpen])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('Judul Job Order wajib diisi')
      return
    }

    setSaving(true)
    setError('')

    try {
      const payload = {
        ...form,
        company_id: form.company_id || null,
        quota: parseInt(form.quota, 10) || 0,
        deadline: form.deadline || null,
      }

      if (isEdit) {
        const { error: err } = await updateJobOrder(initialData.id, payload)
        if (err) throw err
      } else {
        const { error: err } = await createJobOrder(payload, user?.id)
        if (err) throw err
      }
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err.message || 'Gagal menyimpan data Job Order')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Job Order' : 'Tambah Job Order Baru'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            {isEdit ? 'Simpan Perubahan' : 'Buat Job Order'}
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
            id="jo-title"
            label="Judul Job Order *"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Contoh: Rekrutmen Welder 2026 Batch 1"
            required
            className="md:col-span-2"
          />

          <SearchableSelect
            label="Perusahaan Rekanan"
            value={form.company_id}
            onChange={v => setForm(prev => ({ ...prev, company_id: v }))}
            placeholder="-- Pilih Perusahaan --"
            options={companies.map(c => ({ value: c.id, label: `${c.name} (${c.country || 'Jepang'})` }))}
          />

          <Input
            id="jo-position"
            label="Posisi / Jabatan"
            name="position"
            value={form.position}
            onChange={handleChange}
            placeholder="Pengelasan, Konstruksi, Caregiver..."
          />

          <Input
            id="jo-industry"
            label="Bidang Industri"
            name="industry"
            value={form.industry}
            onChange={handleChange}
            placeholder="Manufaktur, Pertanian, Layanan Medis"
          />

          <Input
            id="jo-location"
            label="Lokasi Penempatan"
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="Aichi, Gunma, Tokyo"
          />

          <Input
            id="jo-quota"
            label="Kuota Peserta"
            name="quota"
            type="number"
            min="1"
            value={form.quota}
            onChange={handleChange}
          />

          <DatePicker
            label="Batas Pendaftaran / Deadline"
            value={form.deadline || ''}
            onChange={v => setForm(prev => ({ ...prev, deadline: v }))}
          />

          <SearchableSelect
            label="Status"
            value={form.status}
            onChange={v => setForm(prev => ({ ...prev, status: v }))}
            placeholder="Pilih status"
            className="md:col-span-2"
            options={[
              { value: 'draft', label: 'Draft' },
              { value: 'aktif', label: 'Aktif' },
              { value: 'recruitment', label: 'Sedang Recruitment' },
              { value: 'selesai', label: 'Selesai' },
              { value: 'dibatalkan', label: 'Dibatalkan' },
            ]}
          />

          <Textarea
            id="jo-notes"
            label="Persyaratan & Catatan"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Kriteria usia, level bahasa JLPT/JFT, syarat fisik, dsb."
            className="md:col-span-2"
          />
        </div>
      </form>
    </Modal>
  )
}
