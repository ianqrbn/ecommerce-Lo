# Usa uma imagem leve do Node.js
FROM node:22-alpine

# Define a pasta de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de dependências primeiro (para aproveitar o cache)
COPY package.json package-lock.json ./

# Instala as dependências
RUN npm install

# Copia todo o resto do código para dentro do container
COPY . .

# Expõe a porta padrão do Vite
EXPOSE 5173

# Comando para iniciar o projeto
# O "--host" é OBRIGATÓRIO para o Windows conseguir acessar o container
CMD ["npm", "run", "dev", "--", "--host"]