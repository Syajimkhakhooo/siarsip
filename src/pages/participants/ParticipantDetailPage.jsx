import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, FileText, CheckCircle, XCircle, AlertCircle,
  Plus, Edit2, Clock, User, Trash2, Save
} from 'lucide-react'
import { getParticipantById, getParticipantRequirements, setParticipantRequirements, updateParticipant } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import {
  Button, Card, Badge, Tabs, Avatar, ProgressBar,
  Skeleton, PageHeader, Input
} from '../../components/ui'
import { formatDate, PARTICIPANT_STATUS_LABELS } from '../../utils/helpers'
import EditParticipantModal from '../../components/participants/EditParticipantModal'
import UploadDocumentModal from '../../components/documents/UploadDocumentModal'

const PTABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'dokumen', label: 'Dokumen' },
  { id: 'checklist', label: 'Checklist' },
  { id: 'timeline', label: 'Timeline' },
]

const STATUS_BADGE = {
  pendaftar: 'default',
  aktif: 'success',
  pelatihan: 'info',
  lolos: 'success',
  persiapan_keberangkatan: 'warning',
  berangkat: 'info',
  selesai: 'default',
  alumni: 'default',
}

export default function ParticipantDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const toast = useToast()

  const [participant, setParticipant] = useState(null)
  const [requirements, setRequirements] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showEdit, setShowEdit] = useState(params.get('edit') === 'true')
  const [showUpload, setShowUpload] = useState(false)
  const [newCheckItem, setNewCheckItem] = useState('')
  const [savingChecklist, setSavingChecklist] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    setLoading(true)
    const [pRes, rRes] = await Promise.all([
      getParticipantById(id),
      getParticipantRequirements(id),
    ])
    if (pRes.data) setParticipant(pRes.data)
    else { toast.error('Peserta tidak ditemukan'); navigate('/peserta') }
    setRequirements(rRes.data || [])
    setLoading(false)
  }

  async function addChecklistItem() {
    const name = newCheckItem.trim()
    if (!name) return
    const updated = [...requirements, { document_name: name, document_id: null, is_completed: false, participant_id: id }]
    setSavingChecklist(true)
    const { error } = await setParticipantRequirements(id, updated.map(r => ({ document_name: r.document_name, document_id: r.document_id || null, is_completed: !!(r.document_id || r.is_completed) })))
    if (error) { toast.error('Gagal menambahkan item'); setSavingChecklist(false); return }
    setNewCheckItem('')
    setRequirements(updated)
    setSavingChecklist(false)
  }

  async function removeChecklistItem(idx) {
    const updated = requirements.filter((_, i) => i !== idx)
    setRequirements(updated)
    setSavingChecklist(true)
    await setParticipantRequirements(id, updated.map(r => ({ document_name: r.document_name, document_id: r.document_id || null, is_completed: !!(r.document_id || r.is_completed) })))
    setSavingChecklist(false)
  }

  async function toggleChecklistItem(idx) {
    const updated = requirements.map((r, i) => {
      if (i !== idx) return r
      return { ...r, is_completed: !r.is_completed }
    })
    setRequirements(updated)
    setSavingChecklist(true)
    await setParticipantRequirements(id, updated.map(r => ({ document_name: r.document_name, document_id: r.document_id || null, is_completed: !!(r.document_id || r.is_completed) })))
    setSavingChecklist(false)
  }

  async function applyDefaultChecklist() {
    const defaults = [
      'KTP (Kartu Tanda Penduduk)',
      'KK (Kartu Keluarga)',
      'Akta Kelahiran',
      'Ijazah Terakhir',
      'Paspor',
      'Surat Izin Orang Tua / Pasangan',
      'Medical Check Up (MCU)',
      'Sertifikat Pelatihan',
    ]
    const currentNames = new Set(requirements.map(r => r.document_name.toLowerCase()))
    const newItems = defaults
      .filter(d => !currentNames.has(d.toLowerCase()))
      .map(d => ({ document_name: d, document_id: null, is_completed: false }))

    if (newItems.length === 0) {
      toast.info('Semua dokumen standar sudah ada dalam checklist')
      return
    }

    const updated = [...requirements, ...newItems]
    setRequirements(updated)
    setSavingChecklist(true)
    await setParticipantRequirements(id, updated.map(r => ({ document_name: r.document_name, document_id: r.document_id || null, is_completed: !!(r.document_id || r.is_completed) })))
    toast.success('Template checklist berhasil dimuat')
    setSavingChecklist(false)
  }

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!participant) return null

  const docs = participant.documents || []
  const completedReqs = requirements.filter(r => r.document_id || r.is_completed).length
  const totalReqs = requirements.length
  const completionPct = totalReqs > 0 ? Math.round((completedReqs / totalReqs) * 100) : 0

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/peserta')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowUpload(true)}>
            Upload Dokumen
          </Button>
          <Button variant="secondary" size="sm" icon={<Edit2 className="w-3.5 h-3.5" />} onClick={() => setShowEdit(true)}>
            Edit
          </Button>
        </div>
      </div>

      {/* Profile header */}
      <Card>
        <div className="flex items-start gap-4">
          <Avatar name={participant.full_name} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{participant.full_name}</h1>
                <p className="text-sm text-gray-500">{participant.program || 'Belum ada program'} · {participant.class || ''}</p>
              </div>
              <Badge variant={STATUS_BADGE[participant.status] || 'default'} size="md">
                {PARTICIPANT_STATUS_LABELS[participant.status] || participant.status}
              </Badge>
            </div>

            {totalReqs > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500">Kelengkapan Dokumen</p>
                  <p className="text-xs font-medium text-gray-900">{completedReqs}/{totalReqs} · {completionPct}%</p>
                </div>
                <ProgressBar value={completedReqs} max={totalReqs} />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs
        tabs={[
          ...PTABS,
          { id: 'dokumen', label: 'Dokumen', count: docs.length },
        ].filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i)}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <Card className="animate-fade-in">
              <p className="text-sm font-medium text-gray-900 mb-4">Informasi Peserta</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'NIK', value: participant.nik },
                  { label: 'Nomor Paspor', value: participant.passport_number },
                  { label: 'Tanggal Lahir', value: formatDate(participant.birth_date) },
                  { label: 'Jenis Kelamin', value: participant.gender === 'L' ? 'Laki-laki' : participant.gender === 'P' ? 'Perempuan' : '—' },
                  { label: 'Nomor Telepon', value: participant.phone },
                  { label: 'Sensei', value: participant.sensei },
                  { label: 'Perusahaan Tujuan', value: participant.company?.name },
                  { label: 'Job Order', value: participant.job_order?.jo_number },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                    <p className="text-sm text-gray-900">{item.value || '—'}</p>
                  </div>
                ))}
                {participant.address && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-500 mb-0.5">Alamat</p>
                    <p className="text-sm text-gray-900">{participant.address}</p>
                  </div>
                )}
                {participant.notes && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-500 mb-0.5">Catatan</p>
                    <p className="text-sm text-gray-900">{participant.notes}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* DOKUMEN */}
          {activeTab === 'dokumen' && (
            <Card padding={false} className="animate-fade-in">
              {docs.length === 0 ? (
                <div className="py-12 text-center">
                  <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-3">Belum ada dokumen</p>
                  <Button size="sm" onClick={() => setShowUpload(true)}>Upload Dokumen</Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {docs.map(doc => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/arsip/${doc.id}`)}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                        <p className="text-xs text-gray-400">{doc.category?.name} · {doc.document_number || doc.archive_code || '—'}</p>
                      </div>
                      <Badge variant={doc.status === 'aktif' ? 'success' : 'default'}>{doc.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* CHECKLIST */}
          {activeTab === 'checklist' && (
            <Card className="animate-fade-in">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Kelengkapan Dokumen</p>
                  <p className="text-xs text-gray-500">Klik checklist untuk menandai dokumen selesai/belum</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={applyDefaultChecklist}
                    loading={savingChecklist}
                    className="text-xs text-gray-600 hover:text-gray-900"
                  >
                    + Template Standar
                  </Button>
                  <Badge variant={completionPct === 100 ? 'success' : completionPct >= 50 ? 'warning' : 'danger'}>
                    {completedReqs}/{totalReqs} ({completionPct}%)
                  </Badge>
                </div>
              </div>

              {/* Progress bar */}
              {totalReqs > 0 && <ProgressBar value={completedReqs} max={totalReqs} className="mb-4" />}

              {/* Checklist items */}
              {requirements.length === 0 ? (
                <div className="text-center py-8 px-4 border border-dashed border-gray-200 rounded-xl bg-gray-50/50 mb-4">
                  <p className="text-sm text-gray-600 font-medium mb-1">Checklist Dokumen Masih Kosong</p>
                  <p className="text-xs text-gray-400 mb-4">Mulai dengan menambahkan item dokumen atau gunakan template standar BMU.</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={applyDefaultChecklist}
                    loading={savingChecklist}
                  >
                    Gunakan Template Dokumen Standar
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  {requirements.map((req, idx) => {
                    const isDone = !!req.document_id || req.is_completed
                    const doc = req.document
                    const isExpiring = doc?.valid_until && (() => {
                      const days = Math.floor((new Date(doc.valid_until) - new Date()) / 86400000)
                      return days >= 0 && days <= 90
                    })()

                    return (
                      <div
                        key={req.id || idx}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                          isDone ? 'border-gray-100 bg-white shadow-xs' : 'border-dashed border-gray-200 bg-gray-50/60'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleChecklistItem(idx)}
                          className="flex-shrink-0 cursor-pointer focus:outline-none"
                          title={isDone ? 'Klik untuk tandai belum selesai' : 'Klik untuk tandai selesai'}
                        >
                          {isDone ? (
                            isExpiring ? (
                              <AlertCircle className="w-5 h-5 text-amber-500" />
                            ) : (
                              <CheckCircle className="w-5 h-5 text-emerald-600" />
                            )
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300 hover:border-gray-500 transition-colors" />
                          )}
                        </button>
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => toggleChecklistItem(idx)}
                        >
                          <p className={`text-sm font-medium ${isDone ? 'text-gray-900' : 'text-gray-600'}`}>
                            {req.document_name}
                          </p>
                          {doc ? (
                            <p className="text-xs text-gray-400">
                              {isExpiring ? '⚠ Perlu diperbarui' : 'File tersimpan'}
                              {doc.valid_until && ` · Berlaku s/d ${formatDate(doc.valid_until)}`}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400">
                              {isDone ? 'Sudah diverifikasi / lengkap' : 'Belum ada dokumen'}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {req.document_id && (
                            <button
                              onClick={() => navigate(`/arsip/${req.document_id}`)}
                              className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                            >
                              Lihat
                            </button>
                          )}
                          {!req.document_id && (
                            <button
                              onClick={() => setShowUpload(true)}
                              className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                            >
                              Upload
                            </button>
                          )}
                          <button
                            onClick={() => removeChecklistItem(idx)}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Hapus item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Add new item */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Tambah Item Checklist</p>
                <div className="flex gap-2">
                  <Input
                    value={newCheckItem}
                    onChange={e => setNewCheckItem(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addChecklistItem()}
                    placeholder="Nama dokumen (mis: Paspor, KTP, Kontrak...)"
                    className="flex-1"
                  />
                  <Button
                    variant="primary"
                    size="md"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={addChecklistItem}
                    loading={savingChecklist}
                    disabled={!newCheckItem.trim()}
                  >
                    Tambah
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* TIMELINE */}
          {activeTab === 'timeline' && (
            <Card className="animate-fade-in">
              <p className="text-sm font-medium text-gray-900 mb-4">Timeline Status</p>
              <div className="space-y-4">
                {Object.entries(PARTICIPANT_STATUS_LABELS).map(([key, label], i) => {
                  const statuses = Object.keys(PARTICIPANT_STATUS_LABELS)
                  const currentIdx = statuses.indexOf(participant.status)
                  const itemIdx = statuses.indexOf(key)
                  const isPast = itemIdx < currentIdx
                  const isCurrent = key === participant.status
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isCurrent ? 'bg-gray-900' : isPast ? 'bg-gray-300' : 'bg-gray-100 border border-gray-200'}`} />
                      <p className={`text-sm ${isCurrent ? 'font-semibold text-gray-900' : isPast ? 'text-gray-500' : 'text-gray-300'}`}>
                        {label}
                      </p>
                      {isCurrent && <Badge variant="dark">Saat ini</Badge>}
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Quick info sidebar */}
        <div className="space-y-4">
          <Card>
            <p className="text-xs font-medium text-gray-500 mb-3">Ringkasan</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Total Dokumen</p>
                <p className="text-sm font-medium text-gray-900">{docs.length}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Kelengkapan</p>
                <p className="text-sm font-medium text-gray-900">{completionPct}%</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Status</p>
                <Badge variant={STATUS_BADGE[participant.status] || 'default'}>
                  {PARTICIPANT_STATUS_LABELS[participant.status]}
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {showEdit && (
        <EditParticipantModal
          isOpen={showEdit}
          participant={participant}
          onClose={() => setShowEdit(false)}
          onSuccess={() => { setShowEdit(false); loadData(); toast.success('Data peserta diperbarui') }}
        />
      )}

      {showUpload && (
        <UploadDocumentModal
          isOpen={showUpload}
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); loadData(); toast.success('Dokumen berhasil diupload') }}
          defaultParticipantId={id}
          defaultParticipantName={participant.full_name}
        />
      )}
    </div>
  )
}
