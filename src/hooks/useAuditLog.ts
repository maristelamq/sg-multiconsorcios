import { supabase } from '@/integrations/supabase/client';

type AuditAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';

interface AuditLogParams {
  action: AuditAction;
  tableName: string;
  recordId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
}

export function useAuditLog() {
  const logAction = async ({ action, tableName, recordId, oldData, newData }: AuditLogParams) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      await supabase.from('audit_logs').insert([{
        user_id: user.id,
        user_email: user.email,
        action,
        table_name: tableName,
        record_id: recordId,
        old_data: oldData as any || null,
        new_data: newData as any || null,
      }]);
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  };

  return { logAction };
}
