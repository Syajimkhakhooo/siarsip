import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  FileText, Upload, Download, Star, Trash2, Eye, Edit2,
  MoreHorizontal, Filter, X, SortAsc
} from 'lucide-react'
import {
  getDocuments, getCategories, deleteDocument, toggleFavorite
} from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import {
  Button, Card, Badge, SearchInput, FilterBar, SearchableSelect,
  Table, Thead, Th, Tbody, Tr, Td, EmptyState, SkeletonTable,
  Pagination, ExpiryBadge, DropdownMenu, ConfirmDialog, PageHeader
} from '../../components/ui'
import { formatDate, truncate } from '../../utils/helpers'
import UploadDocumentModal from '../../components/documents/UploadDocumentModal'

const DOC_STATUS_BADGE = {
  aktif: 'success',
  tidak_aktif: 'default',
  kedaluwarsa: 'danger',
  draft: 'outline',
}

export default function DocumentsPage({ mode }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user } = useAuth()
  const toast = useToast()

  const [documents, setDocuments] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const PER_PAGE = 20

  const [search, setSearch] = useState(params.get('search') || '')
  const [filters, setFilters] = useState({ categoryId: '', status: '' })
  const [showUpload, setShowUpload] = useState(params.get('action') === 'upload')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const isTrash = mode === 'trash'
  const isFavorite = mode === 'favorite'
  const isExpiring = mode === 'expiring'
  const isRecent = mode === 'recent'

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadDocuments()
  }, [search, filters, page, mode])

  async function loadCategories() {
    const { data } = await getCategories()
    setCategories(data || [])
  }

  async function loadDocuments() {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const in90 = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]

      let query = {
        search: search || undefined,
        categoryId: filters.categoryId || undefined,
        status: filters.status || undefined,
        isDeleted: isTrash,
        isFavorite: isFavorite || undefined,
        limit: PER_PAGE,
        offset: (page - 1) * PER_PAGE,
      }

      const { data, error, count } = await getDocuments(query)
      if (!error) {
        let docs = data || []

        // Client-side filters for special views
        if (isExpiring) {
          docs = docs.filter(d => {
            if (!d.valid_until) return false
            const days = Math.floor((new Date(d.valid_until) - new Date()) / 86400000)
            return days >= 0 && days <= 90
          })
        }
        if (isRecent) {
          const weekAgo = new Date(Date.now() - 7 * 86400000)
          docs = docs.filter(d => new Date(d.created_at) > weekAgo)
        }

        setDocuments(docs)
        setTotal(count || docs.length)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await deleteDocument(deleteTarget.id, user.id)
    if (error) {
      toast.error('Gagal menghapus dokumen')
    } else {
      toast.success('Dokumen dipindahkan ke trash')
      loadDocuments()
    }
    setDeleting(false)
    setDeleteTarget(null)
  }

  const handleToggleFavorite = async (doc) => {
    await toggleFavorite(doc.id, !doc.is_favorite, user.id)
    toast.success(doc.is_favorite ? 'Dihapus dari favorit' : 'Ditambahkan ke favorit')
    loadDocuments()
  }

  const getTitle = () => {
    if (isTrash) return 'Trash'
    if (isFavorite) return 'Favorit'
    if (isExpiring) return 'Akan Kedaluwarsa'
    if (isRecent) return 'Dokumen Terbaru'
    return 'Semua Dokumen'
  }

  const getBreadcrumb = () => {
    const base = ['Arsip']
    if (!isTrash && !isFavorite && !isExpiring && !isRecent) return base
    return [...base, getTitle()]
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title={getTitle()}
        breadcrumb={getBreadcrumb()}
        action={
          !isTrash && (
            <Button
              variant="primary"
              size="sm"
              icon={<Upload className="w-3.5 h-3.5" />}
              onClick={() => setShowUpload(true)}
            >
              Upload Dokumen
            </Button>
          )
        }
      />

      {/* Filters */}
      <Card padding={false}>
        <div className="p-4 flex flex-wrap items-center gap-3 border-b border-gray-50">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Cari dokumen, nomor, kode arsip..."
            className="flex-1 min-w-[200px] max-w-sm"
          />
          <FilterBar>
            <SearchableSelect
              value={filters.categoryId}
              onChange={v => setFilters(p => ({ ...p, categoryId: v }))}
              placeholder="Semua Kategori"
              className="w-40"
              options={categories.map(c => ({ value: c.id, label: c.name }))}
            />
            <SearchableSelect
              value={filters.status}
              onChange={v => setFilters(p => ({ ...p, status: v }))}
              placeholder="Semua Status"
              className="w-36"
              options={[
                { value: 'aktif', label: 'Aktif' },
                { value: 'draft', label: 'Draft' },
                { value: 'tidak_aktif', label: 'Tidak Aktif' },
                { value: 'kedaluwarsa', label: 'Kedaluwarsa' },
              ]}
            />
            {(filters.categoryId || filters.status) && (
              <Button
                variant="ghost"
                size="sm"
                icon={<X className="w-3.5 h-3.5" />}
                onClick={() => setFilters({ categoryId: '', status: '' })}
              >
                Reset
              </Button>
            )}
          </FilterBar>
        </div>

        {/* Table */}
        <Table>
          <Thead>
            <Th>Dokumen</Th>
            <Th className="hidden md:table-cell">Nomor</Th>
            <Th className="hidden lg:table-cell">Kategori</Th>
            <Th className="hidden md:table-cell">Terkait</Th>
            <Th>Status</Th>
            <Th className="hidden lg:table-cell">Berlaku Sampai</Th>
            <Th align="right">Aksi</Th>
          </Thead>
          <Tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>
                  <SkeletonTable rows={8} cols={7} />
                </td>
              </tr>
            ) : documents.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    icon={<FileText className="w-5 h-5" />}
                    title={search ? 'Tidak ada hasil' : 'Belum ada dokumen'}
                    description={search ? `Tidak ada dokumen untuk "${search}"` : 'Upload dokumen pertama untuk memulai'}
                    action={!isTrash && !search && (
                      <Button size="sm" onClick={() => setShowUpload(true)}>Upload Dokumen</Button>
                    )}
                  />
                </td>
              </tr>
            ) : (
              documents.map(doc => (
                <Tr key={doc.id} onClick={() => navigate(`/arsip/${doc.id}`)}>
                  <Td>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">{doc.name}</p>
                        <p className="text-xs text-gray-400">{doc.archive_code || '—'}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="hidden md:table-cell">
                    <span className="text-xs font-mono text-gray-600">{doc.document_number || '—'}</span>
                  </Td>
                  <Td className="hidden lg:table-cell">
                    <Badge variant="default">{doc.category?.name || '—'}</Badge>
                  </Td>
                  <Td className="hidden md:table-cell">
                    <span className="text-sm text-gray-600">
                      {doc.participant?.full_name || doc.company?.name || '—'}
                    </span>
                  </Td>
                  <Td>
                    <Badge variant={DOC_STATUS_BADGE[doc.status] || 'default'}>
                      {doc.status}
                    </Badge>
                  </Td>
                  <Td className="hidden lg:table-cell">
                    <ExpiryBadge validUntil={doc.valid_until} />
                  </Td>
                  <Td align="right" onClick={e => e.stopPropagation()}>
                    <DropdownMenu
                      trigger={
                        <button className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      }
                      items={[
                        { label: 'Lihat Detail', icon: <Eye className="w-4 h-4" />, onClick: () => navigate(`/arsip/${doc.id}`) },
                        { label: 'Edit', icon: <Edit2 className="w-4 h-4" />, onClick: () => navigate(`/arsip/${doc.id}/edit`) },
                        { label: doc.is_favorite ? 'Hapus Favorit' : 'Tandai Favorit', icon: <Star className="w-4 h-4" />, onClick: () => handleToggleFavorite(doc) },
                        { divider: true },
                        { label: 'Hapus', icon: <Trash2 className="w-4 h-4" />, onClick: () => setDeleteTarget(doc), danger: true },
                      ]}
                    />
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>

        <Pagination
          page={page}
          total={total}
          perPage={PER_PAGE}
          onChange={setPage}
        />
      </Card>

      {/* Modals */}
      {showUpload && (
        <UploadDocumentModal
          isOpen={showUpload}
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); loadDocuments(); toast.success('Dokumen berhasil diupload') }}
          categories={categories}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Dokumen"
        message={`Dokumen "${deleteTarget?.name}" akan dipindahkan ke trash. Anda bisa mengembalikannya nanti.`}
        loading={deleting}
      />
    </div>
  )
}
