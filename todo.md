# Studio Milca Lopes Fotografia - TODO

## Configuração Inicial
- [x] Configurar schema do banco de dados (clientes, ensaios, fotos, pedidos, itens do pedido)
- [x] Configurar constantes da aplicação (logo, informações da empresa)
- [x] Configurar tema e cores da aplicação

## Landing Page Pública
- [x] Criar página inicial com apresentação do studio
- [x] Adicionar seção "Sobre" com informações da empresa
- [x] Adicionar portfólio com trabalhos do fotógrafo
- [x] Adicionar seção de contato
- [x] Criar footer com endereço e créditos de desenvolvimento
- [x] Adicionar navegação responsiva

## Sistema de Autenticação
- [x] Implementar login de clientes
- [x] Criar página de perfil do cliente
- [x] Implementar logout

## Área do Cliente
- [x] Criar dashboard do cliente
- [x] Listar ensaios disponíveis para o cliente
- [x] Visualizar fotos do ensaio com marca d'água
- [x] Proteção contra download e print screen
- [x] Numeração e ordenação de fotos conforme nome do arquivo

## Carrinho de Compras (Álbum de Fotos)
- [x] Adicionar fotos ao carrinho
- [x] Remover fotos do carrinho
- [x] Escolher formato: somente digital ou digital + revelada
- [x] Selecionar tamanho de foto revelada (10×15, 15×21, 20×25, 20×30 cm)
- [x] Visualizar resumo do carrinho
- [x] Calcular preços

## Sistema de Checkout
- [x] Formulário de endereço de entrega
- [x] Opção de retirada no studio ou entrega em casa
- [x] Integração com pagamento PIX
- [x] Integração com pagamento crédito/débito
- [x] Parcelamento em até 4 vezes no crédito
- [ ] Emitir comprovante de compra
- [ ] Enviar comprovante por email

## Workflow de Pedidos
- [x] Status: Aguardando confirmação do pagamento
- [x] Status: Pagamento aprovado
- [x] Status: Enviado para edição
- [x] Status: Edição pronta
- [x] Status: Enviada para revelação
- [x] Status: Revelação pronta
- [x] Status: Disponível para retirada / Saiu para entrega
- [x] Página de acompanhamento de pedido para o cliente

## Painel ERP do Fotógrafo
- [x] Dashboard administrativo
- [ ] Cadastro de clientes
- [ ] Gerar senha inicial para cliente
- [ ] Gerenciar ensaios fotográficos
- [ ] Adicionar URL do Google Drive com fotos do ensaio
- [ ] Sistema de renderização de fotos do Google Drive
- [x] Gerenciar pedidos
- [x] Atualizar status de pedidos
- [x] Visualizar histórico de pedidos
- [ ] Gerenciar portfólio da landing page
- [ ] Logs de acesso dos clientes

## Integração Google Drive
- [ ] Implementar função para buscar fotos do Google Drive via URL
- [ ] Renderizar fotos na galeria do cliente
- [ ] Aplicar marca d'água automaticamente
- [ ] Cachear fotos para performance

## Funcionalidades de Segurança
- [ ] Proteção de direitos autorais (marca d'água)
- [ ] Desabilitar botão direito do mouse nas fotos
- [ ] Desabilitar atalhos de teclado para print screen
- [ ] Proteção contra download de imagens

## Novas Funcionalidades Solicitadas

### Integração Google Drive Completa
- [x] Criar página administrativa para cadastrar novos ensaios
- [x] Implementar campo para adicionar URL do Google Drive
- [x] Criar função para extrair ID da pasta do Google Drive
- [x] Implementar sincronização automática de fotos do Google Drive
- [x] Criar sistema de cache de fotos sincronizadas
- [x] Aplicar marca d'água automaticamente nas fotos sincronizadas
- [ ] Testar sincronização com diferentes formatos de URL do Drive

### Gateway de Pagamento (Mercado Pago)
- [x] Pesquisar e configurar API de pagamento (Mercado Pago escolhido)
- [x] Implementar geração de QR Code PIX
- [x] Implementar processamento de pagamento com cartão
- [x] Criar webhook para confirmação de pagamento
- [x] Atualizar status do pedido automaticamente após confirmação
- [ ] Enviar comprovante de pagamento por email
- [ ] Testar fluxo completo de pagamento com credenciais reais

### Login Social com Vinculação Segura
- [x] Implementar autenticação com Google OAuth (via Manus OAuth)
- [x] Implementar autenticação com Facebook OAuth (via Manus OAuth)
- [x] Criar tabela de vinculação entre contas sociais e clientes
- [x] Implementar fluxo de vinculação: cliente cadastrado pelo fotógrafo recebe código/link
- [x] Criar página de vinculação de conta social
- [x] Validar que apenas clientes cadastrados podem vincular contas
- [x] Implementar verificação de segurança (email matching, código de verificação)
- [x] Criar dashboard para fotógrafo gerenciar vinculações
- [ ] Testar fluxo completo de login social e vinculação
