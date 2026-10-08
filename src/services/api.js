import { supabase } from '../lib/supabase'

// =============================================
// AUDIT LOG
// =============================================
export async function logActivity(userId, action, resourceType, resourceId, resourceName, details = {}) {
  try {
    let uid = userId
    if (!uid) {
      const { data: authData } = await supabase.auth.getUser()
      uid = authData?.user?.id || null
    }
    await supabase.from('audit_logs').insert({
      user_id: uid,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      resource_name: resourceName,
      details,
    })
  } catch (err) {
    console.error('Failed to log activity:', err)
  }
}

// =============================================
// DOCUMENTS
// =============================================
export async function getDocuments({ search, categoryId, status, participantId, companyId, jobOrderId, isDeleted = false, isFavorite, limit = 50, offset = 0 } = {}) {
  let query = supabase
    .from('documents')
    .select(`
      *,
      category:document_categories(*),
      participant:participants(id, full_name),
      company:companies(id, name),
      job_order:job_orders(id, jo_number, title)
    `)
    .eq('is_deleted', isDeleted)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.or(`name.ilike.%${search}%,document_number.ilike.%${search}%,archive_code.ilike.%${search}%,notes.ilike.%${search}%`)
  }
  if (categoryId) query = query.eq('category_id', categoryId)
  if (status) query = query.eq('status', status)
  if (participantId) query = query.eq('participant_id', participantId)
  if (companyId) query = query.eq('company_id', companyId)
  if (jobOrderId) query = query.eq('job_order_id', jobOrderId)
  if (isFavorite) query = query.eq('is_favorite', true)

  return query
}

export async function getDocumentById(id) {
  return supabase
    .from('documents')
    .select(`
      *,
      category:document_categories(*),
      participant:participants(id, full_name, status),
      company:companies(id, name),
      job_order:job_orders(id, jo_number, title),
      versions:document_versions(*, created_by_profile:profiles(full_name))
    `)
    .eq('id', id)
    .single()
}

export async function createDocument(data, userId) {
  // Generate document number and archive code
  const year = new Date().getFullYear()

  let documentNumber = null
  let archiveCode = null

  const categoryCode = data.category_code
  const insertData = { ...data }
  delete insertData.category_code

  // Convert empty string values to null for PostgreSQL DATE & UUID columns
  if (!insertData.participant_id) insertData.participant_id = null
  if (!insertData.company_id) insertData.company_id = null
  if (!insertData.job_order_id) insertData.job_order_id = null
  if (!insertData.document_date) insertData.document_date = null
  if (!insertData.valid_from) insertData.valid_from = null
  if (!insertData.valid_until) insertData.valid_until = null
  if (!insertData.document_type) insertData.document_type = null
  if (!insertData.notes) insertData.notes = null

  if (categoryCode) {
    try {
      const { data: docNum } = await supabase.rpc('generate_document_number', {
        p_category_code: categoryCode,
        p_year: year,
      })
      documentNumber = docNum
    } catch (err) {
      console.warn('RPC generate_document_number fallback:', err)
    }

    try {
      const prefix = insertData.participant_id ? 'PST' : insertData.company_id ? 'COM' : 'ORG'
      const { data: archCode } = await supabase.rpc('generate_archive_code', {
        p_prefix: prefix,
        p_year: year,
      })
      archiveCode = archCode
    } catch (err) {
      console.warn('RPC generate_archive_code fallback:', err)
    }
  }

  // Fallback numbering if RPC is not present
  if (!documentNumber) {
    const rand = Math.floor(100 + Math.random() * 900)
    documentNumber = `BMU/${categoryCode || 'DOC'}/${year}/${rand}`
  }
  if (!archiveCode) {
    const prefix = insertData.participant_id ? 'PST' : insertData.company_id ? 'COM' : 'ORG'
    const rand = Math.floor(100000 + Math.random() * 900000)
    archiveCode = `ARS-${prefix}-${year}-${rand}`
  }

  const { data: doc, error } = await supabase
    .from('documents')
    .insert({
      ...insertData,
      document_number: documentNumber,
      archive_code: archiveCode,
      created_by: userId,
      version: 1,
    })
    .select()
    .single()

  if (error) return { error }

  // Log activity
  if (doc) {
    await logActivity(userId, 'upload', 'document', doc.id, doc.name)
  }

  return { data: doc }
}

export async function updateDocument(id, data, userId) {
  const updateData = { ...data }
  delete updateData.id
  delete updateData.category
  delete updateData.category_code
  delete updateData.participant
  delete updateData.company
  delete updateData.job_order
  delete updateData.versions
  delete updateData.created_by
  delete updateData.created_at

  // Convert empty strings to null for PostgreSQL DATE & UUID columns
  if (updateData.document_date === '') updateData.document_date = null
  if (updateData.valid_from === '') updateData.valid_from = null
  if (updateData.valid_until === '') updateData.valid_until = null
  if (updateData.participant_id === '') updateData.participant_id = null
  if (updateData.company_id === '') updateData.company_id = null
  if (updateData.job_order_id === '') updateData.job_order_id = null
  if (updateData.category_id === '') updateData.category_id = null
  if (updateData.notes === '') updateData.notes = null
  if (updateData.document_type === '') updateData.document_type = null

  const { data: doc, error } = await supabase
    .from('documents')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (!error && doc) {
    await logActivity(userId, 'edit', 'document', id, doc.name, updateData)
  }

  return { data: doc, error }
}

