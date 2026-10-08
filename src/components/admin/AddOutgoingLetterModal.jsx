import { useState, useRef } from 'react'
import { Upload, X, FileText } from 'lucide-react'
import { createOutgoingLetter, uploadFile } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { Modal, Button, Input, SearchableSelect, Textarea, DatePicker } from '../ui'

export default function AddOutgoingLetterModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    letter_date: new Date().toISOString().split('T')[0],
    recipient: '',
    subject: '',
    category: 'Surat Pengantar & Rekomendasi',
    notes: '',
  })
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handleFileChange(e) {
    const f = e.target.files?.[0]
    if (f) {
      if (f.size > 25 * 1024 * 1024) {
        setError('Ukuran file maksimal 25 MB')
        return
      }
      setFile(f)
      setError('')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.recipient.trim() || !form.subject.trim()) {
      setError('Tujuan surat dan perihal wajib diisi')
      return
    }

    setSaving(true)
    setError('')

    try {
      let filePath = null
      let fileName = null

      if (file) {
        const ext = file.name.split('.').pop()
        const storagePath = `letters/outgoing/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`
        const { error: uploadErr } = await uploadFile(file, storagePath)
        if (uploadErr) throw uploadErr
        filePath = storagePath
        fileName = file.name
      }

      const { error: insertErr } = await createOutgoingLetter({
        ...form,
        file_path: filePath,
        file_name: fileName,
      }, user?.id)

      if (insertErr) throw insertErr

      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err.message || 'Gagal menyimpan surat keluar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Buat Surat Keluar Baru"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            Generate & Simpan Surat
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

        <div className="p-3 bg-gray-50 border border-gray-200 text-gray-600 text-xs rounded-lg">
          Nomor surat keluar akan digenerate otomatis oleh sistem sesuai format resmi: <strong className="text-gray-900">BMU/SKL/{new Date().getFullYear()}/XXX</strong>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DatePicker
            label="Tanggal Surat *"
            value={form.letter_date}
            onChange={v => setForm(prev => ({ ...prev, letter_date: v }))}
          />

          <SearchableSelect
            label="Kategori Surat"
            value={form.category}
            onChange={v => setForm(prev => ({ ...prev, category: v }))}
            placeholder="Pilih kategori"
            options={[
              { value: 'Surat Pengantar & Rekomendasi', label: 'Surat Pengantar & Rekomendasi' },
              { value: 'Surat Keterangan', label: 'Surat Keterangan' },
              { value: 'Surat Balasan / Jawaban', label: 'Surat Balasan / Jawaban' },
              { value: 'Surat Permohonan', label: 'Surat Permohonan' },
              { value: 'Kerja Sama Lembaga', label: 'Kerja Sama Lembaga' },
              { value: 'Lainnya', label: 'Lainnya' },
            ]}
          />

          <Input
            id="out-recipient"
            label="Tujuan / Penerima Surat *"
            name="recipient"
            value={form.recipient}
            onChange={handleChange}
            placeholder="Disnaker Provinsi, Kedutaan Besar Jepang, LPK Rekanan..."
            required
            className="md:col-span-2"
          />

          <Input
            id="out-subject"
            label="Perihal Surat *"
            name="subject"
            value={form.subject}
            onChange={handleChange}
            placeholder="Rekomendasi Magang Kejuruan Pengelasan Batch 15"
            required
            className="md:col-span-2"
          />

          <Textarea
            id="out-notes"
            label="Keterangan Tambahan / Isi Ringkas"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={2}
            placeholder="Tembusan atau catatan penyimpanan arsip..."
            className="md:col-span-2"
          />
        </div>

        {/* File attachment */}
        <div>
          <label className="text-xs font-medium text-gray-700 block mb-1.5">
            Arsip File / Dokumen PDF (Opsional)
          </label>
          {file ? (
            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-800 truncate">
                <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="truncate">{file.name}</span>
                <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(0)} KB)</span>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50/50 transition-colors"
            >
              <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
              <p className="text-xs font-medium text-gray-700">Lampirkan file final (PDF / Scan)</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Maksimal ukuran berkas 25 MB</p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileChange}
              />
            </div>
          )}
        </div>
      </form>
    </Modal>
  )
}
