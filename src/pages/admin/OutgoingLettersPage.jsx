import { useState, useEffect } from 'react'
import { Send, Plus, Download, FileText, Calendar, Building2 } from 'lucide-react'
import { getOutgoingLetters, getFileUrl, downloadFile } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import {
  Button, Card, Badge, SearchInput,
  Table, Thead, Th, Tbody, Tr, Td, EmptyState, SkeletonTable,
  Pagination, PageHeader
} from '../../components/ui'
import { formatDate } from '../../utils/helpers'
import AddOutgoingLetterModal from '../../components/admin/AddOutgoingLetterModal'

export default function OutgoingLettersPage() {
  const toast = useToast()

  const [letters, setLetters] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 15

  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    loadLetters()
  }, [search])

  async function loadLetters() {
    setLoading(true)
    try {
      const { data, error } = await getOutgoingLetters({
        search: search || undefined,
        limit: 100,
      })
      if (error) throw error
      setLetters(data || [])
    } catch (err) {
      toast.error('Gagal memuat surat keluar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDownload(path, fileName) {
    if (!path) return
    try {
      await downloadFile(path, fileName || 'surat_keluar.pdf')
      toast.success('Berkas surat berhasil diunduh')
    } catch (err) {
      toast.error('Gagal mengunduh berkas: ' + err.message)
    }
  }

  async function handlePreview(path) {
    if (!path) return
    try {
      const url = await getFileUrl(path)
      if (url) window.open(url, '_blank')
    } catch (err) {
      toast.error('Gagal membuka berkas: ' + err.message)
    }
  }

  const paginated = letters.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const total = letters.length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buku Agenda Surat Keluar"
        description="Penerbitan nomor surat resmi BMU dan pengarsipan berkas keluar"
        breadcrumb={['Dashboard', 'Administrasi', 'Surat Keluar']}
        action={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setModalOpen(true)}
          >
            Buat Surat Keluar
          </Button>
        }
      />

      <Card padding={false}>
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <SearchInput
            value={search}
            onChange={v => { setSearch(v); setPage(1) }}
            placeholder="Cari no. surat, penerima, perihal..."
            className="sm:w-80"
          />
          <div className="text-xs text-gray-500 font-medium">
            Total {total} surat keluar diterbitkan
          </div>
        </div>

        {loading ? (
          <SkeletonTable rows={6} cols={5} />
        ) : paginated.length === 0 ? (
          <EmptyState
            icon={<Send className="w-8 h-8" />}
            title="Belum ada surat keluar"
            description={search ? 'Tidak ada surat keluar yang sesuai pencarian' : 'Terbitkan nomor surat keluar resmi lembaga di sini'}
            action={
              !search && (
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setModalOpen(true)}
                >
                  Buat Surat Pertama
                </Button>
              )
            }
          />
        ) : (
          <>
            <Table>
              <Thead>
                <Th>No. Surat / Tanggal</Th>
                <Th>Tujuan Penerima</Th>
                <Th>Perihal</Th>
                <Th>Kategori</Th>
                <Th>Lampiran</Th>
                <Th align="right">Aksi</Th>
              </Thead>
              <Tbody>
                {paginated.map(l => (
                  <Tr key={l.id}>
                    <Td>
                      <div className="font-mono text-xs font-semibold text-gray-900">{l.letter_number}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>{formatDate(l.letter_date)}</span>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        <span>{l.recipient}</span>
                      </div>
                    </Td>
                    <Td>
                      <div className="text-sm font-medium text-gray-900 max-w-sm truncate">{l.subject}</div>
                      {l.notes && <div className="text-xs text-gray-500 max-w-sm truncate mt-0.5">{l.notes}</div>}
                    </Td>
                    <Td>
                      <Badge variant="outline">{l.category || 'Resmi'}</Badge>
                    </Td>
                    <Td>
                      {l.file_path ? (
                        <button
                          type="button"
                          onClick={() => handlePreview(l.file_path)}
                          className="flex items-center gap-1.5 text-xs text-gray-700 hover:text-gray-900 hover:underline font-medium"
                        >
                          <FileText className="w-3.5 h-3.5 text-gray-500" />
                          <span className="truncate max-w-[120px]">{l.file_name || 'Lihat Berkas'}</span>
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Tidak ada berkas</span>
                      )}
                    </Td>
                    <Td align="right">
                      {l.file_path ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Unduh Berkas"
                          onClick={() => handleDownload(l.file_path, l.file_name)}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-300">-</span>
                      )}
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

      <AddOutgoingLetterModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          loadLetters()
          toast.success('Surat keluar berhasil diterbitkan')
        }}
      />
    </div>
  )
}
