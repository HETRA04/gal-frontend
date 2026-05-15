// js/home.js — homepage: map, instructor browse, signup flows


const COLOURS = ['#1A3C5E','#7B3F8B','#1A7C4F','#C0392B','#2B5EA7','#C0712B','#BE185D','#0F766E','#6D28D9','#047857']
const FILTERS  = ['All','Top Rated','Cheapest','Female','Male','Automatic','Crash Course','Test Bundle','Evenings']
let allInstructors = [], currentFilter = 'All', currentView = 'map'
let leafMap = null, mapReady = false, markers = [], selectedInstructor = null

;(async () => {
  buildFilterBar()
  const { data: dbInstrs } = await sb
    .from('instructor_profiles')
    .select('*, profile:profiles!user_id(id,full_name,avatar_url,city,postcode), listings:instructor_listings(listing_type:listing_types(id,name))')
    .eq('subscription_status', 'active')
    .eq('is_accepting_students', true)
    .order('avg_rating', { ascending: false })

  const realInstrs = (dbInstrs || []).map((ip, i) => ({
    id: ip.id, name: ip.profile?.full_name || 'Instructor',
    profileUserId: ip.profile?.id,
    ini: ini(ip.profile?.full_name), col: COLOURS[i % COLOURS.length],
    lat: 53.4808, lng: -2.2426,
    postcode: ip.profile?.postcode || '',
    rating: ip.avg_rating || 4.5, reviews: ip.total_reviews || 0,
    passRate: ip.pass_rate || 0, lessons: ip.total_lessons || 0,
    price: ip.hourly_rate || 35, transmission: ip.transmission || 'manual',
    experience: ip.years_experience || 0,
    city: ip.profile?.city || ip.profile?.postcode || 'Manchester',
    listings: ip.listings?.map(l => l.listing_type?.name).filter(Boolean) || [],
    bio: ip.bio || '', level: ip.avg_rating >= 4.8 ? 'Top Rated' : 'Instructor',
    gender: null, car: ip.car_make_model || '',
    centres: ip.test_centres || [], isReal: true,
  }))

  // Geocode instructor postcodes via postcodes.io (free, no key)
  const toGeocode = realInstrs.filter(i => i.postcode).map(i => i.postcode)
  if (toGeocode.length) {
    try {
      const geoRes = await fetch('https://api.postcodes.io/postcodes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postcodes: toGeocode }) })
      const geoData = await geoRes.json()
      if (geoData.status === 200) {
        const geoMap = {}
        geoData.result.forEach(r => { if (r.result) geoMap[r.query.toUpperCase()] = { lat: r.result.latitude, lng: r.result.longitude } })
        realInstrs.forEach(ins => {
          const g = geoMap[ins.postcode.toUpperCase().replace(/\s/g,'')]
            || geoMap[ins.postcode.toUpperCase()]
          if (g) { ins.lat = g.lat; ins.lng = g.lng }
        })
      }
    } catch(e) { /* geocoding failed — markers stay at Manchester centre */ }
  }

  allInstructors = realInstrs
  renderGigs(allInstructors)
  requestLocation()
})()

function requestLocation() {
  if (!navigator.geolocation) { initMap(53.4808, -2.2426, false); return }
  navigator.geolocation.getCurrentPosition(
    pos => {
      const banner = document.getElementById('loc-banner')
      if (banner) { banner.style.display = 'flex'; document.getElementById('loc-text').textContent = 'Showing instructors within 25 miles of your location' }
      initMap(pos.coords.latitude, pos.coords.longitude, true)
    },
    () => {
      const banner = document.getElementById('loc-banner')
      if (banner) { banner.style.display = 'flex'; banner.style.background = 'var(--tag)'; banner.style.color = 'var(--n2)'; banner.style.borderColor = 'var(--bdr)'; document.getElementById('loc-text').textContent = 'Showing Manchester — allow location for personalised results' }
      initMap(53.4808, -2.2426, false)
    }
  )
}

function initMap(lat, lng, hasLocation) {
  if (mapReady) return; mapReady = true
  leafMap = L.map('main-map', { zoomControl: true, attributionControl: false }).setView([lat, lng], 11)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(leafMap)
  if (hasLocation) {
    const youIcon = L.divIcon({ html: '<div style="width:18px;height:18px;background:#2563EB;border-radius:50%;border:3px solid white;box-shadow:0 0 0 6px rgba(37,99,235,0.2)"></div>', className: '', iconSize: [18,18], iconAnchor: [9,9] })
    L.marker([lat, lng], { icon: youIcon }).addTo(leafMap).bindPopup('Your location')
    L.circle([lat, lng], { radius: 40234, color: '#2563EB', weight: 1.5, fillColor: '#2563EB', fillOpacity: 0.04, dashArray: '6,5' }).addTo(leafMap)
  }
  addMarkers(allInstructors)
}

function addMarkers(list) {
  markers.forEach(m => leafMap && leafMap.removeLayer(m)); markers = []
  list.forEach(ins => {
    if (!ins.lat || !ins.lng) return
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="54" viewBox="0 0 44 54"><path d="M22 1C12.6 1 5 8.6 5 18c0 13.5 17 35 17 35s17-21.5 17-35C39 8.6 31.4 1 22 1z" fill="' + ins.col + '" stroke="white" stroke-width="2"/><circle cx="22" cy="18" r="9" fill="rgba(255,255,255,0.25)"/><text x="22" y="22" text-anchor="middle" font-family="sans-serif" font-size="9" font-weight="bold" fill="white">' + ins.ini + '</text></svg>'
    const icon = L.divIcon({ html: svg, className: '', iconSize: [44,54], iconAnchor: [22,54] })
    const popup = '<div style="font-family:sans-serif;min-width:160px;padding:2px"><strong style="font-size:13px">' + ins.name + '</strong><div style="font-size:11px;color:#64748b;margin:3px 0">' + ins.city + ' · ' + ins.experience + ' yrs exp</div><div style="font-size:11px;margin-bottom:6px">⭐ ' + ins.rating + ' · £' + ins.price + '/hr</div><button onclick="openInstrDetail(\'' + ins.id + '\')" style="width:100%;padding:7px;background:#1DBF73;color:white;border:none;border-radius:5px;font-size:12px;font-weight:700;cursor:pointer;font-family:sans-serif">View profile</button></div>'
    const m = L.marker([ins.lat, ins.lng], { icon }).addTo(leafMap).bindPopup(popup, { maxWidth: 200 })
    markers.push(m)
  })
}

function setView(v) {
  currentView = v
  document.getElementById('vt-map').classList.toggle('on', v==='map')
  document.getElementById('vt-list').classList.toggle('on', v==='list')
  document.getElementById('view-map').style.display = v==='map' ? 'block' : 'none'
  document.getElementById('view-list').style.display = v==='list' ? 'block' : 'none'
  if (v==='map' && leafMap) leafMap.invalidateSize()
}

function buildFilterBar() {
  const bar = document.getElementById('filter-bar'); if (!bar) return
  bar.innerHTML = FILTERS.map(f => '<button class="fp' + (f===currentFilter?' on':'') + '" onclick="applyFilter(\'' + f + '\')">' + f + '</button>').join('')
}

function applyFilter(f) {
  currentFilter = f; buildFilterBar()
  let list = [...allInstructors]
  if (f==='Top Rated')    list = list.filter(i=>i.level==='Top Rated').sort((a,b)=>b.rating-a.rating)
  else if (f==='Cheapest') list.sort((a,b)=>a.price-b.price)
  else if (f==='Female')   list = list.filter(i=>i.gender==='Female')
  else if (f==='Male')     list = list.filter(i=>i.gender==='Male')
  else if (f==='Automatic') list = list.filter(i=>i.transmission==='automatic'||i.listings.some(l=>l.toLowerCase().includes('auto')))
  else if (f==='Crash Course') list = list.filter(i=>i.listings.some(l=>l.toLowerCase().includes('crash')))
  else if (f==='Test Bundle')  list = list.filter(i=>i.listings.some(l=>l.toLowerCase().includes('test')))
  else if (f==='Evenings')     list = list.filter(i=>i.listings.some(l=>l.toLowerCase().includes('evening')))
  renderGigs(list); if (leafMap) addMarkers(list)
}

function doSearch() {
  const q = document.getElementById('search-inp').value.toLowerCase().trim()
  if (!q) { applyFilter('All'); return }
  const res = allInstructors.filter(i =>
    i.name.toLowerCase().includes(q) || i.bio.toLowerCase().includes(q) ||
    i.city.toLowerCase().includes(q) || i.listings.some(l=>l.toLowerCase().includes(q)) ||
    i.centres.some(c=>c.toLowerCase().includes(q))
  )
  renderGigs(res); if (leafMap) addMarkers(res)
}

function renderGigs(list) {
  const grid = document.getElementById('gig-grid'); if (!grid) return
  if (!list.length) { grid.innerHTML = '<div style="grid-column:1/-1;padding:40px 24px;text-align:center;color:var(--n3);font-size:13px;line-height:1.7">No instructors available yet.<br><span style="font-size:12px">Check back soon — we\'re growing our network in Manchester.</span></div>'; return }
  grid.innerHTML = list.map(ins => {
    const badge = ins.level==='Top Rated' ? '<div class="gig-badge badge-top">TOP</div>' : ins.level==='New' ? '<div class="gig-badge" style="background:var(--gl);color:#166534">NEW</div>' : ''
    return '<div class="gig-card" onclick="openInstrDetail(\'' + ins.id + '\')">'
      + '<div class="gig-thumb" style="background:linear-gradient(135deg,' + ins.col + ',' + ins.col + 'cc)">' + badge + '<span class="gig-ini">' + ins.ini + '</span></div>'
      + '<div class="gig-body"><div class="gig-avrow"><div class="gig-av" style="background:' + ins.col + '">' + ins.ini.slice(0,1) + '</div>'
      + '<span class="gig-name">' + ins.name.split(' ')[0] + '</span><span class="gig-lvl">' + ins.city + '</span></div>'
      + '<div class="gig-title">' + ins.listings.slice(0,2).join(', ') + '</div>'
      + '<div class="gig-stars">⭐ <strong style="color:var(--n)">' + ins.rating + '</strong> (' + ins.reviews + ') · ' + ins.experience + 'yr</div>'
      + '<div class="gig-price">From <strong>£' + ins.price + '/hr</strong></div></div></div>'
  }).join('')
}

// ── INSTRUCTOR DETAIL MODAL ──────────────────────────────────
async function openInstrDetail(id) {
  selectedInstructor = allInstructors.find(i => String(i.id) === String(id))
  if (!selectedInstructor) return
  const ins = selectedInstructor
  const tags = ins.listings.map(l => '<span class="ltag">' + l + '</span>').join('')
  const centreList = ins.centres?.length ? ins.centres.map(c => '<span class="ltag">' + c + '</span>').join('') : '<span style="font-size:11px;color:var(--n3)">Not specified</span>'

  // Load available slots if real instructor
  let slotsHtml = ''
  if (ins.isReal) {
    const { data: slots } = await sb.from('availability_slots')
      .select('*').eq('instructor_id', ins.id).eq('is_booked', false).eq('slot_type', 'open')
      .gte('start_time', new Date().toISOString()).order('start_time', { ascending: true }).limit(8)
    if (slots?.length) {
      slotsHtml = '<div style="margin-bottom:12px"><div style="font-size:10px;font-weight:700;color:var(--n3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Available slots</div>'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">'
        + slots.map(s => '<button onclick="selectSlot(\'' + s.id + '\',\'' + fmtDate(s.start_time) + ' ' + fmtTime(s.start_time) + '\')" id="slot-' + s.id + '" style="padding:8px;border:1.5px solid var(--bdr);border-radius:8px;background:var(--w);font-size:11px;font-weight:600;cursor:pointer;text-align:left;font-family:var(--F);transition:all .2s">'
          + '<div style="color:var(--n)">' + fmtDate(s.start_time) + '</div>'
          + '<div style="color:var(--n3);margin-top:2px">' + fmtTime(s.start_time) + ' – ' + fmtTime(s.end_time) + '</div>'
          + '</button>'
        ).join('')
        + '</div></div>'
    } else {
      slotsHtml = '<div style="background:var(--bg);border-radius:8px;padding:10px;margin-bottom:12px;font-size:12px;color:var(--n3);text-align:center;border:1px solid var(--bdr)">No open slots right now — you can still send a message to enquire</div>'
    }
  }

  document.getElementById('modal-body').innerHTML =
    '<div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:13px">'
    + '<div style="width:54px;height:54px;border-radius:50%;background:' + ins.col + ';display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:#fff;flex-shrink:0">' + ins.ini + '</div>'
    + '<div style="flex:1"><div style="font-size:17px;font-weight:800;color:var(--n)">' + ins.name + '</div>'
    + '<div style="font-size:11px;color:var(--n3);margin-top:2px">' + (ins.car||'') + ' · ' + ins.experience + ' years exp</div>'
    + '<div style="font-size:11px;color:var(--n3);margin-top:2px">📍 ' + ins.city + '</div>'
    + '<div style="font-size:11px;color:var(--n3);margin-top:2px">⭐ ' + ins.rating + ' (' + ins.reviews + ' reviews)</div></div></div>'
    + (ins.bio ? '<div style="background:var(--bg);border-radius:7px;padding:10px;margin-bottom:11px;font-size:12px;line-height:1.6;color:var(--n2);border:1px solid var(--bdr)">' + ins.bio + '</div>' : '')
    + '<div class="kpi-grid">'
    + '<div class="kpi-box"><div class="kpi-val">' + ins.passRate + '%</div><div class="kpi-lbl">Pass rate</div></div>'
    + '<div class="kpi-box"><div class="kpi-val">' + ins.lessons + '</div><div class="kpi-lbl">Lessons</div></div>'
    + '<div class="kpi-box"><div class="kpi-val">£' + ins.price + '</div><div class="kpi-lbl">Per hour</div></div>'
    + '<div class="kpi-box"><div class="kpi-val">' + ins.reviews + '</div><div class="kpi-lbl">Reviews</div></div>'
    + '</div>'
    + '<div style="margin-bottom:11px"><div style="font-size:10px;font-weight:700;color:var(--n3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Lesson types</div>' + tags + '</div>'
    + '<div style="margin-bottom:11px"><div style="font-size:10px;font-weight:700;color:var(--n3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Test centres covered</div>' + centreList + '</div>'
    + slotsHtml
    + '<div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--bdr);padding-top:11px">'
    + '<div><div style="font-size:10px;color:var(--n3);font-weight:700;text-transform:uppercase">Starting from</div><div style="font-size:19px;font-weight:800;color:var(--n)">£' + ins.price + '<span style="font-size:11px;font-weight:400;color:var(--n3)">/hr</span></div></div>'
    + '<button class="btn btn-green" style="width:auto;padding:10px 22px" onclick="handleBookRequest()">Request lesson →</button></div>'
    + '<button class="btn btn-outline" style="margin-top:8px" onclick="handleContact()">💬 Message instructor</button>'
  openModal()
}

let selectedSlotId = null, selectedSlotLabel = ''
function selectSlot(id, label) {
  selectedSlotId = id; selectedSlotLabel = label
  document.querySelectorAll('[id^="slot-"]').forEach(b => { b.style.borderColor = 'var(--bdr)'; b.style.background = 'var(--w)' })
  const el = document.getElementById('slot-' + id)
  if (el) { el.style.borderColor = 'var(--g)'; el.style.background = 'var(--gl)' }
}

async function handleBookRequest() {
  closeModal()
  const user = await getUser()
  if (!user) { openLearnerSignup('book'); return }
  const profile = await getProfile(user.id)
  if (profile?.role === 'learner') { openBookingRequest(); return }
  openLearnerSignup('book')
}

async function handleContact() {
  closeModal()
  const user = await getUser()
  if (!user) { openLearnerSignup('message'); return }

  const ins = selectedInstructor
  if (!ins?.isReal || !ins?.profileUserId) {
    toast('This is a demo instructor — sign up to message real instructors!')
    return
  }

  // Find existing conversation or create one
  let { data: existing } = await sb.from('conversations')
    .select('id')
    .eq('learner_id', user.id)
    .eq('instructor_id', ins.profileUserId)
    .maybeSingle()

  let convId = existing?.id
  if (!convId) {
    const { data: newConv, error } = await sb.from('conversations')
      .insert({ learner_id: user.id, instructor_id: ins.profileUserId })
      .select('id').single()
    if (error) { toast('Could not start conversation: ' + error.message); return }
    convId = newConv.id
  }

  if (typeof switchTab === 'function') {
    switchTab(1)
    await loadMessages()
    openChat(convId, ins.name)
  }
}

// ── BOOKING REQUEST MODAL ────────────────────────────────────
function openBookingRequest() {
  const ins = selectedInstructor
  if (!ins) return

  // Build a sensible default: next weekday at 10:00
  const d = new Date()
  d.setDate(d.getDate() + 1)
  if (d.getDay() === 0) d.setDate(d.getDate() + 1)
  if (d.getDay() === 6) d.setDate(d.getDate() + 2)
  d.setHours(10, 0, 0, 0)
  const minDt = new Date(); minDt.setDate(minDt.getDate() + 1); minDt.setHours(0,0,0,0)
  const maxDt = new Date(); maxDt.setMonth(maxDt.getMonth() + 3)
  const fmt = dt => dt.toISOString().slice(0,16)

  const slotHtml = selectedSlotId
    ? '<div style="background:var(--gl);border:1px solid rgba(29,191,115,.3);border-radius:8px;padding:10px 13px;margin-bottom:14px;font-size:13px;font-weight:600;color:#166534">📅 Selected slot: ' + selectedSlotLabel + '</div>'
    : '<div class="form-group" style="margin-bottom:14px">'
      + '<label style="font-size:11px;font-weight:700;color:var(--n3);text-transform:uppercase;letter-spacing:.5px">Preferred date &amp; time</label>'
      + '<input type="datetime-local" id="req-datetime" min="' + fmt(minDt) + '" max="' + fmt(maxDt) + '" value="' + fmt(d) + '" style="width:100%;padding:10px 12px;border:1.5px solid var(--bdr);border-radius:8px;font-size:14px;font-family:var(--F);background:var(--w);color:var(--n);box-sizing:border-box">'
      + '<div style="font-size:11px;color:var(--n3);margin-top:5px">The instructor will confirm or suggest an alternative.</div>'
      + '</div>'

  document.getElementById('learner-modal-body').innerHTML =
    '<h2 style="font-size:18px;font-weight:800;color:var(--n);margin-bottom:4px">Request a lesson</h2>'
    + '<p style="font-size:13px;color:var(--n3);margin-bottom:16px">Send a request to <strong>' + ins.name + '</strong>.</p>'
    + slotHtml
    + '<div class="form-group"><label style="font-size:11px;font-weight:700;color:var(--n3);text-transform:uppercase;letter-spacing:.5px">Short description</label>'
    + '<textarea id="req-note" placeholder="e.g. I\'m a complete beginner and available weekday mornings." style="min-height:80px;width:100%;padding:10px 12px;border:1.5px solid var(--bdr);border-radius:8px;font-size:14px;font-family:var(--F);resize:vertical;box-sizing:border-box"></textarea></div>'
    + '<button class="btn btn-green" onclick="submitBookingRequest()">Send request →</button>'
  document.getElementById('learner-modal').classList.add('open')
}

async function submitBookingRequest() {
  const note = document.getElementById('req-note')?.value.trim()
  if (!note) { toast('Please add a short description'); return }
  const user = await getUser()
  const ins = selectedInstructor
  if (!user || !ins) return

  let instrProfileId = ins.isReal ? ins.id : null
  if (!instrProfileId) { toast('This is a demo instructor — sign up to book real lessons!'); return }

  let scheduledAt
  if (selectedSlotId) {
    const { data: slot } = await sb.from('availability_slots').select('start_time').eq('id', selectedSlotId).single()
    scheduledAt = slot?.start_time
  } else {
    const dtEl = document.getElementById('req-datetime')
    scheduledAt = dtEl?.value ? new Date(dtEl.value).toISOString() : new Date(Date.now() + 7*24*60*60*1000).toISOString()
  }

  const btn = document.querySelector('#learner-modal-body .btn-green')
  if (btn) { btn.disabled = true; btn.textContent = 'Sending…' }

  const { error } = await sb.from('bookings').insert({
    learner_id: user.id,
    instructor_id: instrProfileId,
    slot_id: selectedSlotId || null,
    scheduled_at: scheduledAt,
    duration_mins: 60,
    price: ins.price || 35,
    status: 'pending',
    request_note: note,
  })

  if (error) { toast('Error: ' + error.message); if (btn) { btn.disabled = false; btn.textContent = 'Send request →' }; return }
  if (selectedSlotId) await sb.from('availability_slots').update({ is_booked: true }).eq('id', selectedSlotId)
  // Notify the instructor of the new booking request
  if (ins.profileUserId) sb.from('notifications').insert({ user_id: ins.profileUserId, type: 'new_booking', title: 'New lesson request', body: note.slice(0, 80), is_read: false })
  closeLearnerModal()
  toast('✅ Request sent! ' + ins.name.split(' ')[0] + ' will confirm shortly.')
  selectedSlotId = null; selectedSlotLabel = ''
}

// ── LEARNER SIGNUP ───────────────────────────────────────────
function openLearnerSignup(action) {
  const ins = selectedInstructor
  const name = ins?.name?.split(' ')[0] || 'this instructor'
  document.getElementById('learner-modal-body').innerHTML =
    '<h2 style="font-size:18px;font-weight:800;color:var(--n);margin-bottom:4px">' + (action==='book'?'Book with '+name:'Message '+name) + '</h2>'
    + '<p style="font-size:13px;color:var(--n3);margin-bottom:20px">Create a free learner account to continue.</p>'
    + '<form id="lr-form">'
    + '<div class="form-group"><label>Full name</label><input type="text" id="lr-name" placeholder="Your full name" required></div>'
    + '<div class="form-group"><label>Phone number</label><input type="tel" id="lr-phone" placeholder="+44 7700 000000" required></div>'
    + '<div class="form-group"><label>Email</label><input type="email" id="lr-email" placeholder="you@email.com" required></div>'
    + '<div class="form-group"><label>Password</label><input type="password" id="lr-pw" placeholder="Min 8 characters" minlength="8" required></div>'
    + '<div class="grid-2"><div class="form-group"><label>Postcode</label><input type="text" id="lr-post" placeholder="M1 1AA" required></div>'
    + '<div class="form-group"><label>Test centre</label><select id="lr-centre" required></select></div></div>'
    + '<div class="grid-2"><div class="form-group"><label>Transmission</label><select id="lr-trans" required><option value="">Select…</option><option>Manual</option><option>Automatic</option></select></div>'
    + '<div class="form-group"><label>Gender pref.</label><select id="lr-gend" required><option value="">Select…</option><option value="no_preference">No preference</option><option value="male">Male</option><option value="female">Female</option></select></div></div>'
    + '<button type="submit" class="btn btn-green" id="lr-submit">Create account &amp; continue →</button>'
    + '<div class="or-div"><span>or</span></div>'
    + '<button type="button" class="btn btn-outline" onclick="window.location.href=\'/login.html\'">I already have an account</button>'
    + '</form>'
  document.getElementById('learner-modal').classList.add('open')
  // Populate test centres
  if (window.buildTestCentreSelect) buildTestCentreSelect('lr-centre', '')
  document.getElementById('lr-form').addEventListener('submit', async e => {
    e.preventDefault()
    const btn = document.getElementById('lr-submit'); btn.disabled = true; btn.textContent = 'Creating account…'
    const lrName = document.getElementById('lr-name').value.trim()
    const lrPhone = document.getElementById('lr-phone').value.trim()
    const lrPost = document.getElementById('lr-post').value.trim()
    const { data, error } = await sb.auth.signUp({ email: document.getElementById('lr-email').value.trim(), password: document.getElementById('lr-pw').value, options: { data: { full_name: lrName, role: 'learner', phone: lrPhone, postcode: lrPost, test_centre: document.getElementById('lr-centre').value, transmission: document.getElementById('lr-trans').value, gender_pref: document.getElementById('lr-gend').value } } })
    if (error) { toast('❌ ' + error.message); btn.disabled = false; btn.textContent = 'Create account & continue →'; return }
    if (data?.user) await sb.from('profiles').upsert({ id: data.user.id, email: data.user.email, role: 'learner', full_name: lrName, phone: lrPhone, postcode: lrPost, onboarding_done: true }, { onConflict: 'id' })
    toast('✅ Account created!'); setTimeout(() => window.location.reload(), 1200)
  })
}

function closeLearnerModal() { document.getElementById('learner-modal').classList.remove('open'); selectedSlotId = null }

// ── INSTRUCTOR SIGNUP ────────────────────────────────────────
function openInstrSignup() {
  document.getElementById('instr-modal-body').innerHTML =
    '<h2 style="font-size:18px;font-weight:800;color:var(--n);margin-bottom:4px">Join as an instructor</h2>'
    + '<p style="font-size:13px;color:var(--n3);margin-bottom:8px;line-height:1.5">Submit your profile for review. No payment until approved.</p>'
    + '<div style="background:var(--bl);border:1px solid #bfdbfe;border-radius:8px;padding:10px 13px;margin-bottom:16px;font-size:12px;color:var(--bd);line-height:1.5">ℹ️ <strong>No payment needed yet.</strong> Once approved you\'ll receive an email with a payment link to activate your £40/mo subscription.</div>'
    + '<form id="ir-form">'
    + '<div class="form-group blue"><label>Full name</label><input type="text" id="ir-name" placeholder="Your full name" required></div>'
    + '<div class="form-group blue"><label>Phone number</label><input type="tel" id="ir-phone" placeholder="+44 7700 000000" required></div>'
    + '<div class="form-group blue"><label>Email</label><input type="email" id="ir-email" placeholder="you@email.com" required></div>'
    + '<div class="form-group blue"><label>Password</label><input type="password" id="ir-pw" placeholder="Min 8 characters" minlength="8" required></div>'
    + '<div class="grid-2"><div class="form-group blue"><label>Car</label><input type="text" id="ir-car" placeholder="e.g. Ford Focus" required></div>'
    + '<div class="form-group blue"><label>Transmission</label><select id="ir-trans" required><option value="">Select…</option><option>Manual</option><option>Automatic</option></select></div></div>'
    + '<div class="grid-2"><div class="form-group blue"><label>Postcode</label><input type="text" id="ir-post" placeholder="M1 1AA" required></div>'
    + '<div class="form-group blue"><label>Years experience</label><input type="number" id="ir-exp" placeholder="e.g. 5" min="0" required></div></div>'
    + '<div class="form-group blue"><label>Bio</label><textarea id="ir-bio" placeholder="Describe your teaching style and experience…" required></textarea></div>'
    + '<div class="form-group blue"><label>Test centres you cover <span style="font-size:10px;color:var(--n3);text-transform:none;font-weight:400">(search and select)</span></label>'
    + '<input type="text" id="ir-centre-search" placeholder="Type to search…" oninput="filterCentres(this.value)" style="margin-bottom:8px">'
    + '<div id="ir-centres" style="max-height:160px;overflow-y:auto;display:flex;flex-wrap:wrap;gap:5px;padding:8px;border:1.5px solid var(--bdr);border-radius:8px;background:var(--bg)"></div></div>'
    + '<div class="form-group blue"><label>Lesson types you offer</label>'
    + '<div class="chip-group" id="ir-chips">' + ['Standard Lessons','Crash Course','Intensive','One-Off','Test Bundle','Pass+','Automatic Only','Nervous Learners','Evenings'].map(l=>'<div class="chip" onclick="this.classList.toggle(\'on\')">' + l + '</div>').join('') + '</div></div>'
    + '<button type="submit" class="btn btn-blue" id="ir-submit">Submit for approval →</button>'
    + '</form>'
  document.getElementById('instr-modal').classList.add('open')
  // Build test centres
  if (window.UK_TEST_CENTRES) buildInstrCentres('')
  document.getElementById('ir-form').addEventListener('submit', async e => {
    e.preventDefault()
    const btn = document.getElementById('ir-submit'); btn.disabled = true; btn.textContent = 'Submitting…'
    const listings = [...document.querySelectorAll('#ir-chips .chip.on')].map(c => c.textContent)
    const centres = getSelectedCentres('ir-centres')
    const irName = document.getElementById('ir-name').value.trim()
    const irPhone = document.getElementById('ir-phone').value.trim()
    const irPost = document.getElementById('ir-post').value.trim()
    const irCar = document.getElementById('ir-car').value.trim()
    const irTrans = document.getElementById('ir-trans').value
    const irExp = document.getElementById('ir-exp').value
    const irBio = document.getElementById('ir-bio').value.trim()
    const { data, error } = await sb.auth.signUp({ email: document.getElementById('ir-email').value.trim(), password: document.getElementById('ir-pw').value, options: { data: { full_name: irName, role: 'instructor', phone: irPhone, postcode: irPost, car: irCar, car_trans: irTrans, experience: irExp, bio: irBio, listings, test_centres: centres, pending_approval: true } } })
    if (error) { toast('❌ ' + error.message); btn.disabled = false; btn.textContent = 'Submit for approval →'; return }
    if (data?.user) {
      await sb.from('profiles').upsert({ id: data.user.id, email: data.user.email, role: 'instructor', full_name: irName, phone: irPhone, postcode: irPost, onboarding_done: true }, { onConflict: 'id' })
      await sb.from('instructor_profiles').upsert({ user_id: data.user.id, car_make_model: irCar, transmission: irTrans, years_experience: parseInt(irExp)||0, bio: irBio, test_centre: centres[0]||'', subscription_status: 'inactive', is_accepting_students: false }, { onConflict: 'user_id' })
    }
    document.getElementById('instr-modal-body').innerHTML = '<div style="text-align:center;padding:24px 0"><div style="font-size:44px;margin-bottom:14px">🎉</div><h3 style="font-size:18px;font-weight:800;color:var(--n);margin-bottom:8px">Application submitted!</h3><p style="font-size:13px;color:var(--n3);line-height:1.6;max-width:280px;margin:0 auto 20px">We\'ll review your profile within 24 hours. Once approved you\'ll receive an email with your payment link.</p><button class="btn btn-blue" style="width:auto;padding:10px 24px" onclick="closeInstrModal()">Got it</button></div>'
  })
}

function buildInstrCentres(filter) {
  const wrap = document.getElementById('ir-centres'); if (!wrap) return
  const existing = [...wrap.querySelectorAll('.chip.on')].map(c => c.textContent)
  const list = UK_TEST_CENTRES.filter(c => !filter || c.toLowerCase().includes(filter.toLowerCase()))
  wrap.innerHTML = list.map(c => '<div class="chip' + (existing.includes(c)?' on':'') + '" onclick="this.classList.toggle(\'on\')">' + c + '</div>').join('')
}

function filterCentres(val) { buildInstrCentres(val) }

function closeInstrModal() { document.getElementById('instr-modal').classList.remove('open') }
