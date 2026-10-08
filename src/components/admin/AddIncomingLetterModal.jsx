import { useState, useRef } from 'react'
import { Upload, X, FileText } from 'lucide-react'
import { createIncomingLetter, uploadFile } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { Modal, Button, Input, SearchableSelect, Textarea, DatePicker } from '../ui'

export default function AddIncomingLetterModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    letter_number: '',
    letter_date: new Date().toISOString().split('T')[0],
    sender: '',
    subject: '',
    category: 'Undangan & Pemberitahuan',
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
    if (!form.letter_number.trim() || !form.sender.trim() || !form.subject.trim()) {
      setError('Nomor surat, pengirim, dan perihal wajib diisi')
      return
    }

    setSaving(true)
    setError('')

    try {
      let filePath = null
      let fileName = null

      if (file) {
        const ext = file.name.split('.').pop()
        const storagePath = `letters/incoming/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`
        const { error: uploadErr } = await uploadFile(file, storagePath)
        if (uploadErr) throw uploadErr
        filePath = storagePath
        fileName = file.name
      }

      const { error: insertErr } = await createIncomingLetter({
        ...form,
        file_path: filePath,
        file_name: fileName,
      }, user?.id)

      if (insertErr) throw insertErr

      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err.message || 'Gagal menyimpan surat masuk')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Catat Surat Masuk Baru"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            Simpan Surat Masuk
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
            id="in-number"
            label="Nomor Surat Masuk *"
            name="letter_number"
            value={form.letter_number}
            onChange={handleChange}
            placeholder="Contoh: 045/DISNAKER/III/2026"
            required
          />

          <DatePicker
            label="Tanggal Surat *"
            value={form.letter_date}
            onChange={v => setForm(prev => ({ ...prev, letter_date: v }))}
          />

          <Input
            id="in-sender"
            label="Pengirim / Asal Surat *"
            name="sender"
            value={form.sender}
            onChange={handleChange}
            placeholder="Disnaker, Kemnaker, BP2MI, Mitra..."
            required
          />

          <SearchableSelect
            label="Kategori Surat"
            value={form.category}
            onChange={v => setForm(prev => ({ ...prev, category: v }))}
            placeholder="Pilih kategori"
            options={[
              { value: 'Dinas / Pemerintahan', label: 'Dinas / Pemerintahan' },
              { value: 'Undangan & Pemberitahuan', label: 'Undangan & Pemberitahuan' },
              { value: 'Kerja Sama / MoU', label: 'Kerja Sama / MoU' },
              { value: 'Keuangan & Tagihan', label: 'Keuangan & Tagihan' },
              { value: 'Lainnya', label: 'Lainnya' },
            ]}
          />

          <Input
            id="in-subject"
            label="Perihal / Judul Surat *"
            name="subject"
            value={form.subject}
            onChange={handleChange}
            placeholder="Pemberitahuan Verifikasi Peserta Magang Batch 12"
            required
            className="md:col-span-2"
          />

          <Textarea
            id="in-notes"
            label="Ringkasan / Catatan Disposisi"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={2}
            placeholder="Instruksi tindak lanjut atau catatan pengarsipan fisik..."
            className="md:col-span-2"
          />
        </div>

        {/* File attachment */}
        <div>
          <label className="text-xs font-medium text-gray-700 block mb-1.5">
            Lampiran Scan Surat (Opsional)
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
              <p className="text-xs font-medium text-gray-700">Pilih berkas PDF atau gambar scan</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Maksimal ukuran berkas 25 MB</p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
            </div>
          )}
        </div>
      </form>
    </Modal>
  )
}
