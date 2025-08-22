CREATE TABLE pedidos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente TEXT NOT NULL,
  tamanho TEXT NOT NULL,
  complemento TEXT,
  preco REAL NOT NULL,
  status TEXT DEFAULT 'pendente',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índice para status
CREATE INDEX idx_pedidos_status ON pedidos(status);

-- Criar índice para data de criação
CREATE INDEX idx_pedidos_criado_em ON pedidos(criado_em);



