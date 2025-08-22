-- Criar tabela de usuários
CREATE TABLE usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  senha TEXT NOT NULL,
  nome TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  ativo BOOLEAN DEFAULT 1,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índice para email
CREATE INDEX idx_usuarios_email ON usuarios(email);

-- Criar índice para role
CREATE INDEX idx_usuarios_role ON usuarios(role);