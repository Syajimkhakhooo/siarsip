import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { UserPlus, MoreHorizontal, Eye, Edit2, Trash2, Filter } from 'lucide-react'
import {
  getParticipants, deleteParticipant
} from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import {
  Button, Card, Badge, SearchInput, SearchableSelect, FilterBar,
  Table, Thead, Th, Tbody, Tr, Td, EmptyState, SkeletonTable,
  Pagination, Avatar, DropdownMenu, ConfirmDialog, PageHeader
} from '../../components/ui'
import { PARTICIPANT_STATUS_LABELS } from '../../utils/helpers'
import AddParticipantModal from '../../components/participants/AddParticipantModal'

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

export default function ParticipantsPage({ filterStatus }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const toast = useToast()

  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const PER_PAGE = 20

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(filterStatus || '')
  const [showAdd, setShowAdd] = useState(params.get('action') === 'tambah')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadParticipants()
  }, [search, status, page])

  async function loadParticipants() {
    setLoading(true)
    const { data, error, count } = await getParticipants({
      search: search || undefined,
      status: status || undefined,
      limit: PER_PAGE,
      offset: (page - 1) * PER_PAGE,
    })
    if (!error) {
      setParticipants(data || [])
      setTotal(count || data?.length || 0)
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await deleteParticipant(deleteTarget.id)
    if (error) toast.error('Gagal menghapus peserta')
    else { toast.success('Peserta berhasil dihapus'); loadParticipants() }
    setDeleting(false)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Peserta"
        breadcrumb={['Peserta']}
        action={
          <Button
            variant="primary"
            size="sm"
            icon={<UserPlus className="w-3.5 h-3.5" />}
            onClick={() => setShowAdd(true)}
          >
            Tambah Peserta
          </Button>
        }
      />

      <Card padding={false}>
        <div className="p-4 flex flex-wrap items-center gap-3 border-b border-gray-50">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Cari nama, NIK, nomor paspor..."
            className="flex-1 min-w-[200px] max-w-sm"
          />
          <SearchableSelect
            value={status}
            onChange={v => setStatus(v)}
            placeholder="Semua Status"
            className="w-48"
            options={Object.entries(PARTICIPANT_STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }))}
          />
        </div>

        <Table>
          <Thead>
            <Th>Peserta</Th>
            <Th className="hidden sm:table-cell">NIK</Th>
            <Th className="hidden md:table-cell">Program</Th>
            <Th>Status</Th>
            <Th className="hidden lg:table-cell">Perusahaan Tujuan</Th>
            <Th align="right">Aksi</Th>
          </Thead>
          <Tbody>
            {loading ? (
              <tr><td colSpan={6}><SkeletonTable rows={8} cols={6} /></td></tr>
            ) : participants.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon={<UserPlus className="w-5 h-5" />}
                    title="Belum ada peserta"
                    description="Tambahkan peserta pertama untuk memulai"
                    action={<Button size="sm" onClick={() => setShowAdd(true)}>Tambah Peserta</Button>}
                  />
                </td>
              </tr>
            ) : (
              participants.map(p => (
                <Tr key={p.id} onClick={() => navigate(`/peserta/${p.id}`)}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={p.full_name} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.full_name}</p>
                        <p className="text-xs text-gray-400">{p.phone || '—'}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="hidden sm:table-cell">
                    <span className="text-xs font-mono text-gray-600">{p.nik || '—'}</span>
                  </Td>
                  <Td className="hidden md:table-cell">
                    <span className="text-sm text-gray-600">{p.program || '—'}</span>
                  </Td>
                  <Td>
                    <Badge variant={STATUS_BADGE[p.status] || 'default'}>
                      {PARTICIPANT_STATUS_LABELS[p.status] || p.status}
                    </Badge>
                  </Td>
                  <Td className="hidden lg:table-cell">
                    <span className="text-sm text-gray-600">{p.company?.name || '—'}</span>
                  </Td>
                  <Td align="right" onClick={e => e.stopPropagation()}>
                    <DropdownMenu
                      trigger={
                        <button className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      }
                      items={[
                        { label: 'Lihat Detail', icon: <Eye className="w-4 h-4" />, onClick: () => navigate(`/peserta/${p.id}`) },
                        { label: 'Edit', icon: <Edit2 className="w-4 h-4" />, onClick: () => navigate(`/peserta/${p.id}?edit=true`) },
                        { divider: true },
                        { label: 'Hapus', icon: <Trash2 className="w-4 h-4" />, onClick: () => setDeleteTarget(p), danger: true },
                      ]}
                    />
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>

        <Pagination page={page} total={total} perPage={PER_PAGE} onChange={setPage} />
      </Card>

      {showAdd && (
        <AddParticipantModal
          isOpen={showAdd}
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); loadParticipants(); toast.success('Peserta berhasil ditambahkan') }}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Peserta"
        message={`Peserta "${deleteTarget?.full_name}" akan dihapus permanen. Data dokumen terkait tidak akan ikut terhapus.`}
        loading={deleting}
      />
    </div>
  )
}
