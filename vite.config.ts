import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Necessário para o Electron carregar os arquivos via file://
  // Sem isso, os assets gerados usam caminhos absolutos (/assets/...)
  // que não resolvem fora de um servidor HTTP.
  base: './',
  plugins: [react()],
})
