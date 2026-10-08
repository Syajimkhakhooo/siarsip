import { useState, useRef, useEffect } from 'react'
import { Upload, X, FileText } from 'lucide-react'
import { createDocument, getCategories, uploadFile } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { Modal, Button, Input, Textarea, SearchableSelect, DatePicker } from '../ui'
import { formatFileSize } from '../../utils/helpers'
import { supabase } from '../../lib/supabase'

export default function UploadDocumentModal({
  isOpen, onClose, onSuccess,
  categories = [],
  defaultParticipantId,
  defaultParticipantName,
}) {
  const { user } = useAuth()
  const toast = useToast()
  const fileRef = useRef(null)

  const [form, setForm] = useState({
    name: '',
    category_id: '',
    document_type: '',
    participant_id: defaultParticipantId || '',
    company_id: '',
    job_order_id: '',
    document_date: '',
    valid_from: '',
    valid_until: '',
    status: 'aktif',
    security_level: 'internal',
    notes: '',
  })
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState({})
  const [loadedCategories, setLoadedCategories] = useState(categories || [])

  useEffect(() => {
    if (categories && categories.length > 0) {
      setLoadedCategories(categories)
    } else if (isOpen) {
      getCategories().then(({ data }) => {
        if (data) setLoadedCategories(data)
      })
    }
  }, [isOpen, categories])

  useEffect(() => {
    if (isOpen && defaultParticipantId) {
      setForm(p => ({ ...p, participant_id: defaultParticipantId }))
    }
  }, [isOpen, defaultParticipantId])

  const activeCategories = (categories && categories.length > 0) ? categories : loadedCategories
  const selectedCategory = activeCategories.find(c => c.id === form.category_id)

  function setField(key, value) {
    setForm(p => ({ ...p, [key]: value }))
    setErrors(p => ({ ...p, [key]: undefined }))
  }

  function handleFileDrop(e) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer?.files?.[0] || e.target.files?.[0]
    if (f) {
      setFile(f)
      if (!form.name) setField('name', f.name.replace(/\.[^.]+$/, ''))
    }
  }

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Nama dokumen wajib diisi'
    if (!form.category_id) e.category_id = 'Kategori wajib dipilih'
    if (!file) e.file = 'File wajib dipilih'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    setUploading(true)
    try {
      // Determine storage path
      const prefix = form.participant_id ? 'participants' : form.company_id ? 'companies' : 'organization'
      const ext = file.name.split('.').pop()
      const timestamp = Date.now()
      const filePath = `${prefix}/${timestamp}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

      // Upload file
      const { error: uploadError } = await uploadFile(file, filePath)
      if (uploadError) {
        toast.error('Gagal upload file: ' + uploadError.message)
        setUploading(false)
        return
      }

      // Create document record
      const { data: doc, error: docError } = await createDocument({
        ...form,
        category_code: selectedCategory?.code,
        participant_id: form.participant_id || null,
        company_id: form.company_id || null,
        job_order_id: form.job_order_id || null,
      }, user?.id)

      if (docError) {
        toast.error('Gagal menyimpan dokumen: ' + (docError.message || JSON.stringify(docError)))
        setUploading(false)
        return
      }

      // Create version record
      if (doc?.id) {
        const { data: ver } = await supabase.from('document_versions').insert({
          document_id: doc.id,
          version_number: 1,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          created_by: user?.id,
        }).select().single()

        if (ver?.id) {
          await supabase.from('documents').update({ current_version_id: ver.id }).eq('id', doc.id)
        }
      }

      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Upload error:', err)
      toast.error('Terjadi kesalahan: ' + (err.message || ''))
    } finally {
      setUploading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Dokumen"
      size="2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={uploading}>Batal</Button>
          <Button variant="primary" onClick={handleSubmit} loading={uploading}>
            Upload Dokumen
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* File drop zone */}
        <div
          className={`
            relative border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer
            ${dragging ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}
            ${errors.file ? 'border-red-300' : ''}
          `}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleFileDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            className="sr-only"
            onChange={handleFileDrop}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp"
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="w-8 h-8 text-gray-400" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setFile(null) }}
                className="ml-2 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
                aria-label="Hapus file"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Drag & drop atau klik untuk memilih file</p>
              <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, Gambar</p>
            </>
          )}
        </div>
        {errors.file && <p className="text-xs text-red-600 -mt-2">{errors.file}</p>}

        {/* Form fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="doc-name"
            label="Nama Dokumen *"
            value={form.name}
            onChange={e => setField('name', e.target.value)}
            error={errors.name}
            placeholder="Nama dokumen"
            className="sm:col-span-2"
          />

          <SearchableSelect
            label="Kategori *"
            value={form.category_id}
            onChange={val => setField('category_id', val)}
            error={errors.category_id}
            placeholder="Pilih kategori dokumen..."
            searchPlaceholder="Cari kategori..."
            options={activeCategories.map(c => ({
              value: c.id,
              label: `${c.name} (${c.code || ''})`,
              name: c.name,
              code: c.code,
              type: c.type,
            }))}
          />

          <Input
            id="doc-type"
            label="Jenis Dokumen"
            value={form.document_type}
            onChange={e => setField('document_type', e.target.value)}
            placeholder="Mis: Kontrak, SK, Sertifikat"
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

          {defaultParticipantName ? (
            <div className="sm:col-span-2">
              <p className="text-xs font-medium text-gray-700 mb-1.5">Peserta Terkait</p>
              <div className="h-9 px-3 rounded-lg border border-gray-200 bg-gray-50 flex items-center text-sm text-gray-700">
                {defaultParticipantName}
              </div>
            </div>
          ) : null}

          <Textarea
            id="doc-notes"
            label="Catatan"
            value={form.notes}
            onChange={e => setField('notes', e.target.value)}
            placeholder="Catatan tambahan..."
            className="sm:col-span-2"
            rows={2}
          />
        </div>
      </form>
    </Modal>
  )
}
