-- Criar tabela de arquivos
CREATE TABLE arquivos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  url TEXT NOT NULL,
  tipo TEXT NOT NULL,
  tamanho INTEGER NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índice para tipo de arquivo
CREATE INDEX idx_arquivos_tipo ON arquivos(tipo);

-- Criar índice para data de criação
CREATE INDEX idx_arquivos_criado_em ON arquivos(criado_em);