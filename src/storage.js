import { supabase } from './supabase'

// DMs
export async function loadDMs() {
  const { data, error } = await supabase
    .from('dms')
    .select('*')
    .order('sent_at', { ascending: false })
  if (error) { console.error(error); return [] }
  return data.map(dbToDM)
}

export async function insertDM(dm) {
  const { error } = await supabase.from('dms').insert(dmToDB(dm))
  if (error) console.error(error)
}

export async function updateDM(dm) {
  const { error } = await supabase.from('dms').update(dmToDB(dm)).eq('id', dm.id)
  if (error) console.error(error)
}

export async function deleteDM(id) {
  const { error } = await supabase.from('dms').delete().eq('id', id)
  if (error) console.error(error)
}

// Pickup lines
export async function loadLines() {
  const { data, error } = await supabase
    .from('pickup_lines')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) { console.error(error); return [] }
  return data.map(dbToLine)
}

export async function insertLine(line) {
  const { error } = await supabase.from('pickup_lines').insert(lineToDB(line))
  if (error) console.error(error)
}

export async function deleteLine(id) {
  const { error } = await supabase.from('pickup_lines').delete().eq('id', id)
  if (error) console.error(error)
}

// Mappers (camelCase JS <-> snake_case DB)
function dmToDB(dm) {
  return {
    id: dm.id,
    username: dm.username,
    nickname: dm.nickname || null,
    platform: dm.platform,
    pickup_line_id: dm.pickupLineId || null,
    pickup_line_text: dm.pickupLineText,
    status: dm.status,
    notes: dm.notes || null,
    sent_at: dm.sentAt,
  }
}

function dbToDM(row) {
  return {
    id: row.id,
    username: row.username,
    nickname: row.nickname || '',
    platform: row.platform,
    pickupLineId: row.pickup_line_id || '',
    pickupLineText: row.pickup_line_text,
    status: row.status,
    notes: row.notes || '',
    sentAt: row.sent_at,
  }
}

function lineToDB(line) {
  return {
    id: line.id,
    text: line.text,
    created_at: line.createdAt,
  }
}

function dbToLine(row) {
  return {
    id: row.id,
    text: row.text,
    createdAt: row.created_at,
  }
}