export async function deleteDocument(id, userId) {
  const { data: doc } = await supabase.from('documents').select('name').eq('id', id).single()
  const { error } = await supabase
    .from('documents')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (!error) {
    await logActivity(userId, 'delete', 'document', id, doc?.name)
  }
  return { error }
}

export async function restoreDocument(id, userId) {
  const { data: doc } = await supabase.from('documents').select('name').eq('id', id).single()
  const { error } = await supabase
    .from('documents')
    .update({ is_deleted: false, deleted_at: null })
    .eq('id', id)

  if (!error) {
    await logActivity(userId, 'restore', 'document', id, doc?.name)
  }
  return { error }
}

export async function permanentDeleteDocument(id, userId) {
  const { data: doc } = await supabase.from('documents').select('name').eq('id', id).single()
  const { error } = await supabase.from('documents').delete().eq('id', id)

  if (!error) {
    await logActivity(userId, 'permanent_delete', 'document', id, doc?.name)
  }
  return { error }
}

export async function toggleFavorite(id, isFavorite, userId) {
  const { error } = await supabase
    .from('documents')
    .update({ is_favorite: isFavorite })
    .eq('id', id)
  return { error }
}

// =============================================
// FILE UPLOAD
// =============================================
export async function uploadFile(file, path) {
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(path, file, { upsert: false })
  return { data, error }
}

export async function getFileUrl(path) {
  const { data } = await supabase.storage
    .from('documents')
    .createSignedUrl(path, 3600) // 1 hour expiry
  return data?.signedUrl
}

export async function downloadFile(path, fileName) {
  const { data, error } = await supabase.storage
    .from('documents')
    .download(path)

  if (error) return { error }

  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  return { data }
}

// =============================================
// PARTICIPANTS
// =============================================
export async function getParticipants({ search, status, limit = 50, offset = 0 } = {}) {
  let query = supabase
    .from('participants')
    .select(`
      *,
      company:companies(id, name),
      job_order:job_orders(id, jo_number, title)
    `)
    .order('full_name', { ascending: true })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,nik.ilike.%${search}%,passport_number.ilike.%${search}%,phone.ilike.%${search}%`)
  }
  if (status) query = query.eq('status', status)

  return query
}

export async function getParticipantById(id) {
  return supabase
    .from('participants')
    .select(`
      *,
      company:companies(id, name),
      job_order:job_orders(id, jo_number, title),
      documents:documents(*, category:document_categories(*))
    `)
    .eq('id', id)
    .single()
}

export async function createParticipant(data, userId) {
  return supabase
    .from('participants')
    .insert({ ...data, created_by: userId })
    .select()
    .single()
}

export async function updateParticipant(id, data) {
  return supabase
    .from('participants')
    .update(data)
    .eq('id', id)
    .select()
    .single()
}

export async function deleteParticipant(id) {
  return supabase.from('participants').delete().eq('id', id)
}

export async function getParticipantRequirements(participantId) {
  try {
    const { data, error } = await supabase
      .from('participant_document_requirements')
      .select('*, document:documents(*)')
      .eq('participant_id', participantId)
      .order('created_at', { ascending: true })

    if (error) {
      const local = localStorage.getItem(`siarsip_reqs_${participantId}`)
      return { data: local ? JSON.parse(local) : [], error: null }
    }
    return { data, error: null }
  } catch {
    const local = localStorage.getItem(`siarsip_reqs_${participantId}`)
    return { data: local ? JSON.parse(local) : [], error: null }
  }
}

export async function setParticipantRequirements(participantId, requirements) {
  try {
    const localKey = `siarsip_reqs_${participantId}`
    localStorage.setItem(localKey, JSON.stringify(requirements))

    const { error: delError } = await supabase
      .from('participant_document_requirements')
      .delete()
      .eq('participant_id', participantId)

    if (delError) {
      return { error: null }
    }

    if (requirements.length === 0) {
      return { error: null }
    }

    const rows = requirements.map(r => ({
      participant_id: participantId,
      document_name: r.document_name,
      document_id: r.document_id || null,
      is_completed: !!(r.document_id || r.is_completed),
    }))

    const { data } = await supabase
      .from('participant_document_requirements')
      .insert(rows)
      .select()

    return { data, error: null }
  } catch {
    return { error: null }
  }
}

// =============================================
// COMPANIES
// =============================================
export async function getCompanies({ search, status, limit = 50, offset = 0 } = {}) {
  let query = supabase
    .from('companies')
    .select('*')
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.or(`name.ilike.%${search}%,country.ilike.%${search}%,city.ilike.%${search}%`)
  }
  if (status) query = query.eq('status', status)

  return query
}

export async function getCompanyById(id) {
  return supabase
    .from('companies')
    .select(`
      *,
      job_orders(*),
      documents(*),
      participants(id, full_name, status)
    `)
    .eq('id', id)
    .single()
}

export async function createCompany(data, userId) {
  return supabase
    .from('companies')
    .insert({ ...data, created_by: userId })
    .select()
    .single()
}

export async function updateCompany(id, data) {
  return supabase.from('companies').update(data).eq('id', id).select().single()
}

export async function deleteCompany(id) {
  return supabase.from('companies').delete().eq('id', id)
}

// =============================================
// JOB ORDERS
// =============================================
export async function getJobOrders({ search, status, companyId, limit = 50, offset = 0 } = {}) {
  let query = supabase
    .from('job_orders')
    .select(`
      *,
      company:companies(id, name, country)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.or(`jo_number.ilike.%${search}%,title.ilike.%${search}%,position.ilike.%${search}%`)
  }
  if (status) query = query.eq('status', status)
  if (companyId) query = query.eq('company_id', companyId)

  return query
}

