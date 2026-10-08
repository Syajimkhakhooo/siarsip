import { useState, useEffect } from 'react'
import { updateParticipant, getCompanies, getJobOrders } from '../../services/api'
import { Modal, Button, Input, SearchableSelect, Textarea, DatePicker } from '../ui'

const STATUSES = [
  'pendaftar', 'aktif', 'pelatihan', 'lolos',
  'persiapan_keberangkatan', 'berangkat', 'selesai', 'alumni'
]

const STATUS_LABELS = {
  pendaftar: 'Pendaftar',
  aktif: 'Aktif',
  pelatihan: 'Pelatihan',
  lolos: 'Lolos',
  persiapan_keberangkatan: 'Persiapan Keberangkatan',
  berangkat: 'Berangkat',
  selesai: 'Selesai',
  alumni: 'Alumni',
}

export default function EditParticipantModal({ isOpen, onClose, onSuccess, participant }) {
  const [form, setForm] = useState({
    full_name: participant?.full_name || '',
    nik: participant?.nik || '',
    passport_number: participant?.passport_number || '',
    birth_date: participant?.birth_date || '',
    gender: participant?.gender || '',
    address: participant?.address || '',
    phone: participant?.phone || '',
    program: participant?.program || '',
    class: participant?.class || '',
    sensei: participant?.sensei || '',
    status: participant?.status || 'aktif',
    target_company_id: participant?.target_company_id || '',
    job_order_id: participant?.job_order_id || '',
    notes: participant?.notes || '',
  })

  const [companies, setCompanies] = useState([])
  const [jobOrders, setJobOrders] = useState([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (participant) {
      setForm({
        full_name: participant.full_name || '',
        nik: participant.nik || '',
        passport_number: participant.passport_number || '',
        birth_date: participant.birth_date || '',
        gender: participant.gender || '',
        address: participant.address || '',
        phone: participant.phone || '',
        program: participant.program || '',
        class: participant.class || '',
        sensei: participant.sensei || '',
        status: participant.status || 'aktif',
        target_company_id: participant.target_company_id || '',
        job_order_id: participant.job_order_id || '',
        notes: participant.notes || '',
      })
    }
  }, [participant])

  useEffect(() => {
    if (isOpen) {
      getCompanies().then(({ data }) => setCompanies(data || []))
      getJobOrders().then(({ data }) => setJobOrders(data || []))
    }
  }, [isOpen])

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
    const { error } = await updateParticipant(participant.id, {
      ...form,
      gender: form.gender || null,
      birth_date: form.birth_date || null,
      target_company_id: form.target_company_id || null,
      job_order_id: form.job_order_id || null,
    })

    if (error) {
      if (error.code === '23505') setErrors({ nik: 'NIK sudah digunakan' })
      else setErrors({ full_name: error.message })
    } else {
      onSuccess?.()
    }
    setSaving(false)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Data Peserta"
      size="2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Batal</Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>Simpan Perubahan</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="edit-p-fullname"
            label="Nama Lengkap *"
            value={form.full_name}
            onChange={e => setField('full_name', e.target.value)}
            error={errors.full_name}
            placeholder="Nama lengkap sesuai KTP"
            className="sm:col-span-2"
          />

          <Input
            id="edit-p-nik"
            label="NIK"
            value={form.nik}
            onChange={e => setField('nik', e.target.value)}
            error={errors.nik}
            placeholder="16 digit NIK"
            maxLength={16}
          />

          <Input
            id="edit-p-passport"
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
            id="edit-p-phone"
            label="Nomor Telepon"
            value={form.phone}
            onChange={e => setField('phone', e.target.value)}
            placeholder="08xx"
          />

          <Input
            id="edit-p-program"
            label="Program"
            value={form.program}
            onChange={e => setField('program', e.target.value)}
            placeholder="Mis: Tokutei Ginou / Magang Teknis"
          />

          <Input
            id="edit-p-class"
            label="Kelas"
            value={form.class}
            onChange={e => setField('class', e.target.value)}
            placeholder="Kelas Batch 15"
          />

          <Input
            id="edit-p-sensei"
            label="Sensei"
            value={form.sensei}
            onChange={e => setField('sensei', e.target.value)}
            placeholder="Nama pengajar"
          />

          <SearchableSelect
            label="Status Peserta"
            value={form.status}
            onChange={v => setField('status', v)}
            placeholder="Pilih status"
            options={STATUSES.map(s => ({ value: s, label: STATUS_LABELS[s] }))}
          />

          <SearchableSelect
            label="Perusahaan Penempatan"
            value={form.target_company_id}
            onChange={v => setField('target_company_id', v)}
            placeholder="-- Belum ada penempatan --"
            options={companies.map(c => ({ value: c.id, label: c.name }))}
          />

          <SearchableSelect
            label="Job Order Terkait"
            value={form.job_order_id}
            onChange={v => setField('job_order_id', v)}
            placeholder="-- Tidak ada Job Order --"
            className="sm:col-span-2"
            options={jobOrders.map(jo => ({ value: jo.id, label: `${jo.jo_number} - ${jo.title}` }))}
          />

          <Textarea
            id="edit-p-address"
            label="Alamat Lengkap"
            value={form.address}
            onChange={e => setField('address', e.target.value)}
            className="sm:col-span-2"
            rows={2}
            placeholder="Alamat asal peserta"
          />

          <Textarea
            id="edit-p-notes"
            label="Catatan Tambahan"
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
