import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Download, Edit2, Star, Trash2, Eye, FileText,
  Calendar, Clock, User, Building2, Hash, Shield, Tag, ChevronRight
} from 'lucide-react'
import { getDocumentById, deleteDocument, toggleFavorite, downloadFile, getFileUrl, logActivity } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import {
  Button, Card, Badge, Tabs, Avatar, ExpiryBadge,
  Skeleton, ConfirmDialog, Divider
} from '../../components/ui'
import { formatDate, formatDateTime, formatRelative, formatFileSize } from '../../utils/helpers'
import EditDocumentModal from '../../components/documents/EditDocumentModal'
import { supabase } from '../../lib/supabase'

const TABS = [
  { id: 'info', label: 'Informasi' },
  { id: 'preview', label: 'Preview' },
  { id: 'versi', label: 'Versi' },
  { id: 'riwayat', label: 'Riwayat' },
]

export default function DocumentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()

  const [doc, setDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [historyLogs, setHistoryLogs] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    loadDocument()
  }, [id])

  useEffect(() => {
    if (activeTab === 'preview' && doc?.current_version_id) {
      loadPreview()
    } else if (activeTab === 'riwayat' && id) {
      loadHistory()
    }
  }, [activeTab, doc, id])

  async function loadHistory() {
    setHistoryLoading(true)
    try {
      const { data } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profile:profiles(full_name)
        `)
        .eq('resource_id', id)
        .in('action', ['edit', 'upload', 'restore'])
        .order('created_at', { ascending: false })
      setHistoryLogs(data || [])
    } catch (err) {
      console.error('Failed to load history:', err)
    } finally {
      setHistoryLoading(false)
    }
  }

  async function loadDocument() {
    setLoading(true)
    const { data, error } = await getDocumentById(id)
    if (error) {
      toast.error('Dokumen tidak ditemukan')
      navigate('/arsip')
    } else {
      setDoc(data)
    }
    setLoading(false)
  }

  async function loadPreview() {
    if (!doc?.versions?.length) return
    setPreviewLoading(true)
    const latest = doc.versions[doc.versions.length - 1]
    if (latest?.file_path) {
      const url = await getFileUrl(latest.file_path)
      setPreviewUrl(url)
    }
    setPreviewLoading(false)
  }

  const handleDownload = async () => {
    if (!doc?.versions?.length) return
    setDownloading(true)
    const latest = doc.versions[doc.versions.length - 1]
    const { error } = await downloadFile(latest.file_path, latest.file_name)
    if (error) toast.error('Gagal download file')
    else {
      toast.success('Download dimulai')
      await logActivity(user.id, 'download', 'document', id, doc.name)
    }
    setDownloading(false)
  }

  const handleToggleFavorite = async () => {
    await toggleFavorite(id, !doc.is_favorite, user.id)
    setDoc(prev => ({ ...prev, is_favorite: !prev.is_favorite }))
    toast.success(doc.is_favorite ? 'Dihapus dari favorit' : 'Ditambahkan ke favorit')
  }

  const handleDelete = async () => {
    setDeleting(true)
    const { error } = await deleteDocument(id, user.id)
    if (error) toast.error('Gagal menghapus dokumen')
    else {
      toast.success('Dokumen dipindahkan ke trash')
      navigate('/arsip')
    }
    setDeleting(false)
    setShowDelete(false)
  }

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!doc) return null

  const latestVersion = doc.versions?.[doc.versions.length - 1]
  const isPdf = latestVersion?.mime_type === 'application/pdf'
  const isImage = latestVersion?.mime_type?.startsWith('image/')

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Back & actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleFavorite}
            aria-label={doc.is_favorite ? 'Hapus favorit' : 'Tambah favorit'}
          >
            <Star className={`w-4 h-4 ${doc.is_favorite ? 'fill-amber-400 text-amber-400' : ''}`} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={handleDownload}
            loading={downloading}
            disabled={!latestVersion}
          >
            Download
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Edit2 className="w-3.5 h-3.5" />}
            onClick={() => setShowEdit(true)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDelete(true)}
            aria-label="Hapus dokumen"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900">{doc.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {doc.document_number && (
                <span className="text-xs font-mono text-gray-500">{doc.document_number}</span>
              )}
              {doc.archive_code && (
                <span className="text-xs font-mono text-gray-400">{doc.archive_code}</span>
              )}
              <Badge variant={doc.status === 'aktif' ? 'success' : 'default'}>{doc.status}</Badge>
              <ExpiryBadge validUntil={doc.valid_until} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          {/* INFORMASI */}
          {activeTab === 'info' && (
            <Card className="animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InfoRow icon={<Tag className="w-4 h-4" />} label="Kategori" value={doc.category?.name || '—'} />
                <InfoRow icon={<Hash className="w-4 h-4" />} label="Jenis" value={doc.document_type || '—'} />
                <InfoRow icon={<User className="w-4 h-4" />} label="Peserta" value={doc.participant?.full_name || '—'} />
                <InfoRow icon={<Building2 className="w-4 h-4" />} label="Perusahaan" value={doc.company?.name || '—'} />
                <InfoRow icon={<Calendar className="w-4 h-4" />} label="Tanggal Dokumen" value={formatDate(doc.document_date)} />
                <InfoRow icon={<Calendar className="w-4 h-4" />} label="Berlaku Mulai" value={formatDate(doc.valid_from)} />
                <InfoRow icon={<Calendar className="w-4 h-4" />} label="Berlaku Sampai" value={formatDate(doc.valid_until)} />
                <InfoRow icon={<Shield className="w-4 h-4" />} label="Keamanan" value={doc.security_level || '—'} />
                <InfoRow icon={<Clock className="w-4 h-4" />} label="Diupload" value={formatDateTime(doc.created_at)} />
                <InfoRow icon={<Clock className="w-4 h-4" />} label="Diperbarui" value={formatRelative(doc.updated_at)} />
                {doc.notes && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-500 mb-1">Catatan</p>
                    <p className="text-sm text-gray-900 whitespace-pre-line">{doc.notes}</p>
                  </div>
                )}
              </div>
              {latestVersion && (
                <>
                  <Divider className="my-4" />
                  <p className="text-xs font-medium text-gray-500 mb-2">File</p>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{latestVersion.file_name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(latestVersion.file_size)}</p>
                    </div>
                  </div>
                </>
              )}
            </Card>
          )}

          {/* PREVIEW */}
          {activeTab === 'preview' && (
            <Card className="animate-fade-in" padding={false}>
              {previewLoading ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="animate-spin-slow w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full" />
                </div>
              ) : !previewUrl ? (
                <div className="h-96 flex flex-col items-center justify-center gap-3 text-gray-400">
                  <FileText className="w-10 h-10" />
                  <p className="text-sm">Tidak ada file untuk dipreview</p>
                  <Button size="sm" variant="secondary" onClick={() => setActiveTab('preview')}>
                    Muat Preview
                  </Button>
                </div>
              ) : isPdf ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-[600px] rounded-xl"
                  title={`Preview ${doc.name}`}
                />
              ) : isImage ? (
                <div className="p-4">
                  <img
                    src={previewUrl}
                    alt={doc.name}
                    className="max-w-full max-h-[600px] mx-auto rounded-lg object-contain"
                  />
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center gap-3 text-gray-400">
                  <FileText className="w-10 h-10" />
                  <p className="text-sm">Format tidak mendukung preview</p>
                  <Button size="sm" onClick={handleDownload} loading={downloading}>
                    Download File
                  </Button>
                </div>
              )}
            </Card>
          )}

          {/* VERSI */}
          {activeTab === 'versi' && (
            <Card className="animate-fade-in">
              {!doc.versions?.length ? (
                <p className="text-sm text-gray-500 text-center py-8">Belum ada versi</p>
              ) : (
                <div className="space-y-3">
                  {[...doc.versions].reverse().map((v, i) => (
                    <div key={v.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        v{v.version_number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{v.file_name || `Versi ${v.version_number}`}</p>
                        <p className="text-xs text-gray-500">{formatDateTime(v.created_at)} · {v.created_by_profile?.full_name || 'Admin'}</p>
                        {v.notes && <p className="text-xs text-gray-400 mt-0.5">{v.notes}</p>}
                      </div>
                      {i === 0 && <Badge variant="dark">Current</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* RIWAYAT */}
          {activeTab === 'riwayat' && (
            <Card className="animate-fade-in">
              {historyLoading ? (
                <div className="py-8 flex justify-center">
                  <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : historyLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Belum ada catatan riwayat untuk dokumen ini
                </div>
              ) : (
                <div className="space-y-3">
                  {historyLogs.map(log => {
                    const actionLabel = {
                      upload: 'Dokumen Diunggah',
                      edit: 'Dokumen Diedit / Diperbarui',
                      delete: 'Dokumen Dihapus (Trash)',
                      restore: 'Dokumen Dipulihkan',
                      download: 'Dokumen Diunduh',
                      preview: 'Dokumen Dilihat',
                    }[log.action] || log.action

                    const actionBadge = {
                      upload: 'info',
                      edit: 'default',
                      delete: 'danger',
                      restore: 'success',
                      download: 'default',
                      preview: 'default',
                    }[log.action] || 'default'

                    return (
                      <div key={log.id} className="p-3.5 rounded-xl border border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={actionBadge}>{actionLabel}</Badge>
                            <span className="text-xs text-gray-500 font-medium">oleh {log.profile?.full_name || 'Admin'}</span>
                          </div>
                          <span className="text-xs text-gray-400 font-mono">{formatDateTime(log.created_at)}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatRelative(log.created_at)}
                        </p>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="mt-2 text-xs bg-gray-50 p-2 rounded border border-gray-100 text-gray-600 space-y-0.5">
                            {Object.entries(log.details).map(([k, v]) => (
                              v !== null && v !== undefined && v !== '' ? (
                                <div key={k} className="flex gap-2 text-[11px]">
                                  <span className="text-gray-400 capitalize">{k.replace('_', ' ')}:</span>
                                  <span className="text-gray-800 font-medium">{String(v)}</span>
                                </div>
                              ) : null
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          <Card>
            <p className="text-xs font-medium text-gray-500 mb-3">Relasi Dokumen</p>
            {doc.participant && (
              <RelationItem
                label="Peserta"
                value={doc.participant.full_name}
                icon={<User className="w-3.5 h-3.5" />}
                onClick={() => navigate(`/peserta/${doc.participant.id}`)}
              />
            )}
            {doc.company && (
              <RelationItem
                label="Perusahaan"
                value={doc.company.name}
                icon={<Building2 className="w-3.5 h-3.5" />}
                onClick={() => navigate(`/perusahaan/${doc.company.id}`)}
              />
            )}
            {doc.job_order && (
              <RelationItem
                label="Job Order"
                value={doc.job_order.jo_number}
                icon={<Hash className="w-3.5 h-3.5" />}
                onClick={() => navigate(`/perusahaan/job-order/${doc.job_order.id}`)}
              />
            )}
            {!doc.participant && !doc.company && !doc.job_order && (
              <p className="text-xs text-gray-400">Tidak ada relasi</p>
            )}
          </Card>

          <Card>
            <p className="text-xs font-medium text-gray-500 mb-3">Versi</p>
            <p className="text-2xl font-bold text-gray-900">v{doc.version}</p>
            <p className="text-xs text-gray-400 mt-1">{doc.versions?.length || 1} versi tersimpan</p>
          </Card>
        </div>
      </div>

      {showEdit && (
        <EditDocumentModal
          isOpen={showEdit}
          document={doc}
          onClose={() => setShowEdit(false)}
          onSuccess={() => { setShowEdit(false); loadDocument(); loadHistory(); }}
        />
      )}

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Hapus Dokumen"
        message={`"${doc.name}" akan dipindahkan ke trash.`}
        loading={deleting}
      />
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-gray-400">{icon}</span>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
      <p className="text-sm text-gray-900 pl-5.5">{value || '—'}</p>
    </div>
  )
}

function RelationItem({ label, value, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left mb-1"
    >
      <span className="text-gray-400">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-400">{label}</p>
        <p className="text-xs font-medium text-gray-900 truncate">{value}</p>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
    </button>
  )
}