export async function createJobOrder(data, userId) {
  // Generate JO number
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('job_orders')
    .select('*', { count: 'exact', head: true })

  const joNumber = `JO-${year}-${String((count || 0) + 1).padStart(3, '0')}`

  return supabase
    .from('job_orders')
    .insert({ ...data, jo_number: joNumber, created_by: userId })
    .select()
    .single()
}

export async function updateJobOrder(id, data) {
  return supabase.from('job_orders').update(data).eq('id', id).select().single()
}

export async function deleteJobOrder(id) {
  return supabase.from('job_orders').delete().eq('id', id)
}

// =============================================
// CATEGORIES
// =============================================
export async function getCategories() {
  return supabase
    .from('document_categories')
    .select('*')
    .eq('is_active', true)
    .order('name')
}

// =============================================
// DASHBOARD STATS
// =============================================
export async function getDashboardStats() {
  const today = new Date().toISOString().split('T')[0]
  const in30Days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  const in90Days = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]

  const [docs, participants, companies, jobOrders, expiredDocs, expiringSoon30, expiringSoon90] = await Promise.all([
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
    supabase.from('participants').select('*', { count: 'exact', head: true }),
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('job_orders').select('*', { count: 'exact', head: true }),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('is_deleted', false).lt('valid_until', today),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('is_deleted', false).gte('valid_until', today).lte('valid_until', in30Days),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('is_deleted', false).gte('valid_until', today).lte('valid_until', in90Days),
  ])

  return {
    totalDocuments: docs.count || 0,
    totalParticipants: participants.count || 0,
    totalCompanies: companies.count || 0,
    totalJobOrders: jobOrders.count || 0,
    expiredDocuments: expiredDocs.count || 0,
    expiringSoon30: expiringSoon30.count || 0,
    expiringSoon90: expiringSoon90.count || 0,
  }
}

export async function getRecentDocuments(limit = 5) {
  return supabase
    .from('documents')
    .select(`
      *,
      category:document_categories(name),
      participant:participants(id, full_name)
    `)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit)
}

export async function getExpiringDocuments(days = 90) {
  const today = new Date().toISOString().split('T')[0]
  const future = new Date(Date.now() + days * 86400000).toISOString().split('T')[0]

  return supabase
    .from('documents')
    .select(`
      *,
      category:document_categories(name),
      participant:participants(id, full_name)
    `)
    .eq('is_deleted', false)
    .not('valid_until', 'is', null)
    .gte('valid_until', today)
    .lte('valid_until', future)
    .order('valid_until', { ascending: true })
    .limit(10)
}

export async function getRecentActivities(limit = 10) {
  return supabase
    .from('audit_logs')
    .select(`
      *,
      profile:profiles(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)
}

// =============================================
// INCOMING / OUTGOING LETTERS
// =============================================
export async function getIncomingLetters({ search, limit = 50, offset = 0 } = {}) {
  let query = supabase
    .from('incoming_letters')
    .select('*')
    .order('letter_date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.or(`letter_number.ilike.%${search}%,sender.ilike.%${search}%,subject.ilike.%${search}%`)
  }

  return query
}

export async function createIncomingLetter(data, userId) {
  return supabase
    .from('incoming_letters')
    .insert({ ...data, created_by: userId })
    .select()
    .single()
}

export async function getOutgoingLetters({ search, limit = 50, offset = 0 } = {}) {
  let query = supabase
    .from('outgoing_letters')
    .select('*')
    .order('letter_date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.or(`letter_number.ilike.%${search}%,recipient.ilike.%${search}%,subject.ilike.%${search}%`)
  }

  return query
}

export async function createOutgoingLetter(data, userId) {
  // Auto generate letter number
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('outgoing_letters')
    .select('*', { count: 'exact', head: true })

  const letterNumber = `BMU/SKL/${year}/${String((count || 0) + 1).padStart(3, '0')}`

  return supabase
    .from('outgoing_letters')
    .insert({ ...data, letter_number: letterNumber, created_by: userId })
    .select()
    .single()
}



// =============================================
// AUDIT LOGS
// =============================================
export async function getAuditLogs({ limit = 50, offset = 0 } = {}) {
  return supabase
    .from('audit_logs')
    .select(`
      *,
      profile:profiles(full_name)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
}
