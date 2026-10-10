# Gestão Carrinho da Vitória

Painel `/gestao`, integrado ao catálogo da vitrine e ao Telegram. O layout público da loja foi preservado. O catálogo inicial contém os mesmos 26 produtos, marcados como importados para não inventar um histórico de novos cadastros.

## Funcionalidades

- Login e sessão protegida de 12 horas. Ativação por link individual de uso único; o usuário escolhe a própria senha.
- Administrador, editor, colaborador (seus próprios rascunhos) e leitor.
- Produtos e cupons; até cinco fotos, otimizadas no navegador. Preço opcional.
- Publicar, guardar rascunho e pausar; filtros por parceiro, marca, status e período.
- Metadados públicos de Shopee, Amazon, Magalu e Mercado Livre quando disponíveis, com preenchimento manual preservado. Não é uma integração oficial de vendas.
- Fila durável de envio ao Telegram, com histórico, falhas e tentativas explícitas. Edição de produto já publicado não envia novamente. Envios com resultado incerto exigem conferir o grupo.
- Cliques por produto/cupom, parceiro, origem e período; ranking e CSV. Sem estimativas de venda ou comissão. Deduplicação de 30 segundos e exclusão de robôs conhecidos. Contagem geral de carregamentos, não visitantes únicos.
- Painel e loja buscam atualizações a cada 30 segundos enquanto a página está visível.

## Infraestrutura

Node.js 24 em Vercel; HTML/CSS/JS sem dependências. `npm run build` copia somente arquivos públicos para `public/`, impedindo exposição de arquivos internos. APIs em `api/`.

Banco do projeto Supabase `wolzhvptnlovaltegujl`, schema privado `cv`. Tabelas sem acesso direto de `anon` e `authenticated`, com RLS e uma RPC restrita por segredo de servidor e sessão atual do membro. As credenciais de Supabase Auth e os dados de outros sistemas não são usados para autenticar este painel.

Fotos comprimidas, até 270 KB cada, são guardadas no banco e servidas pela API com verificação de acesso. Esta escolha evita exigir mais um serviço; se o catálogo crescer muito, migrar as fotos para armazenamento de objetos.

## Ativação pendente

As variáveis abaixo precisam ser configuradas no projeto Vercel `prj_grpIMRZGeGA6gai1vLcECIkJU6kj`, conta `charliebrowniecontato-7772`, antes de lançar esta versão em produção:

- `CV_SUPABASE_URL`: URL pública do banco.
- `CV_SUPABASE_KEY`: chave publicável do projeto, usada somente no servidor deste app.
- `CV_GATE_SECRET`: segredo aleatório exclusivo deste painel. O banco guarda somente seu SHA-256 em `cv.settings`. Não é uma chave de uma conta externa.

O catálogo e o schema foram preparados; a configuração das variáveis e a publicação real foram bloqueadas pela revisão automática. Não lançar esta versão em produção enquanto a configuração não estiver concluída.

O ambiente existente possui `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID`. Opcionalmente, `TELEGRAM_CHAT_IDS` e `TELEGRAM_COUPON_CHAT_IDS` aceitam destinos adicionais, separados por vírgula. Nenhum disparo real foi feito durante os testes.

Um token de ativação inicial foi gerado fora do repositório. Após o lançamento, a ativação permite criar o primeiro administrador. Links para os demais membros são gerados dentro do painel; nenhuma mensagem de convite é enviada automaticamente.

## Validação

`npm test`: sete testes de URLs permitidas, sessão/origem, campos opcionais, metadados, métricas sem IP original, destinos e envios incertos.

`tests/database.sql`: valida acesso, publicação e fila dentro de uma transação revertida. Foi executado com sucesso antes da criação do primeiro administrador real. Não executar o teste de ativação inicial em um banco que já tenha administrador; use um banco de teste.

Verificações feitas: 26 produtos publicados preservados; zero membros reais e zero disparos reais após os testes. Não há verificação em produção desta versão até a ativação das variáveis.
