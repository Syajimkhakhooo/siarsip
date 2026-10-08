import { useState, useEffect } from 'react'
import { BarChart2, Printer, FileText, Users, Building2, AlertTriangle, ShieldCheck, Download } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { getDashboardStats } from '../../services/api'
import { Button, Card, PageHeader, Badge, ProgressBar } from '../../components/ui'
import { formatDate } from '../../utils/helpers'

export default function ReportsPage() {
  const [stats, setStats] = useState(null)
  const [categoriesBreakdown, setCategoriesBreakdown] = useState([])
  const [participantsBreakdown, setParticipantsBreakdown] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReportData()
  }, [])

  async function loadReportData() {
    setLoading(true)
    try {
      const [dashStats, catRes, partRes] = await Promise.all([
        getDashboardStats(),
        supabase.from('document_categories').select('name, code, type, documents(count)').eq('is_active', true),
        supabase.from('participants').select('status'),
      ])

      setStats(dashStats)

      // Category counts
      if (catRes.data) {
        const mappedCats = catRes.data.map(c => ({
          name: c.name,
          code: c.code,
          type: c.type,
          count: c.documents?.[0]?.count || 0,
        })).sort((a, b) => b.count - a.count)
        setCategoriesBreakdown(mappedCats)
      }

      // Participant statuses
      if (partRes.data) {
        const counts = {}
        partRes.data.forEach(p => {
          counts[p.status] = (counts[p.status] || 0) + 1
        })
        setParticipantsBreakdown(counts)
      }
    } catch (err) {
      console.error('Failed to load report data:', err)
    } finally {
      setLoading(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <PageHeader
          title="Laporan & Ringkasan Arsip"
          description="Rekapitulasi statistik volume dokumen, status peserta, dan kepatuhan masa berlaku dokumen"
          breadcrumb={['Dashboard', 'Laporan']}
          action={
            <Button
              variant="outline"
              icon={<Printer className="w-4 h-4" />}
              onClick={handlePrint}
            >
              Cetak / Ekspor PDF
            </Button>
          }
        />
      </div>

      {/* Printable header */}
      <div className="hidden print:block pb-4 mb-6 border-b border-gray-200">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">LPK BAHTERA MITRA UNGGULAN</h1>
          <p className="text-sm text-gray-600">Laporan Rekapitulasi Sistem Kearsipan Digital (BMU Archive)</p>
          <p className="text-xs text-gray-400 mt-1">Dicetak pada: {formatDate(new Date())}</p>
        </div>
      </div>

      {/* Main KPI metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium">Total Dokumen Arsip</span>
            <FileText className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.totalDocuments || 0}</div>
          <div className="text-[11px] text-gray-400 mt-1">Seluruh dokumen aktif</div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium">Total Peserta Terdaftar</span>
            <Users className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.totalParticipants || 0}</div>
          <div className="text-[11px] text-gray-400 mt-1">Semua angkatan & status</div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium">Perusahaan Rekanan</span>
            <Building2 className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.totalCompanies || 0}</div>
          <div className="text-[11px] text-gray-400 mt-1">Mitra penerima kerja</div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-red-600 font-medium">Kedaluwarsa / Kritis</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600">
            {(stats?.expiredDocuments || 0) + (stats?.expiringSoon30 || 0)}
          </div>
          <div className="text-[11px] text-red-500 mt-1">Memerlukan perpanjangan segera</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance and Expiry Status */}
        <Card>
          <h2 className="text-sm font-bold text-gray-900 mb-4">Monitoring Masa Berlaku Dokumen</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium text-gray-700 mb-1.5">
                <span className="text-red-700">Kedaluwarsa</span>
                <span className="font-bold">{stats?.expiredDocuments || 0} berkas</span>
              </div>
              <ProgressBar value={stats?.expiredDocuments || 0} max={Math.max(stats?.totalDocuments || 1, 10)} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-gray-700 mb-1.5">
                <span className="text-amber-700">Kritis (≤ 30 Hari)</span>
                <span className="font-bold">{stats?.expiringSoon30 || 0} berkas</span>
              </div>
              <ProgressBar value={stats?.expiringSoon30 || 0} max={Math.max(stats?.totalDocuments || 1, 10)} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-gray-700 mb-1.5">
                <span className="text-amber-600">Peringatan (31 - 90 Hari)</span>
                <span className="font-bold">{(stats?.expiringSoon90 || 0) - (stats?.expiringSoon30 || 0)} berkas</span>
              </div>
              <ProgressBar value={Math.max(0, (stats?.expiringSoon90 || 0) - (stats?.expiringSoon30 || 0))} max={Math.max(stats?.totalDocuments || 1, 10)} className="h-2" />
            </div>
          </div>
        </Card>

        {/* Participant Status Breakdown */}
        <Card>
          <h2 className="text-sm font-bold text-gray-900 mb-4">Distribusi Status Peserta</h2>
          <div className="space-y-3">
            {[
              { key: 'pendaftar', label: 'Pendaftar Baru' },
              { key: 'aktif', label: 'Aktif' },
              { key: 'pelatihan', label: 'Dalam Pelatihan' },
              { key: 'persiapan_keberangkatan', label: 'Persiapan Keberangkatan' },
              { key: 'berangkat', label: 'Sedang di Jepang (Berangkat)' },
              { key: 'selesai', label: 'Selesai Magang' },
              { key: 'alumni', label: 'Alumni' },
            ].map(item => {
              const count = participantsBreakdown[item.key] || 0
              const totalPart = stats?.totalParticipants || 1
              const pct = Math.round((count / totalPart) * 100)
              return (
                <div key={item.key} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-none">
                  <span className="text-gray-700">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{count}</span>
                    <span className="text-gray-400 text-[10px]">({pct}%)</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Category breakdown table */}
      <Card padding={false}>
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">Distribusi Dokumen Berdasarkan Kategori</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-left text-xs font-semibold text-gray-500 uppercase">
                <th className="py-2.5 px-4">Nama Kategori</th>
                <th className="py-2.5 px-4">Kode</th>
                <th className="py-2.5 px-4">Tipe Klasifikasi</th>
                <th className="py-2.5 px-4 text-right">Jumlah Berkas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categoriesBreakdown.slice(0, 15).map(cat => (
                <tr key={cat.code} className="hover:bg-gray-50/50">
                  <td className="py-2.5 px-4 font-medium text-gray-900">{cat.name}</td>
                  <td className="py-2.5 px-4 font-mono text-xs text-gray-500">{cat.code}</td>
                  <td className="py-2.5 px-4">
                    <Badge variant="outline">{cat.type}</Badge>
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold text-gray-900">{cat.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
