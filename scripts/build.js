// Copies web files into the www/ directory that Capacitor reads
const fs   = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const dest = path.resolve(root, 'www')

fs.rmSync(dest, { recursive: true, force: true })
fs.mkdirSync(dest, { recursive: true })

const items = [
  'css', 'js',
  'index.html', 'admin.html', 'auth-callback.html',
  'instructor.html', 'learner.html', 'login.html', 'register.html',
]

function copy(from, to) {
  if (fs.statSync(from).isDirectory()) {
    fs.mkdirSync(to, { recursive: true })
    fs.readdirSync(from).forEach(f => copy(path.join(from, f), path.join(to, f)))
  } else {
    fs.copyFileSync(from, to)
  }
}

items.forEach(item => {
  const from = path.join(root, item)
  if (fs.existsSync(from)) { copy(from, path.join(dest, item)); console.log('✓', item) }
})

console.log('\n✅ Build complete → www/')
