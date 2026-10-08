import { useState, useEffect } from 'react'
import { updateDocument, getCategories } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { Modal, Button, Input, Textarea, SearchableSelect, DatePicker } from '../ui'

export default function EditDocumentModal({ isOpen, document: doc, onClose, onSuccess }) {
  const { user } = useAuth()
  const toast = useToast()
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (doc) {
      setForm({
        name: doc.name || '',
        category_id: doc.category_id || '',
        document_type: doc.document_type || '',
        document_date: doc.document_date || '',
        valid_from: doc.valid_from || '',
        valid_until: doc.valid_until || '',
        status: doc.status || 'aktif',
        security_level: doc.security_level || 'internal',
        notes: doc.notes || '',
      })
    }
  }, [doc])

  useEffect(() => {
    if (isOpen) {
      getCategories().then(({ data }) => setCategories(data || []))
    }
  }, [isOpen])

  function setField(key, value) {
    setForm(p => ({ ...p, [key]: value }))
    setErrors(p => ({ ...p, [key]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name?.trim()) {
      setErrors({ name: 'Nama dokumen wajib diisi' })
      return
    }

    setSaving(true)
    try {
      const { error } = await updateDocument(doc.id, form, user?.id)
      if (error) {
        toast.error('Gagal memperbarui dokumen: ' + (error.message || JSON.stringify(error)))
        setSaving(false)
        return
      }
      toast.success('Dokumen berhasil diperbarui')
      onSuccess?.()
      onClose?.()
    } catch (err) {
      toast.error('Terjadi kesalahan: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Dokumen"
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
            id="edit-doc-name"
            label="Nama Dokumen *"
            value={form.name}
            onChange={e => setField('name', e.target.value)}
            error={errors.name}
            className="sm:col-span-2"
          />
          <SearchableSelect
            label="Kategori"
            value={form.category_id}
            onChange={val => setField('category_id', val)}
            placeholder="Pilih kategori..."
            searchPlaceholder="Cari kategori..."
            options={categories.map(c => ({
              value: c.id,
              label: `${c.name} (${c.code || ''})`,
              name: c.name,
              code: c.code,
              type: c.type,
            }))}
          />
          <Input
            id="edit-doc-type"
            label="Jenis Dokumen"
            value={form.document_type}
            onChange={e => setField('document_type', e.target.value)}
          />
          <DatePicker
            label="Tanggal Dokumen"
            value={form.document_date}
            onChange={v => setField('document_date', v)}
          />
          <SearchableSelect
            label="Status"
            value={form.status}
            onChange={v => setField('status', v)}
            placeholder="Pilih status"
            options={[
              { value: 'aktif', label: 'Aktif' },
              { value: 'draft', label: 'Draft' },
              { value: 'tidak_aktif', label: 'Tidak Aktif' },
              { value: 'kedaluwarsa', label: 'Kedaluwarsa' },
            ]}
          />
          <DatePicker
            label="Berlaku Mulai"
            value={form.valid_from}
            onChange={v => setField('valid_from', v)}
          />
          <DatePicker
            label="Berlaku Sampai"
            value={form.valid_until}
            onChange={v => setField('valid_until', v)}
          />
          <SearchableSelect
            label="Level Keamanan"
            value={form.security_level}
            onChange={v => setField('security_level', v)}
            placeholder="Pilih level keamanan"
            options={[
              { value: 'internal', label: 'Internal' },
              { value: 'confidential', label: 'Confidential' },
              { value: 'highly_confidential', label: 'Highly Confidential' },
            ]}
          />
          <Textarea
            id="edit-doc-notes"
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
