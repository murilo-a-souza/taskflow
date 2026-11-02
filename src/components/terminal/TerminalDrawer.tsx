import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Trash2,
  Copy,
  Check,
  Send,
  HelpCircle,
  Code2,
} from 'lucide-react';
import { useTaskFlow } from '../../context/TaskFlowContext';

export const TerminalDrawer: React.FC = () => {
  const { isCliOpen, setIsCliOpen, toggleCli, cliOutputs, runCliCommand, clearCli } = useTaskFlow();

  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isMaximized, setIsMaximized] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new output
  useEffect(() => {
    if (isCliOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [cliOutputs, isCliOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isCliOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCliOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    // Add to history
    setHistory((prev) => [cmd, ...prev]);
    setHistoryIndex(-1);
    setInputVal('');

    runCliCommand(cmd);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0 && historyIndex < history.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setInputVal(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInputVal(history[nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputVal('');
      }
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickCommands = [
    { label: 'help', cmd: 'help' },
    { label: 'task list --json', cmd: 'task list --json' },
    { label: 'task list --today', cmd: 'task list --today' },
    { label: 'goal list', cmd: 'goal list' },
    { label: 'epic list', cmd: 'epic list' },
    { label: 'email digest', cmd: 'email digest' },
    { label: 'task find "banco"', cmd: 'task find "banco"' },
  ];

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 bg-[#0d1117] border-t border-[#30363d] shadow-2xl transition-all duration-200 flex flex-col ${
        !isCliOpen
          ? 'h-9 translate-y-0'
          : isMaximized
          ? 'h-[80vh]'
          : 'h-[360px]'
      }`}
    >
      {/* Terminal Title Bar */}
      <div
        onClick={toggleCli}
        className="h-9 px-4 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between cursor-pointer select-none text-xs"
      >
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-emerald-400" />
          <span className="font-mono font-semibold text-gray-200">TaskFlow CLI Engine</span>
          <span className="text-[10px] text-gray-400 hidden sm:inline font-mono">
            (Pressione Ctrl + ~ para alternar)
          </span>
          <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
            pronto para IA & automação
          </span>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {isCliOpen && (
            <>
              {/* Quick Pills */}
              <div className="hidden md:flex items-center gap-1 mr-2">
                {quickCommands.slice(0, 4).map((q) => (
                  <button
                    key={q.cmd}
                    onClick={() => {
                      setInputVal(q.cmd);
                      inputRef.current?.focus();
                    }}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0d1117] text-gray-400 hover:text-white border border-[#30363d]"
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              <button
                onClick={clearCli}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#21262d]"
                title="Limpar tela (clear)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsMaximized((prev) => !prev)}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#21262d]"
                title={isMaximized ? 'Restaurar tamanho' : 'Maximizar'}
              >
                {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </>
          )}

          <button
            onClick={toggleCli}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#21262d]"
            title={isCliOpen ? 'Colapsar terminal' : 'Expandir terminal'}
          >
            {isCliOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      {isCliOpen && (
        <div className="flex-1 flex flex-col min-h-0 bg-[#0d1117] font-mono text-xs">
          {/* Output log */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono">
            {cliOutputs.map((item) => (
              <div key={item.id} className="space-y-1">
                {/* Command row */}
                <div className="flex items-center justify-between text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">taskflow&gt;</span>
                    <span className="text-white font-medium">{item.command}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-600">{item.timestamp}</span>
                    <button
                      onClick={() => copyToClipboard(item.output, item.id)}
                      className="text-gray-500 hover:text-gray-300 p-0.5 rounded"
                      title="Copiar saída (ótimo para JSON)"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Output text / JSON */}
                <pre
                  className={`p-2.5 rounded-lg border overflow-x-auto whitespace-pre-wrap leading-relaxed ${
                    item.isError
                      ? 'bg-red-950/30 border-red-500/30 text-red-300'
                      : item.isJson
                      ? 'bg-[#161b22] border-blue-500/30 text-blue-300 font-mono text-[11px]'
                      : 'bg-[#161b22]/70 border-[#30363d] text-gray-300'
                  }`}
                >
                  {item.output}
                </pre>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Quick command bar */}
          <div className="px-4 py-1.5 bg-[#161b22] border-t border-[#30363d] flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <span className="text-gray-500 font-medium text-[10px] uppercase shrink-0">
              Sugestões:
            </span>
            {quickCommands.map((q) => (
              <button
                key={q.cmd}
                onClick={() => {
                  setInputVal(q.cmd);
                  inputRef.current?.focus();
                }}
                className="px-2 py-0.5 rounded bg-[#0d1117] text-gray-400 hover:text-white border border-[#30363d] whitespace-nowrap transition-colors"
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Prompt Input */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-[#0d1117] border-t border-[#30363d] flex items-center gap-2"
          >
            <span className="text-emerald-400 font-bold shrink-0 text-sm">taskflow&gt;</span>
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite um comando (ex: task create --title='Revisar PR' --priority=alta) ou 'help'..."
              className="flex-1 bg-transparent text-white text-xs outline-none font-mono placeholder:text-gray-600"
            />
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded text-xs font-semibold flex items-center gap-1 transition-all"
            >
              <span>Executar</span>
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
