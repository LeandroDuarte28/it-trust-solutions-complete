-- ====================================================================
-- MIGRAÇÃO: Adiciona campo status e configuração de cron diário
-- Projeto: IT Trust Solutions
-- ====================================================================

-- 1. Adicionar campo Status na tabela orcamentos (Pendente / Respondido)
ALTER TABLE IF EXISTS orcamentos 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pendente';

-- Adicionar constraint de validação para permitir apenas os valores permitidos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_orcamentos_status'
    ) THEN
        ALTER TABLE orcamentos 
        ADD CONSTRAINT check_orcamentos_status 
        CHECK (status IN ('Pendente', 'Respondido'));
    END IF;
END $$;

-- Atualizar registros existentes sem status para 'Pendente'
UPDATE orcamentos 
SET status = 'Pendente' 
WHERE status IS NULL;

-- Criar índice para otimizar consultas por status
CREATE INDEX IF NOT EXISTS idx_orcamentos_status ON orcamentos(status);

-- ====================================================================
-- 2. Configuração do Agendamento Diário (pg_cron + pg_net) no Supabase
-- Executa todos os dias às 08:00 BRT (11:00 UTC)
-- ====================================================================

-- Habilitar extensões necessárias no Supabase
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remover job anterior se existir para evitar duplicidade
SELECT cron.unschedule(jobid) 
FROM cron.job 
WHERE jobname = 'daily-status-report';

-- Criar o agendamento para as 08:00 (Horário de Brasília = 11:00 UTC)
-- Substitua YOUR_ANON_KEY ou SERVICE_ROLE_KEY pela chave do seu projeto
SELECT cron.schedule(
  'daily-status-report',
  '0 11 * * *',
  $$
  SELECT net.http_post(
    url := 'https://kcyxgolqpxyxalxoxvwp.supabase.co/functions/v1/daily-status-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'recipient', 'tecnologia.duarte@gmail.com'
    )
  ) AS request_id;
  $$
);
