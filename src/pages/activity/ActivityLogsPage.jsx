import { useState, useEffect } from 'react'
import { Activity, Clock, User, Filter, FileText, CheckCircle2 } from 'lucide-react'
import { getAuditLogs } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import {
  Card, Badge, SearchInput, SearchableSelect,
  Table, Thead, Th, Tbody, Tr, Td, EmptyState, SkeletonTable,
  Pagination, PageHeader
} from '../../components/ui'
import { formatDateTime, formatRelative } from '../../utils/helpers'

const ACTION_BADGE = {
  upload: 'info',
  edit: 'default',
  delete: 'danger',
  restore: 'success',
  permanent_delete: 'danger',
  download: 'default',
}

const ACTION_LABEL = {
  upload: 'Unggah',
  edit: 'Sunting',
  delete: 'Hapus (Trash)',
  restore: 'Pulihkan',
  permanent_delete: 'Hapus Permanen',
  download: 'Unduh',
}

export default function ActivityLogsPage() {
  const toast = useToast()

  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 20

  useEffect(() => {
    loadLogs()
  }, [])

  async function loadLogs() {
    setLoading(true)
    try {
      const { data, error } = await getAuditLogs({ limit: 100 })
      if (error) throw error
      setLogs(data || [])
    } catch (err) {
      toast.error('Gagal memuat log aktivitas: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const filtered = logs.filter(log => {
    const matchesSearch = !search ||
      log.resource_name?.toLowerCase().includes(search.toLowerCase()) ||
      log.action?.toLowerCase().includes(search.toLowerCase()) ||
      log.profile?.full_name?.toLowerCase().includes(search.toLowerCase())
    const matchesAction = !actionFilter || log.action === actionFilter
    return matchesSearch && matchesAction
  })

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const total = filtered.length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riwayat Aktivitas (Audit Log)"
        description="Jejak audit dan rekaman aktivitas pengguna atas dokumen dan arsip sistem BMU"
        breadcrumb={['Dashboard', 'Aktivitas']}
      />

      <Card padding={false}>
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <SearchInput
            value={search}
            onChange={v => { setSearch(v); setPage(1) }}
            placeholder="Cari aktivitas atau nama dokumen..."
            className="sm:w-80"
          />

          <div className="flex items-center gap-3">
            <SearchableSelect
              value={actionFilter}
              onChange={v => { setActionFilter(v); setPage(1) }}
              placeholder="Semua Tindakan"
              className="w-44"
              options={[
                { value: 'upload', label: 'Unggah' },
                { value: 'edit', label: 'Sunting' },
                { value: 'delete', label: 'Hapus' },
                { value: 'restore', label: 'Pulihkan' },
                { value: 'permanent_delete', label: 'Hapus Permanen' },
              ]}
            />
          </div>
        </div>

        {loading ? (
          <SkeletonTable rows={8} cols={5} />
        ) : paginated.length === 0 ? (
          <EmptyState
            icon={<Activity className="w-8 h-8" />}
            title="Belum ada catatan aktivitas"
            description={search || actionFilter ? 'Tidak ada catatan sesuai kriteria filter' : 'Aktivitas pengarsipan akan tercatat otomatis di sini'}
          />
        ) : (
          <>
            <Table>
              <Thead>
                <Th>Waktu & Tanggal</Th>
                <Th>Pengguna</Th>
                <Th>Tindakan</Th>
                <Th>Tipe Sumber Daya</Th>
                <Th>Nama Entitas / Dokumen</Th>
              </Thead>
              <Tbody>
                {paginated.map(item => (
                  <Tr key={item.id}>
                    <Td>
                      <div className="text-xs text-gray-900 font-medium">
                        {formatDateTime(item.created_at)}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {formatRelative(item.created_at)}
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>{item.profile?.full_name || 'Admin'}</span>
                      </div>
                    </Td>
                    <Td>
                      <Badge variant={ACTION_BADGE[item.action] || 'default'}>
                        {ACTION_LABEL[item.action] || item.action}
                      </Badge>
                    </Td>
                    <Td>
                      <span className="font-mono text-xs uppercase text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                        {item.resource_type}
                      </span>
                    </Td>
                    <Td>
                      <span className="text-sm font-medium text-gray-900">
                        {item.resource_name || '-'}
                      </span>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>

            <Pagination
              page={page}
              total={total}
              perPage={PER_PAGE}
              onChange={setPage}
            />
          </>
        )}
      </Card>
    </div>
  )
}
