import { useState, useEffect } from 'react'
import { Briefcase, Plus, Edit2, Trash2, Calendar, Users, Building2 } from 'lucide-react'
import { getJobOrders, deleteJobOrder } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import {
  Button, Card, Badge, SearchInput, SearchableSelect,
  Table, Thead, Th, Tbody, Tr, Td, EmptyState, SkeletonTable,
  Pagination, ConfirmDialog, PageHeader
} from '../../components/ui'
import { formatDate } from '../../utils/helpers'
import AddJobOrderModal from '../../components/companies/AddJobOrderModal'

const STATUS_BADGE = {
  draft: 'default',
  aktif: 'success',
  recruitment: 'info',
  selesai: 'dark',
  dibatalkan: 'danger',
}

const STATUS_LABEL = {
  draft: 'Draft',
  aktif: 'Aktif',
  recruitment: 'Recruitment',
  selesai: 'Selesai',
  dibatalkan: 'Dibatalkan',
}

export default function JobOrdersPage() {
  const { user } = useAuth()
  const toast = useToast()

  const [jobOrders, setJobOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 15

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedJO, setSelectedJO] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadJobOrders()
  }, [search, statusFilter])

  async function loadJobOrders() {
    setLoading(true)
    try {
      const { data, error } = await getJobOrders({
        search: search || undefined,
        status: statusFilter || undefined,
        limit: 100,
      })
      if (error) throw error
      setJobOrders(data || [])
    } catch (err) {
      toast.error('Gagal memuat data Job Order: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { error } = await deleteJobOrder(deleteTarget.id)
      if (error) throw error
      toast.success('Job Order berhasil dihapus')
      setDeleteTarget(null)
      loadJobOrders()
    } catch (err) {
      toast.error('Gagal menghapus Job Order: ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  const paginated = jobOrders.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const total = jobOrders.length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Order (Permintaan Kerja)"
        description="Kelola daftar permintaan tenaga kerja & kuota dari perusahaan mitra di Jepang"
        breadcrumb={['Dashboard', 'Perusahaan', 'Job Order']}
        action={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setSelectedJO(null)
              setModalOpen(true)
            }}
          >
            Tambah Job Order
          </Button>
        }
      />

      <Card padding={false}>
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <SearchInput
            value={search}
            onChange={v => { setSearch(v); setPage(1) }}
            placeholder="Cari no. JO, posisi, judul..."
            className="sm:w-80"
          />

          <div className="flex items-center gap-3">
            <SearchableSelect
              value={statusFilter}
              onChange={v => { setStatusFilter(v); setPage(1) }}
              placeholder="Semua Status"
              className="w-44"
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'aktif', label: 'Aktif' },
                { value: 'recruitment', label: 'Recruitment' },
                { value: 'selesai', label: 'Selesai' },
                { value: 'dibatalkan', label: 'Dibatalkan' },
              ]}
            />
          </div>
        </div>

        {loading ? (
          <SkeletonTable rows={6} cols={6} />
        ) : paginated.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="w-8 h-8" />}
            title="Belum ada Job Order"
            description={search || statusFilter ? 'Tidak ada data sesuai kriteria filter' : 'Tambahkan Job Order untuk peserta magang BMU'}
            action={
              !search && !statusFilter && (
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => { setSelectedJO(null); setModalOpen(true) }}
                >
                  Buat Job Order Baru
                </Button>
              )
            }
          />
        ) : (
          <>
            <Table>
              <Thead>
                <Th>No. JO / Judul</Th>
                <Th>Perusahaan</Th>
                <Th>Posisi & Lokasi</Th>
                <Th>Kuota</Th>
                <Th>Deadline</Th>
                <Th>Status</Th>
                <Th align="right">Aksi</Th>
              </Thead>
              <Tbody>
                {paginated.map(jo => (
                  <Tr key={jo.id}>
                    <Td>
                      <div className="font-mono text-xs text-gray-500 font-semibold">{jo.jo_number}</div>
                      <div className="font-medium text-gray-900 mt-0.5">{jo.title}</div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1.5 text-gray-800 text-sm">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        <span>{jo.company?.name || '-'}</span>
                      </div>
                    </Td>
                    <Td>
                      <div className="text-sm text-gray-900 font-medium">{jo.position || '-'}</div>
                      <div className="text-xs text-gray-500">{jo.location || jo.company?.country || 'Jepang'}</div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span>{jo.quota || 0} orang</span>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>{formatDate(jo.deadline)}</span>
                      </div>
                    </Td>
                    <Td>
                      <Badge variant={STATUS_BADGE[jo.status] || 'default'}>
                        {STATUS_LABEL[jo.status] || jo.status}
                      </Badge>
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Edit"
                          onClick={() => {
                            setSelectedJO(jo)
                            setModalOpen(true)
                          }}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Hapus"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteTarget(jo)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
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

      <AddJobOrderModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedJO(null) }}
        onSuccess={() => {
          loadJobOrders()
          toast.success(selectedJO ? 'Job Order berhasil diperbarui' : 'Job Order berhasil dibuat')
        }}
        initialData={selectedJO}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Hapus Job Order"
        message={`Apakah Anda yakin ingin menghapus "${deleteTarget?.jo_number} - ${deleteTarget?.title}"?`}
      />
    </div>
  )
}
