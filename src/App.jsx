import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import AppLayout from './components/layout/AppLayout'

// Pages
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import DocumentsPage from './pages/documents/DocumentsPage'
import DocumentDetailPage from './pages/documents/DocumentDetailPage'
import ParticipantsPage from './pages/participants/ParticipantsPage'
import ParticipantDetailPage from './pages/participants/ParticipantDetailPage'
import CompaniesPage from './pages/companies/CompaniesPage'
import JobOrdersPage from './pages/companies/JobOrdersPage'
import IncomingLettersPage from './pages/admin/IncomingLettersPage'
import OutgoingLettersPage from './pages/admin/OutgoingLettersPage'
import InstitutionDocumentsPage from './pages/admin/InstitutionDocumentsPage'
import ActivityLogsPage from './pages/activity/ActivityLogsPage'
import ReportsPage from './pages/reports/ReportsPage'
import SettingsPage from './pages/settings/SettingsPage'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-500 font-medium">Memuat SIARSIP...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Auth Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes inside AppLayout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard */}
              <Route index element={<DashboardPage />} />

              {/* Documents Archive */}
              <Route path="arsip" element={<DocumentsPage />} />
              <Route path="arsip/terbaru" element={<DocumentsPage mode="recent" />} />
              <Route path="arsip/kedaluwarsa" element={<DocumentsPage mode="expiring" />} />
              <Route path="arsip/favorit" element={<DocumentsPage mode="favorite" />} />
              <Route path="arsip/trash" element={<DocumentsPage mode="trash" />} />
              <Route path="arsip/:id" element={<DocumentDetailPage />} />

              {/* Participants */}
              <Route path="peserta" element={<ParticipantsPage />} />
              <Route path="peserta/:id" element={<ParticipantDetailPage />} />

              {/* Companies & Job Orders */}
              <Route path="perusahaan" element={<CompaniesPage />} />
              <Route path="perusahaan/job-order" element={<JobOrdersPage />} />

              {/* Administration */}
              <Route path="administrasi/surat-masuk" element={<IncomingLettersPage />} />
              <Route path="administrasi/surat-keluar" element={<OutgoingLettersPage />} />
              <Route path="administrasi/dokumen-lembaga" element={<InstitutionDocumentsPage />} />

              {/* Activity Logs */}
              <Route path="aktivitas" element={<ActivityLogsPage />} />

              {/* Reports */}
              <Route path="laporan" element={<ReportsPage />} />

              {/* Settings */}
              <Route path="pengaturan" element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
