import { useState, useEffect } from 'react'
import { Building2, Plus, Edit2, Trash2, Globe, Mail, Phone, ExternalLink } from 'lucide-react'
import { getCompanies, deleteCompany } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import {
  Button, Card, Badge, SearchInput, SearchableSelect,
  Table, Thead, Th, Tbody, Tr, Td, EmptyState, SkeletonTable,
  Pagination, ConfirmDialog, PageHeader
} from '../../components/ui'
import AddCompanyModal from '../../components/companies/AddCompanyModal'

export default function CompaniesPage() {
  const { user } = useAuth()
  const toast = useToast()

  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 15

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadCompanies()
  }, [search, statusFilter])

  async function loadCompanies() {
    setLoading(true)
    try {
      const { data, error } = await getCompanies({
        search: search || undefined,
        status: statusFilter || undefined,
        limit: 100,
      })
      if (error) throw error
      setCompanies(data || [])
    } catch (err) {
      toast.error('Gagal memuat data perusahaan: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { error } = await deleteCompany(deleteTarget.id)
      if (error) throw error
      toast.success('Perusahaan berhasil dihapus')
      setDeleteTarget(null)
      loadCompanies()
    } catch (err) {
      toast.error('Gagal menghapus perusahaan: ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  const filtered = companies
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const total = filtered.length

  const activeCount = companies.filter(c => c.status === 'aktif').length
  const inactiveCount = companies.filter(c => c.status === 'tidak aktif').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daftar Perusahaan"
        description="Kelola data perusahaan mitra kerja dan rekanan penempatan magang / kerja"
        breadcrumb={['Dashboard', 'Perusahaan']}
        action={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setSelectedCompany(null)
              setModalOpen(true)
            }}
          >
            Tambah Perusahaan
          </Button>
        }
      />

      {/* Mini Stat Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-3 py-3">
          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Perusahaan</p>
            <p className="text-lg font-bold text-gray-900">{companies.length}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 py-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Perusahaan Aktif</p>
            <p className="text-lg font-bold text-gray-900">{activeCount}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 py-3">
          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Tidak Aktif</p>
            <p className="text-lg font-bold text-gray-900">{inactiveCount}</p>
          </div>
        </Card>
      </div>

      {/* Filter and Search */}
      <Card padding={false}>
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <SearchInput
            value={search}
            onChange={v => { setSearch(v); setPage(1) }}
            placeholder="Cari nama perusahaan, kota, negara..."
            className="sm:w-80"
          />

          <div className="flex items-center gap-3">
            <SearchableSelect
              value={statusFilter}
              onChange={v => { setStatusFilter(v); setPage(1) }}
              placeholder="Semua Status"
              className="w-40"
              options={[
                { value: 'aktif', label: 'Aktif' },
                { value: 'tidak aktif', label: 'Tidak Aktif' },
              ]}
            />
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <SkeletonTable rows={6} cols={5} />
        ) : paginated.length === 0 ? (
          <EmptyState
            icon={<Building2 className="w-8 h-8" />}
            title="Belum ada data perusahaan"
            description={search || statusFilter ? 'Tidak ada perusahaan yang sesuai filter pencarian' : 'Tambahkan data perusahaan mitra BMU'}
            action={
              !search && !statusFilter && (
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => { setSelectedCompany(null); setModalOpen(true) }}
                >
                  Tambah Sekarang
                </Button>
              )
            }
          />
        ) : (
          <>
            <Table>
              <Thead>
                <Th>Nama Perusahaan</Th>
                <Th>Lokasi</Th>
                <Th>Industri</Th>
                <Th>Kontak / PIC</Th>
                <Th>Status</Th>
                <Th align="right">Aksi</Th>
              </Thead>
              <Tbody>
                {paginated.map(company => (
                  <Tr key={company.id}>
                    <Td>
                      <div className="font-semibold text-gray-900">{company.name}</div>
                      {company.email && (
                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" />
                          <span>{company.email}</span>
                        </div>
                      )}
                    </Td>
                    <Td>
                      <span className="text-sm text-gray-700">
                        {[company.city, company.country].filter(Boolean).join(', ') || '-'}
                      </span>
                    </Td>
                    <Td>
                      <span className="text-sm text-gray-600">{company.industry || '-'}</span>
                    </Td>
                    <Td>
                      <div>
                        <span className="text-sm text-gray-900 font-medium">{company.pic || '-'}</span>
                        {company.contact && (
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            <span>{company.contact}</span>
                          </div>
                        )}
                      </div>
                    </Td>
                    <Td>
                      <Badge variant={company.status === 'aktif' ? 'success' : 'default'}>
                        {company.status === 'aktif' ? 'Aktif' : 'Tidak Aktif'}
                      </Badge>
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Edit"
                          onClick={() => {
                            setSelectedCompany(company)
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
                          onClick={() => setDeleteTarget(company)}
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

      {/* Add / Edit Modal */}
      <AddCompanyModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedCompany(null) }}
        onSuccess={() => {
          loadCompanies()
          toast.success(selectedCompany ? 'Perusahaan berhasil diperbarui' : 'Perusahaan baru berhasil ditambahkan')
        }}
        initialData={selectedCompany}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Hapus Perusahaan"
        message={`Apakah Anda yakin ingin menghapus "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
      />
    </div>
  )
}
