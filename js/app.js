// js/app.js
const CONFIG = {
  SUPABASE_URL:  'https://uaioaiubvzukcbnlnzoe.supabase.co',
  SUPABASE_ANON: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaW9haXVidnp1a2Nibmxuem9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MTUyOTcsImV4cCI6MjA5MzM5MTI5N30.zvm_FMm1kIly_K2AWeQHvMaQp1UCeq2V1xeRWgVKQlY',
  API_URL: 'https://gal-backend-production.up.railway.app',
  ADMIN_EMAIL: 'ceo@salesopenscaling.com',
}

const sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON)

async function getUser() {
  try {
    const { data: { session } } = await sb.auth.getSession()
    return session?.user || null
  } catch(e) { return null }
}

async function getProfile(userId) {
  try {
    const { data } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle()
    return data
  } catch(e) { return null }
}

function goHome(role, email) {
  if (email === CONFIG.ADMIN_EMAIL || role === 'admin') {
    window.location.href = '/admin.html'
  } else if (role === 'instructor') {
    window.location.href = '/instructor.html'
  } else {
    window.location.href = '/index.html'
  }
}

async function requireRole(expectedRole) {
  showLoader()
  // getSession reads from localStorage — no network round-trip
  const { data: { session } } = await sb.auth.getSession()
  if (!session?.user) { window.location.href = '/login.html'; return null }
  const user = session.user
  const profile = await getProfile(user.id)
  if (!profile) { window.location.href = '/login.html'; return null }
  if (profile.role !== expectedRole) { goHome(profile.role, user.email); return null }
  hideLoader()
  return { user, profile }
}

async function api(path, method = 'GET', body = null) {
  const { data: { session } } = await sb.auth.getSession()
  const headers = { 'Content-Type': 'application/json' }
  if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
  const res = await fetch(CONFIG.API_URL + path, { method, headers, body: body ? JSON.stringify(body) : null })
  if (!res.ok) { const e = await res.json().catch(() => ({ error: 'Failed' })); throw new Error(e.error || 'Failed') }
  return res.json()
}

function toast(msg, ms = 2500) {
  const t = document.getElementById('toast'); if (!t) return
  t.textContent = msg; t.classList.add('show')
  setTimeout(() => t.classList.remove('show'), ms)
}
function showLoader() { const l = document.getElementById('loader'); if (l) l.style.display = 'flex' }
function hideLoader() { const l = document.getElementById('loader'); if (l) l.style.display = 'none' }
function ini(name) { if (!name) return '?'; return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) }
function fmtDate(iso) { if (!iso) return 'TBC'; return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) }
function fmtTime(iso) { if (!iso) return ''; return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) }
function openModal() { const m = document.getElementById('modal'); if (m) m.classList.add('open') }
function closeModal() { const m = document.getElementById('modal'); if (m) m.classList.remove('open') }
document.addEventListener('click', e => { const m = document.getElementById('modal'); if (m && e.target === m) closeModal() })
