import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Users, Building2, Briefcase, AlertTriangle,
  Clock, Upload, UserPlus, Plus, ArrowRight, TrendingUp,
  CheckCircle, XCircle, AlertCircle
} from 'lucide-react'
import {
  getDashboardStats, getRecentDocuments,
  getExpiringDocuments, getRecentActivities
} from '../../services/api'
import {
  StatCard, Card, Badge, Avatar, ProgressBar,
  Button, ExpiryBadge, Skeleton, SectionHeader, EmptyState
} from '../../components/ui'
import { formatDate, formatRelative, truncate, PARTICIPANT_STATUS_LABELS } from '../../utils/helpers'

const ACTION_LABEL = {
  upload: 'Upload dokumen',
  edit: 'Edit metadata',
  delete: 'Hapus dokumen',
  restore: 'Restore dokumen',
  download: 'Download dokumen',
  login: 'Login',
  create: 'Buat baru',
  permanent_delete: 'Hapus permanen',
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recentDocs, setRecentDocs] = useState([])
  const [expiringDocs, setExpiringDocs] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [statsRes, recentRes, expiringRes, actRes] = await Promise.all([
        getDashboardStats(),
        getRecentDocuments(6),
        getExpiringDocuments(90),
        getRecentActivities(8),
      ])
      setStats(statsRes)
      setRecentDocs(recentRes.data || [])
      setExpiringDocs(expiringRes.data || [])
      setActivities(actRes.data || [])
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const statItems = [
    { label: 'Total Dokumen', value: stats?.totalDocuments ?? '-', icon: <FileText className="w-4 h-4" />, path: '/arsip' },
    { label: 'Peserta', value: stats?.totalParticipants ?? '-', icon: <Users className="w-4 h-4" />, path: '/peserta' },
    { label: 'Perusahaan', value: stats?.totalCompanies ?? '-', icon: <Building2 className="w-4 h-4" />, path: '/perusahaan' },
    { label: 'Job Order', value: stats?.totalJobOrders ?? '-', icon: <Briefcase className="w-4 h-4" />, path: '/perusahaan/job-order' },
  ]

  const alertItems = [
    { label: 'Kedaluwarsa', value: stats?.expiredDocuments ?? 0, color: 'danger', icon: <XCircle className="w-4 h-4" /> },
    { label: '< 30 hari', value: stats?.expiringSoon30 ?? 0, color: 'danger', icon: <AlertTriangle className="w-4 h-4" /> },
    { label: '< 90 hari', value: stats?.expiringSoon90 ?? 0, color: 'warning', icon: <AlertCircle className="w-4 h-4" /> },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<UserPlus className="w-3.5 h-3.5" />}
            onClick={() => navigate('/peserta?action=tambah')}
          >
            Peserta
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Upload className="w-3.5 h-3.5" />}
            onClick={() => navigate('/arsip?action=upload')}
          >
            Upload
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading
          ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
          : statItems.map(item => (
            <StatCard
              key={item.label}
              label={item.label}
              value={item.value.toLocaleString('id')}
              icon={item.icon}
              className="cursor-pointer hover:border-gray-200 hover:shadow-sm transition-all"
            />
          ))
        }
      </div>

      {/* Expiry alerts */}
      {!loading && (alertItems[0].value > 0 || alertItems[1].value > 0 || alertItems[2].value > 0) && (
        <Card className="border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-900">Peringatan Dokumen</p>
            <Button variant="ghost" size="sm" onClick={() => navigate('/arsip/kedaluwarsa')}>
              Lihat semua <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {alertItems.map(item => (
              <div key={item.label} className={`flex items-center gap-3 p-3 rounded-lg ${item.value > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                <span className={item.value > 0 ? 'text-red-500' : 'text-gray-400'}>{item.icon}</span>
                <div>
                  <p className="text-xl font-bold text-gray-900">{item.value}</p>
                  <p className="text-xs text-gray-500">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent docs - 2/3 */}
        <div className="lg:col-span-2 space-y-3">
          <SectionHeader
            title="Dokumen Terbaru"
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate('/arsip')}>
                Semua <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            }
          />
          <Card padding={false}>
            {loading ? (
              <div className="divide-y divide-gray-50">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-4">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-40" />
                      <Skeleton className="h-2.5 w-24" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-md" />
                  </div>
                ))}
              </div>
            ) : recentDocs.length === 0 ? (
              <EmptyState
                icon={<FileText className="w-5 h-5" />}
                title="Belum ada dokumen"
                description="Upload dokumen pertama untuk memulai"
                action={<Button size="sm" onClick={() => navigate('/arsip?action=upload')}>Upload Dokumen</Button>}
              />
            ) : (
              <div className="divide-y divide-gray-50">
                {recentDocs.map(doc => (
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
                      <p className="text-xs text-gray-400">
                        {doc.category?.name} · {doc.participant?.full_name || doc.company?.name || 'Umum'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <ExpiryBadge validUntil={doc.valid_until} />
                      <span className="text-[10px] text-gray-400">{formatRelative(doc.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Activity - 1/3 */}
        <div className="space-y-3">
          <SectionHeader title="Aktivitas Terbaru" />
          <Card padding={false}>
            {loading ? (
              <div className="p-4 space-y-4">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-1.5 pt-1">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-2.5 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <EmptyState
                icon={<Clock className="w-5 h-5" />}
                title="Belum ada aktivitas"
              />
            ) : (
              <div className="p-4 space-y-4">
                {activities.map((act, i) => (
                  <div key={act.id} className="flex gap-3">
                    <Avatar name={act.profile?.full_name || 'Admin'} size="sm" className="flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900">
                        {ACTION_LABEL[act.action] || act.action}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{act.resource_name || '-'}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatRelative(act.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Expiring documents list */}
      {!loading && expiringDocs.length > 0 && (
        <div className="space-y-3">
          <SectionHeader
            title="Dokumen Akan Kedaluwarsa"
            description="Dokumen yang memerlukan perhatian dalam 90 hari ke depan"
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate('/arsip/kedaluwarsa')}>
                Semua <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            }
          />
          <Card padding={false}>
            <div className="divide-y divide-gray-50">
              {expiringDocs.map(doc => {
                const days = Math.floor((new Date(doc.valid_until) - new Date()) / 86400000)
                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/arsip/${doc.id}`)}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${days <= 30 ? 'bg-red-500' : 'bg-amber-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                      <p className="text-xs text-gray-400">{doc.participant?.full_name || doc.company?.name || 'Umum'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium text-gray-900">{formatDate(doc.valid_until)}</p>
                      <p className={`text-[10px] ${days <= 30 ? 'text-red-500' : 'text-amber-600'}`}>
                        {days}h lagi
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
