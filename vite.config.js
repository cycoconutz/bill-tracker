import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Deploying to https://<USERNAME>.github.io/bill-tracker/ -> base '/bill-tracker/'
// If you rename the repo, update this to '/<REPO>/'.
// For a user-site repo (<USERNAME>.github.io) use '/'.
export default defineConfig({
  plugins: [react()],
  base: '/bill-tracker/',
})
