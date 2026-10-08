import { useState } from 'react'
import { createParticipant, getCompanies, getJobOrders } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { Modal, Button, Input, SearchableSelect, Textarea, DatePicker } from '../ui'

const STATUSES = [
  'pendaftar', 'aktif', 'pelatihan', 'lolos',
  'persiapan_keberangkatan', 'berangkat', 'selesai', 'alumni'
]
const STATUS_LABELS = {
  pendaftar: 'Pendaftar', aktif: 'Aktif', pelatihan: 'Pelatihan', lolos: 'Lolos',
  persiapan_keberangkatan: 'Persiapan Keberangkatan', berangkat: 'Berangkat',
  selesai: 'Selesai', alumni: 'Alumni',
}

export default function AddParticipantModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    full_name: '', nik: '', passport_number: '', birth_date: '',
    gender: '', address: '', phone: '', program: '', class: '',
    sensei: '', status: 'pendaftar', notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  function setField(key, value) {
    setForm(p => ({ ...p, [key]: value }))
    setErrors(p => ({ ...p, [key]: undefined }))
  }

  function validate() {
    const e = {}
    if (!form.full_name.trim()) e.full_name = 'Nama lengkap wajib diisi'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    const { data, error } = await createParticipant({
      ...form,
      gender: form.gender || null,
      birth_date: form.birth_date || null,
    }, user.id)

    if (error) {
      if (error.code === '23505') setErrors({ nik: 'NIK sudah digunakan' })
    } else {
      onSuccess?.()
    }
    setSaving(false)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Peserta"
      size="2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Batal</Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>Simpan</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="p-fullname"
            label="Nama Lengkap *"
            value={form.full_name}
            onChange={e => setField('full_name', e.target.value)}
            error={errors.full_name}
            placeholder="Nama lengkap sesuai KTP"
            className="sm:col-span-2"
          />
          <Input
            id="p-nik"
            label="NIK"
            value={form.nik}
            onChange={e => setField('nik', e.target.value)}
            error={errors.nik}
            placeholder="16 digit NIK"
            maxLength={16}
          />
          <Input
            id="p-passport"
            label="Nomor Paspor"
            value={form.passport_number}
            onChange={e => setField('passport_number', e.target.value)}
            placeholder="Nomor paspor"
          />
          <DatePicker
            label="Tanggal Lahir"
            value={form.birth_date}
            onChange={v => setField('birth_date', v)}
          />
          <SearchableSelect
            label="Jenis Kelamin"
            value={form.gender}
            onChange={v => setField('gender', v)}
            placeholder="Pilih jenis kelamin"
            options={[
              { value: 'L', label: 'Laki-laki' },
              { value: 'P', label: 'Perempuan' },
            ]}
          />
          <Input
            id="p-phone"
            label="Nomor Telepon"
            value={form.phone}
            onChange={e => setField('phone', e.target.value)}
            placeholder="08xx"
          />
          <Input
            id="p-program"
            label="Program"
            value={form.program}
            onChange={e => setField('program', e.target.value)}
            placeholder="Mis: Tokutei Ginou"
          />
          <Input
            id="p-class"
            label="Kelas"
            value={form.class}
            onChange={e => setField('class', e.target.value)}
            placeholder="Kelas"
          />
          <Input
            id="p-sensei"
            label="Sensei"
            value={form.sensei}
            onChange={e => setField('sensei', e.target.value)}
            placeholder="Nama pengajar"
          />
          <SearchableSelect
            label="Status"
            value={form.status}
            onChange={v => setField('status', v)}
            placeholder="Pilih status"
            options={STATUSES.map(s => ({ value: s, label: STATUS_LABELS[s] }))}
          />
          <Textarea
            id="p-address"
            label="Alamat"
            value={form.address}
            onChange={e => setField('address', e.target.value)}
            className="sm:col-span-2"
            rows={2}
            placeholder="Alamat lengkap"
          />
          <Textarea
            id="p-notes"
            label="Catatan"
            value={form.notes}
            onChange={e => setField('notes', e.target.value)}
            className="sm:col-span-2"
            rows={2}
          />
        </div>
      </form>
    </Modal>
  )
}
