import React, { useState } from 'react';
import {
  X,
  Mail,
  Send,
  Clock,
  CheckCircle,
  Eye,
  AlertTriangle,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useTaskFlow } from '../../context/TaskFlowContext';

export const EmailModal: React.FC = () => {
  const {
    closeModal,
    emailConfig,
    updateEmailConfig,
    emailLogs,
    triggerDailyDigestNow,
  } = useTaskFlow();

  const [activeTab, setActiveTab] = useState<'preview' | 'settings' | 'history'>('preview');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  // Target Email state
  const [targetEmail, setTargetEmail] = useState(emailConfig.targetEmail);
  const [dailyDigestTime, setDailyDigestTime] = useState(emailConfig.dailyDigestTime);
  const [eventReminderMinutes, setEventReminderMinutes] = useState(emailConfig.eventReminderMinutes);
  const [sendOnBlocked, setSendOnBlocked] = useState(emailConfig.sendOnBlocked);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmailConfig({
      targetEmail: targetEmail.trim(),
      dailyDigestTime,
      eventReminderMinutes: Number(eventReminderMinutes),
      sendOnBlocked,
    });
    alert('Configurações de notificação salvas com sucesso!');
  };

  const handleTriggerNow = () => {
    const log = triggerDailyDigestNow();
    setSelectedLogId(log.id);
    setActiveTab('preview');
  };

  const currentPreviewLog = selectedLogId
    ? emailLogs.find((l) => l.id === selectedLogId)
    : emailLogs[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#30363d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Mail className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white">Central de Notificações por E-mail</h2>
              <p className="text-xs text-gray-400">
                Resumo matinal diário (ontem vs hoje) e avisos 30 minutos antes para eventos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerNow}
              className="tf-btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 font-semibold"
              title="Gera e dispara o briefing de hoje imediatamente"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Disparar Resumo Agora</span>
            </button>

            <button
              onClick={closeModal}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#21262d]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#30363d] px-6 bg-[#0d1117]/50 text-xs font-medium space-x-4">
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'preview'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Visualização do E-mail HTML</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configurações & Gatilhos</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Histórico ({emailLogs.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs">
          {/* TAB 1: PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              {currentPreviewLog ? (
                <div>
                  <div className="mb-3 p-3 bg-[#0d1117] rounded-lg border border-[#30363d] flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">
                        Assunto do E-mail:
                      </span>
                      <span className="text-sm font-semibold text-white">
                        {currentPreviewLog.subject}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block">
                        Para: <strong>{currentPreviewLog.recipient}</strong>
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">
                        Status: {currentPreviewLog.status} às {currentPreviewLog.sentAt}
                      </span>
                    </div>
                  </div>

                  {/* Rendered HTML inside an iframe sandbox or HTML wrapper */}
                  <div className="border border-[#30363d] rounded-xl overflow-hidden bg-white shadow-inner">
                    <iframe
                      title="Email Preview"
                      srcDoc={currentPreviewLog.contentHtml}
                      className="w-full h-[480px] border-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-gray-400 bg-[#0d1117] rounded-xl border border-[#30363d] space-y-3">
                  <Mail className="w-10 h-10 text-gray-600 mx-auto" />
                  <p className="text-sm font-medium text-gray-300">
                    Nenhum resumo gerado ainda.
                  </p>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Clique no botão abaixo para gerar o primeiro resumo diário com os dados reais de ontem e de hoje!
                  </p>
                  <button
                    onClick={handleTriggerNow}
                    className="tf-btn-primary text-xs py-2 px-4"
                  >
                    Gerar e Visualizar Resumo Matinal
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="max-w-xl mx-auto space-y-5">
              <div className="p-4 bg-[#0d1117] rounded-xl border border-[#30363d] space-y-4">
                <h3 className="font-semibold text-sm text-white">Destinatário & Horários</h3>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    E-mail do Usuário para Recebimento
                  </label>
                  <input
                    type="email"
                    required
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    className="tf-input w-full py-2 font-mono"
                  />
                  <span className="text-[11px] text-gray-500 mt-1 block">
                    Todos os resumos e lembretes serão enviados para este endereço.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Horário do Resumo Matinal
                    </label>
                    <input
                      type="time"
                      value={dailyDigestTime}
                      onChange={(e) => setDailyDigestTime(e.target.value)}
                      className="tf-input w-full py-1.5 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Aviso Prévio de Eventos
                    </label>
                    <select
                      value={eventReminderMinutes}
                      onChange={(e) => setEventReminderMinutes(Number(e.target.value))}
                      className="tf-input w-full py-1.5"
                    >
                      <option value={15}>15 minutos antes</option>
                      <option value={30}>30 minutos antes (Padrão)</option>
                      <option value={60}>1 hora antes</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#0d1117] rounded-xl border border-[#30363d] space-y-3">
                <h3 className="font-semibold text-sm text-white">Gatilhos Ativos</h3>

                <label className="flex items-center gap-3 p-2 rounded hover:bg-[#161b22] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendOnBlocked}
                    onChange={(e) => setSendOnBlocked(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-500"
                  />
                  <div>
                    <span className="font-semibold text-gray-200 block">
                      Alerta quando uma tarefa for marcada como "Bloqueado"
                    </span>
                    <span className="text-gray-500 text-[11px]">
                      Envia um alerta imediato com o motivo do impedimento.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <button type="submit" className="tf-btn-primary px-5 py-2 font-semibold">
                  Salvar Preferências
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-2">
              {emailLogs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => {
                    setSelectedLogId(log.id);
                    setActiveTab('preview');
                  }}
                  className="p-3 bg-[#0d1117] border border-[#30363d] rounded-xl flex items-center justify-between hover:border-blue-500/50 cursor-pointer transition-all"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                        {log.type}
                      </span>
                      <h4 className="font-semibold text-gray-200">{log.subject}</h4>
                    </div>
                    <p className="text-xs text-gray-500">{log.summary}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs text-gray-400 block font-mono">{log.sentAt}</span>
                    <span className="text-[10px] text-emerald-400 uppercase font-semibold">
                      {log.status}
                    </span>
                  </div>
                </div>
              ))}

              {emailLogs.length === 0 && (
                <div className="py-12 text-center text-gray-500">
                  Nenhuma notificação enviada no histórico.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
