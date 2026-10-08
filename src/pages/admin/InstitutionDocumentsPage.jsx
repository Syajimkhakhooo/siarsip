import { useState, useEffect } from 'react'
import { BookOpen, Plus, Download, Eye, Star, Trash2, Calendar, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { getCategories, toggleFavorite, deleteDocument } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import {
  Button, Card, Badge, SearchInput, SearchableSelect,
  Table, Thead, Th, Tbody, Tr, Td, EmptyState, SkeletonTable,
  Pagination, ExpiryBadge, ConfirmDialog, PageHeader
} from '../../components/ui'
import { formatDate } from '../../utils/helpers'
import UploadDocumentModal from '../../components/documents/UploadDocumentModal'

export default function InstitutionDocumentsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()

  const [documents, setDocuments] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 15

  const [uploadOpen, setUploadOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadLembagaCategories()
  }, [])

  useEffect(() => {
    loadDocuments()
  }, [search, categoryFilter])

  async function loadLembagaCategories() {
    try {
      const { data } = await supabase
        .from('document_categories')
        .select('*')
        .eq('type', 'lembaga')
        .order('name')
      setCategories(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  async function loadDocuments() {
    setLoading(true)
    try {
      // Query documents that have categories of type 'lembaga'
      let query = supabase
        .from('documents')
        .select(`
          *,
          category:document_categories(*)
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (categoryFilter) {
        query = query.eq('category_id', categoryFilter)
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,document_number.ilike.%${search}%,archive_code.ilike.%${search}%`)
      }

      const { data, error } = await query
      if (error) throw error

      // Filter to only lembaga category if no specific categoryFilter selected
      const filtered = categoryFilter
        ? data
        : data.filter(d => d.category?.type === 'lembaga' || (!d.participant_id && !d.company_id))

      setDocuments(filtered || [])
    } catch (err) {
      toast.error('Gagal memuat dokumen lembaga: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleFavorite(doc) {
    try {
      const nextFav = !doc.is_favorite
      await toggleFavorite(doc.id, nextFav, user?.id)
      setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, is_favorite: nextFav } : d))
      toast.success(nextFav ? 'Ditambahkan ke favorit' : 'Dihapus dari favorit')
    } catch (err) {
      toast.error('Gagal mengubah favorit')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { error } = await deleteDocument(deleteTarget.id, user?.id)
      if (error) throw error
      toast.success('Dokumen dipindahkan ke Trash')
      setDeleteTarget(null)
      loadDocuments()
    } catch (err) {
      toast.error('Gagal menghapus dokumen: ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  const paginated = documents.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const total = documents.length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dokumen & Legalitas Lembaga"
        description="Penyimpanan arsip legalitas PT/LPK, perizinan SO/Kemnaker, SOP operasional, dan surat keputusan"
        breadcrumb={['Dashboard', 'Administrasi', 'Dokumen Lembaga']}
        action={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setUploadOpen(true)}
          >
            Unggah Dokumen Lembaga
          </Button>
        }
      />

      <Card padding={false}>
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <SearchInput
            value={search}
            onChange={v => { setSearch(v); setPage(1) }}
            placeholder="Cari nama dokumen, nomor SK, kode arsip..."
            className="sm:w-80"
          />

          <div className="flex items-center gap-3">
            <SearchableSelect
              value={categoryFilter}
              onChange={v => { setCategoryFilter(v); setPage(1) }}
              placeholder="Semua Kategori Lembaga"
              className="w-48"
              options={categories.map(c => ({ value: c.id, label: `${c.name} (${c.code})` }))}
            />
          </div>
        </div>

        {loading ? (
          <SkeletonTable rows={6} cols={6} />
        ) : paginated.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-8 h-8" />}
            title="Belum ada dokumen lembaga"
            description={search || categoryFilter ? 'Tidak ada dokumen sesuai filter' : 'Unggah berkas perizinan atau SOP lembaga BMU'}
            action={
              !search && !categoryFilter && (
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setUploadOpen(true)}
                >
                  Unggah Dokumen Sekarang
                </Button>
              )
            }
          />
        ) : (
          <>
            <Table>
              <Thead>
                <Th>Nama Dokumen / No. SK</Th>
                <Th>Kode Arsip</Th>
                <Th>Kategori</Th>
                <Th>Tgl Dokumen</Th>
                <Th>Masa Berlaku</Th>
                <Th align="right">Aksi</Th>
              </Thead>
              <Tbody>
                {paginated.map(doc => (
                  <Tr
                    key={doc.id}
                    onClick={() => navigate(`/arsip/${doc.id}`)}
                  >
                    <Td>
                      <div className="flex items-start gap-2.5">
                        <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-gray-900">{doc.name}</div>
                          {doc.document_number && (
                            <div className="text-xs text-gray-500 font-mono mt-0.5">{doc.document_number}</div>
                          )}
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <span className="font-mono text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                        {doc.archive_code || '-'}
                      </span>
                    </Td>
                    <Td>
                      <Badge variant="outline">{doc.category?.name || 'Umum'}</Badge>
                    </Td>
                    <Td>
                      <span className="text-xs text-gray-600">{formatDate(doc.document_date)}</span>
                    </Td>
                    <Td>
                      <ExpiryBadge validUntil={doc.valid_until} />
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Lihat Detail"
                          onClick={() => navigate(`/arsip/${doc.id}`)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title={doc.is_favorite ? 'Hapus dari favorit' : 'Favoritkan'}
                          onClick={() => handleToggleFavorite(doc)}
                        >
                          <Star className={`w-3.5 h-3.5 ${doc.is_favorite ? 'fill-amber-400 text-amber-500' : 'text-gray-400'}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Hapus"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteTarget(doc)}
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

      <UploadDocumentModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => {
          loadDocuments()
          toast.success('Dokumen lembaga berhasil diunggah')
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Hapus Dokumen Lembaga"
        message={`Pindahkan dokumen "${deleteTarget?.name}" ke Trash?`}
      />
    </div>
  )
}
