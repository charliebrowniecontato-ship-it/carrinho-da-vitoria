# Gestão Carrinho da Vitória

Painel `/gestao`, integrado ao catálogo da vitrine e ao Telegram. A loja e a gestão receberam refinamento de UX/UI com os recursos oficiais da marca. O catálogo inicial contém os mesmos 26 produtos, marcados como importados para não inventar um histórico de novos cadastros.

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

## Publicação e ativação

As variáveis abaixo foram configuradas como protegidas no projeto Vercel `prj_grpIMRZGeGA6gai1vLcECIkJU6kj`, conta `charliebrowniecontato-7772`:

- `CV_SUPABASE_URL`: URL pública do banco.
- `CV_SUPABASE_KEY`: chave publicável do projeto, usada somente no servidor deste app.
- `CV_GATE_SECRET`: segredo aleatório exclusivo deste painel. O banco guarda somente seu SHA-256 em `cv.settings`. Não é uma chave de uma conta externa.

O painel foi publicado em `https://carrinhodavitoria.setyourday.com.br/gestao` em 10 de outubro de 2026, após autorização explícita do proprietário. O catálogo público responde com os 26 produtos originais. Arquivos privados, schema, chaves e código Android ficam fora do envio da aplicação à Vercel.

O ambiente existente possui `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID`. Opcionalmente, `TELEGRAM_CHAT_IDS` e `TELEGRAM_COUPON_CHAT_IDS` aceitam destinos adicionais, separados por vírgula. Nenhum disparo real foi feito durante os testes.

O administrador `charliebrowniecontato@gmail.com` foi reservado para Filipe Fortunato, sem senha definida. O convite inicial está vinculado somente a essa conta. Depois do lançamento, o titular escolhe a própria senha por um link de uso único. Links para os demais membros são gerados dentro do painel; nenhuma mensagem de convite é enviada automaticamente.

O APK Carrinho Gestão 1.0.1 para Android 8+ foi compilado com o ícone oficial e a personagem Vitória. Assinatura v2/v3 e alinhamento verificados. Código em `android/`; chave privada fora do repositório. Acesso no APK depende da mesma ativação e publicação do site.

## Validação

`npm test`: sete testes de URLs permitidas, sessão/origem, campos opcionais, metadados, métricas sem IP original, destinos e envios incertos.

`tests/database.sql`: valida ativação, login com senha, permissões, rascunhos, publicação, fila, concorrência, deduplicação de cliques, pausa e revogação em uma transação revertida. O administrador de teste é separado do titular e nenhuma conta de teste permanece no banco. Não executar se os identificadores de QA já existirem ou houver operações concorrentes sobre eles.

Verificações em produção: login HTTP 200, catálogo HTTP 200 com 26 produtos, sessão ausente e senha inválida HTTP 401, origem externa bloqueada com HTTP 403, scripts públicos disponíveis e arquivos privados HTTP 404. Administrador reservado sem senha, zero contas de QA e zero disparos reais. O titular deve concluir o primeiro acesso pelo link individual e definir a própria senha. Não houve teste visual em navegador nem instalação em um celular físico.

`api/integracao.js` verifica acesso do bot aos destinos sem publicar mensagens. Exige a chave de sincronização existente e não retorna credenciais.

## Refinamento da loja e gestão

Recursos oficiais da marca servidos pelo próprio site em WebP (logo, carrinho e imagem principal). Busca da loja com normalização de acentos, filtro de parceiro e ordenação; todos os produtos abrem detalhes e até cinco fotos antes de seguir ao afiliado. Convite do Telegram compacto, atalhos e carrossel com pausa e respeito à redução de movimento.

Gestão com ícones SVG locais, textos mais legíveis, cartões de produtos no celular, menu com foco e fundo, etapas do cadastro, foto de capa, prévia móvel e envio ao Telegram visível. Escape e saída avisam sobre alterações não salvas. O gráfico apresenta estado vazio quando não há cliques. Atualização periódica evita redesenhar a interface quando os dados não mudam.

APK 1.0.1 / versionCode 2 mantém pacote e assinatura, com ícones de navegação, estado selecionado e arte oficial atualizada. Não houve teste em aparelho físico nem verificação visual em navegador nesta sessão.

Refinamento validado em DOM sem navegador: filtros da loja e da gestão, galeria, menu móvel, estado vazio, proteção de alterações e salvamento de rascunho. Publicação do refinamento pendente: computador autorizado sem resposta e conexão Vercel com HTTP 403. APK 1.0.1 pronto e salvo.
