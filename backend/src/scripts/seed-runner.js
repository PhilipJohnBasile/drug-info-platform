const { spawn } = require('child_process')
const path = require('path')

// Simple script to run the TypeScript seed file
const seedScript = path.join(__dirname, 'seed.ts')

console.log('🌱 Starting database seeding...')
console.log('This may take a few minutes as AI enhancement is performed for each drug.')

const tsNodeProcess = spawn('npx', ['ts-node', seedScript], {
  stdio: 'inherit',
  env: { ...process.env }
})

tsNodeProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Database seeding completed successfully!')
    console.log('You can now visit http://localhost:3000 to see the demo drug pages.')
  } else {
    console.error('\n❌ Database seeding failed with code:', code)
    process.exit(code)
  }
})

tsNodeProcess.on('error', (error) => {
  console.error('Failed to start seeding process:', error)
  process.exit(1)
})