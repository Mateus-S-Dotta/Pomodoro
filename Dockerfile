# Imagem oficial mantida pelo time do electron-builder.
# Já vem com Node.js (LTS 22) + npm + Wine, necessário para o electron-builder
# conseguir gerar um instalador Windows (.exe / NSIS) a partir de um host Linux.
# https://github.com/electron-userland/electron-builder/tree/master/docker
FROM electronuserland/builder:22-wine

WORKDIR /project

# Copia primeiro só os manifests para aproveitar o cache de camadas do Docker:
# "npm ci" só roda de novo se package.json / package-lock.json mudarem,
# tornando rebuilds subsequentes (após só editar código) muito mais rápidos.
COPY package.json package-lock.json ./
RUN npm ci

# Agora copia o restante do código-fonte da aplicação
COPY . .

# Comando padrão executado quando o container roda (não durante "docker compose build"):
# 1) tsc -b && vite build   -> gera o bundle web em ./dist
# 2) electron-builder --win -> empacota o app Electron + instalador NSIS (.exe)
#    dentro de ./release (ver script "dist:win" no package.json)
CMD ["npm", "run", "dist:win"]
