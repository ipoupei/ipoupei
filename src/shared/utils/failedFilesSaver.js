// src/utils/failedFilesSaver.js
// Super simples - salva arquivo que falhou, transparente para usuário

import { supabase } from '@lib/supabaseClient';

/**
 * Salva arquivo que falhou - funciona em background, usuário nem vê
 */
export const saveFailedFile = async (file, errorMessage) => {
  try {
    // 1. Upload do arquivo
    const fileName = `${Date.now()}_${file.name}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('failed-imports')
      .upload(fileName, file);
    
    if (uploadError) {
      console.warn('❌ Erro no upload (silencioso):', uploadError.message);
      return;
    }
    
    // 2. Pegar email do usuário
    const { data: { user } } = await supabase.auth.getUser();
    
    // 3. Registrar no banco
    const { error: dbError } = await supabase
      .from('failed_files')
      .insert([{
        file_name: file.name,
        file_path: uploadData.path,
        file_size: file.size,
        file_type: file.type,
        error_message: errorMessage,
        user_email: user?.email || 'unknown',
        user_id: user?.id
      }]);
    
    if (dbError) {
      console.warn('❌ Erro no banco (silencioso):', dbError.message);
      return;
    }
    
    console.log('✅ Arquivo salvo para análise:', file.name);
    
  } catch (error) {
    // Falha completamente silenciosa - não afeta usuário
    console.warn('❌ Erro ao salvar arquivo (silencioso):', error.message);
  }
};