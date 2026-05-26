import React, { useState, useEffect } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { formatCurrency, cn } from "../lib/utils";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Clock,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Check,
  Sparkles,
  Filter,
  Info,
  Tag,
  Briefcase,
  HelpCircle,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AgendaEvent {
  id: string;
  title: string;
  description: string;
  time: string;
  dateStr: string; // YYYY-MM-DD
  category: "reuniao" | "imposto" | "meta" | "fornecedor" | "outro";
  priority: "normal" | "alta";
  storeId: string;
}

export default function AgendaView() {
  const { transactions, bills, activeStoreId, showToast, isDemoMode } = useFinance();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<AgendaEvent[]>(() => {
    const saved = localStorage.getItem("finai_agenda_events");
    return saved ? JSON.parse(saved) : [];
  });

  // Modal / Form state for adding/editing event
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [time, setTime] = useState("09:00");
  const [category, setCategory] = useState<AgendaEvent["category"]>("reuniao");
  const [priority, setPriority] = useState<AgendaEvent["priority"]>("normal");
  
  // Custom filter states
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<"todos" | "alta">("todos");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("todos");

  // Save to localStorage whenever events change
  useEffect(() => {
    localStorage.setItem("finai_agenda_events", JSON.stringify(events));
  }, [events]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Helper arrays for calendar
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const monthsNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Logic to calculate days in month & offsets
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const totalDaysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonthDays = Array.from(
    { length: firstDayIndex },
    (_, i) => totalDaysInPrevMonth - firstDayIndex + i + 1
  );
  
  const currentMonthDays = Array.from(
    { length: totalDaysInMonth },
    (_, i) => i + 1
  );

  // Remainder days to finish the grid (42 cells standard layout)
  const totalCells = 42;
  const nextMonthDays = Array.from(
    { length: totalCells - (prevMonthDays.length + currentMonthDays.length) },
    (_, i) => i + 1
  );

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Format helper to compare dates easily YYYY-MM-DD
  const formatDateStr = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const selectedDateStr = formatDateStr(selectedDate);

  // Business context aggregation for selected date
  const dayTransactions = transactions.filter((t) => {
    const tDate = new Date(t.date);
    return formatDateStr(tDate) === selectedDateStr;
  });

  const dayBills = bills.filter((b) => {
    const bDate = new Date(b.dueDate);
    return formatDateStr(bDate) === selectedDateStr;
  });

  const dayEvents = events.filter((e) => {
    return (
      e.dateStr === selectedDateStr &&
      (e.storeId === activeStoreId || e.storeId === "all" || activeStoreId === "all") &&
      (selectedPriorityFilter === "todos" || e.priority === selectedPriorityFilter) &&
      (selectedCategoryFilter === "todos" || e.category === selectedCategoryFilter)
    );
  });

  // Calculate totals for selected day in PJ Context
  const dayIncomeSum = dayTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const dayExpenseSum = dayTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // Add/Edit handler
  const handleOpenAddForm = () => {
    setEditingEventId(null);
    setTitle("");
    setDescription("");
    setTime("09:00");
    setCategory("reuniao");
    setPriority("normal");
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (ev: AgendaEvent) => {
    setEditingEventId(ev.id);
    setTitle(ev.title);
    setDescription(ev.description);
    setTime(ev.time);
    setCategory(ev.category);
    setPriority(ev.priority);
    setIsFormOpen(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast("Por favor, preencha o título da anotação/evento.", "info");
      return;
    }

    if (editingEventId) {
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === editingEventId
            ? {
                ...ev,
                title: title.trim(),
                description: description.trim(),
                time,
                category,
                priority,
                storeId: activeStoreId === "all" ? "matriz" : activeStoreId,
              }
            : ev
        )
      );
      showToast("Anotação da agenda atualizada com sucesso!", "success");
    } else {
      const newEvent: AgendaEvent = {
        id: Math.random().toString(36).substring(2, 9),
        title: title.trim(),
        description: description.trim(),
        time,
        dateStr: selectedDateStr,
        category,
        priority,
        storeId: activeStoreId === "all" ? "matriz" : activeStoreId,
      };
      setEvents((prev) => [...prev, newEvent]);
      showToast("Novo compromisso adicionado à agenda!", "success");
    }

    setIsFormOpen(false);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
    showToast("Compromisso removido da agenda.", "info");
  };

  // Category utilities
  const getCategoryTheme = (cat: AgendaEvent["category"]) => {
    switch (cat) {
      case "reuniao":
        return { bg: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500", label: "Reunião/Alinhamento" };
      case "imposto":
        return { bg: "bg-purple-50 text-purple-700 border-purple-100", dot: "bg-purple-500", label: "Guia / Imposto PJ" };
      case "meta":
        return { bg: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-500", label: "Meta / Planejamento" };
      case "fornecedor":
        return { bg: "bg-cyan-50 text-cyan-700 border-cyan-100", dot: "bg-cyan-500", label: "Fornecedores / Compras" };
      default:
        return { bg: "bg-gray-50 text-gray-700 border-gray-100", dot: "bg-gray-500", label: "Outros Assuntos" };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* SEÇÃO INFORMATIVA INTEGRADORA */}
      <div className="bg-gradient-to-r from-[#141414] to-[#2c1a11] text-white p-6 md:p-8 rounded-[2.5rem] relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 -mr-12 -mt-12 rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-orange-500/25 border border-orange-500/40 text-orange-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                Sincronização Ativa
              </span>
              <span className="text-gray-400 text-xs font-bold font-mono">
                Assessor Técnico Valora
              </span>
            </div>
            <h2 className="text-2xl font-black font-display uppercase italic tracking-tighter">
              Agenda & Planejamento Calendário PJ
            </h2>
            <p className="text-gray-300 text-sm max-w-2xl">
              Gerencie suas anotações estratégicas diárias, reuniões de equipe, prazos de guias tributárias (DRE) e obrigações com fornecedores. Receba os alertas de fluxo de caixa diretamente vinculados à data de vencimento.
            </p>
          </div>
          
          <button
            onClick={goToToday}
            className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all transform active:scale-95 flex items-center gap-2 select-none self-start md:self-auto cursor-pointer"
          >
            <CalendarIcon size={14} />
            Ir para hoje
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LADO ESQUERDO: CALENDÁRIO INTERATIVO */}
        <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-150 shadow-xl shadow-black/[0.02] space-y-6">
          <div className="flex justify-between items-center text-gray-950 pb-2 border-b border-gray-100">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 font-sans">
                Selecione o dia para inspecionar
              </span>
              <h3 className="text-xl md:text-2xl font-black font-display uppercase tracking-tight italic">
                {monthsNames[month]}, <span className="font-sans font-normal text-gray-500">{year}</span>
              </h3>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                title="Mês Anterior"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextMonth}
                className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                title="Próximo Mês"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* WEEK DAYS HEADINGS */}
          <div className="grid grid-cols-7 gap-1 text-center font-black uppercase text-[10px] text-gray-400 tracking-wider">
            {weekDays.map((day, idx) => (
              <div key={day} className={cn("py-2", idx === 0 ? "text-red-400/80" : "")}>
                {day}
              </div>
            ))}
          </div>

          {/* CALENDAR DAYS GRID */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Prev month days */}
            {prevMonthDays.map((dayNum, idx) => {
              const dDate = new Date(year, month - 1, dayNum);
              const dStr = formatDateStr(dDate);
              const isSel = dStr === selectedDateStr;
              return (
                <button
                  key={`prev-${idx}`}
                  onClick={() => setSelectedDate(dDate)}
                  className={cn(
                    "aspect-square rounded-2xl flex flex-col items-center justify-between p-2 text-xs font-bold text-gray-300 hover:text-gray-500 transition-all cursor-pointer relative",
                    isSel ? "border-2 border-orange-500/40 bg-orange-50/10" : "hover:bg-gray-50/40"
                  )}
                >
                  <span className="line-through decoration-1 decoration-gray-200">{dayNum}</span>
                  {renderDotsForDay(dStr)}
                </button>
              );
            })}

            {/* Current month days */}
            {currentMonthDays.map((dayNum) => {
              const dDate = new Date(year, month, dayNum);
              const dStr = formatDateStr(dDate);
              
              // Date comparisons
              const isToday = formatDateStr(new Date()) === dStr;
              const isSel = dStr === selectedDateStr;

              return (
                <button
                  key={`curr-${dayNum}`}
                  onClick={() => setSelectedDate(dDate)}
                  className={cn(
                    "aspect-square rounded-2xl flex flex-col items-center justify-between p-2 relative transition-all cursor-pointer",
                    // Selected state
                    isSel 
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20 font-black scale-105" 
                      : isToday
                        ? "bg-[#141414] text-white font-black scale-102"
                        : "bg-gray-50/40 hover:bg-gray-100/70 border border-gray-100/50 text-gray-900 font-bold"
                  )}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-xs">{dayNum}</span>
                    {isToday && (
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    )}
                  </div>
                  
                  {/* Indicator Dots */}
                  <div className="flex gap-1 items-center justify-center flex-wrap pt-1">
                    {renderDotsForDay(dStr, isSel)}
                  </div>
                </button>
              );
            })}

            {/* Next month days */}
            {nextMonthDays.map((dayNum, idx) => {
              const dDate = new Date(year, month + 1, dayNum);
              const dStr = formatDateStr(dDate);
              const isSel = dStr === selectedDateStr;
              return (
                <button
                  key={`next-${idx}`}
                  onClick={() => setSelectedDate(dDate)}
                  className={cn(
                    "aspect-square rounded-2xl flex flex-col items-center justify-between p-2 text-xs font-bold text-gray-300 hover:text-gray-500 transition-all cursor-pointer relative",
                    isSel ? "border-2 border-orange-500/40 bg-orange-50/10" : "hover:bg-gray-50/40"
                  )}
                >
                  <span>{dayNum}</span>
                  {renderDotsForDay(dStr)}
                </button>
              );
            })}
          </div>

          {/* CALENDAR LEGEND */}
          <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-black uppercase text-gray-400 select-none tracking-widest pl-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shrink-0" />
              <span>Anotações / Agenda</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block shrink-0" />
              <span>Contas a Pagar (DRE)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shrink-0" />
              <span>Histórico Financeiro PJ</span>
            </div>
          </div>
        </div>

        {/* LADO DIREITO: LINHA DO TEMPO DO DIA SELECIONADO & EVENTOS */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* PAINEL DE CONTROLE DO DIA */}
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-150 shadow-xl shadow-black/[0.02] space-y-6">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">
                  Data de Inspeção Ativa
                </span>
                <h4 className="text-lg md:text-xl font-black font-display uppercase italic tracking-tight text-gray-900 leading-tight">
                  {selectedDate.toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </h4>
              </div>
              
              <button
                onClick={handleOpenAddForm}
                className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-2xl font-black shadow-lg shadow-orange-500/20 active:scale-95 transition-all text-xs flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Plus size={16} />
                <span>Nova Tag PJ</span>
              </button>
            </div>

            {/* INTEGRATED DAY TRANS BALANCE SUMMARY */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-700">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Histórico PJ no dia</span>
                <div className="flex items-center gap-4 mt-0.5">
                  <span className="text-emerald-600 font-bold">
                     {formatCurrency(dayIncomeSum)}
                  </span>
                  <span className="text-rose-600 font-bold">
                     {formatCurrency(dayExpenseSum)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Fluxo Líquido</span>
                <p className={cn(
                  "font-black tracking-tight mt-0.5",
                  (dayIncomeSum - dayExpenseSum) >= 0 ? "text-emerald-700" : "text-rose-700"
                )}>
                  {formatCurrency(dayIncomeSum - dayExpenseSum)}
                </p>
              </div>
            </div>

            {/* EVENT FILTERS DISPLAY */}
            <div className="flex gap-2 items-center flex-wrap pt-1">
              <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-xl text-[9px] font-black uppercase text-gray-500 border border-gray-150 select-none">
                <Filter size={10} />
                <span>Filtros</span>
              </div>
              <button
                onClick={() => setSelectedPriorityFilter(val => val === "todos" ? "alta" : "todos")}
                className={cn(
                  "px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-colors cursor-pointer",
                  selectedPriorityFilter === "alta"
                    ? "bg-red-500 text-white border-red-500"
                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                )}
              >
                ⚠️ Urgência Alta
              </button>

              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-white text-[9px] font-black text-gray-500 uppercase rounded-xl px-2 py-1 border border-gray-200 focus:outline-none focus:ring-0 max-w-[120px] cursor-pointer"
              >
                <option value="todos">Todas Categorias</option>
                <option value="reuniao">💼 Reuniões</option>
                <option value="imposto">📁 Guias / Impostos</option>
                <option value="meta">🎯 Metas PJ</option>
                <option value="fornecedor">🏪 Fornecedores</option>
                <option value="outro">🏷️ Outros</option>
              </select>
            </div>
          </div>

          {/* DYNAMIC LIST TIMELINE CONTAINER */}
          <div className="space-y-4">
            
            {/* 1. SEÇÃO DE CONTAS A PAGAR TIED TO DAY */}
            {dayBills.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 pl-2 text-[10px] font-black uppercase text-orange-600 tracking-wider">
                  <AlertCircle size={12} />
                  <span>Compromissos Financeiros (Contas a Pagar)</span>
                </div>
                {dayBills.map((bill) => (
                  <div
                    key={bill.id}
                    className="flex justify-between items-center bg-amber-50/50 border border-amber-150 p-4 rounded-2xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <DollarSign size={16} />
                      </div>
                      <div>
                        <h5 className="font-bold text-xs uppercase text-orange-950 leading-tight">
                          {bill.description}
                        </h5>
                        <p className="text-[10px] text-orange-700/80 font-bold mt-0.5">
                          Status: {bill.status === "paid" ? "✓ Pago" : "⚠️ Pendente DRE"}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-orange-950">
                      {formatCurrency(bill.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 2. SEÇÃO DE CUSTOM USER AGENDA EVENTS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[10px] font-black uppercase text-gray-400 tracking-wider pl-2">
                <span>Minha Agenda / Notas diárias ({dayEvents.length})</span>
                {selectedCategoryFilter !== "todos" || selectedPriorityFilter !== "todos" ? (
                  <button 
                    onClick={() => { setSelectedCategoryFilter("todos"); setSelectedPriorityFilter("todos"); }} 
                    className="text-orange-500 hover:underline cursor-pointer lowercase font-medium"
                  >
                    limpar filtros
                  </button>
                ) : null}
              </div>

              {dayEvents.length === 0 ? (
                <div className="bg-white/80 p-8 rounded-[2.5rem] border border-gray-150/80 shadow-xs flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                    <CalendarIcon size={22} />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-gray-800 uppercase">Sem metas registradas para o dia</h5>
                    <p className="text-[10px] text-gray-400 font-medium max-w-xs px-4 mt-1">
                      Precisa de prazos estratégicos? Clique em &ldquo;Nova Tag PJ&rdquo; acima para programar e se organizar.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {dayEvents.map((ev) => {
                    const catTheme = getCategoryTheme(ev.category);
                    return (
                      <div
                        key={ev.id}
                        className={cn(
                          "bg-white p-5 rounded-[2rem] border shadow-xs flex flex-col justify-between gap-3 relative overflow-hidden group hover:shadow-md transition-all border-gray-150",
                          ev.priority === "alta" ? "border-l-4 border-l-red-500" : "border-l-4 border-l-orange-400"
                        )}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn("px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border", catTheme.bg)}>
                                {catTheme.label}
                              </span>
                              {ev.priority === "alta" && (
                                <span className="bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                  ⚠️ Urgente
                                </span>
                              )}
                              <span className="text-[10px] font-bold font-mono text-gray-400 flex items-center gap-1 pl-1">
                                <Clock size={11} />
                                {ev.time}
                              </span>
                            </div>
                            
                            <h5 className="font-extrabold text-sm uppercase italic tracking-tight text-gray-900 leading-tight pt-1">
                              {ev.title}
                            </h5>
                          </div>

                          <div className="flex gap-1 items-center shrink-0">
                            <button
                              onClick={() => handleOpenEditForm(ev)}
                              className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(ev.id)}
                              className="p-1.5 bg-red-50 hover:bg-red-100/80 rounded-lg text-red-500 transition-colors cursor-pointer"
                              title="Remover"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {ev.description && (
                          <p className="text-xs text-gray-600 leading-relaxed font-medium bg-gray-50/50 p-3 rounded-xl border border-gray-150/40">
                            {ev.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* INTEGRATED TODAY FEEDBACK CARD */}
            <div className="bg-orange-50/50 border border-orange-150 rounded-[2.2rem] p-5 flex gap-3.5 items-start">
              <span className="text-base shrink-0 pt-0.5 select-none">💡</span>
              <div>
                <h5 className="text-[10px] font-black uppercase tracking-widest text-orange-950">
                   Conselheira de Segurança Financeira I.A.
                </h5>
                <p className="text-xs text-orange-900 leading-relaxed font-semibold mt-1">
                  &ldquo;A agenda de prazos vincula seus compromissos diários às previsões de contas a pagar e saídas ordinárias do DRE. Isso previne juros de fornecedores e otimiza seu capital de giro diário!&rdquo;
                </p>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* MODAL FORM PARA CRIAR / EDITAR ANOTAÇÃO-AGENDA */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[2.5rem] p-6 md:p-8 max-w-lg w-full shadow-2xl border border-gray-100 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 -mr-8 -mt-8 rounded-full pointer-events-none" />
              
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 select-none">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">
                    Sincronização com o Calendário
                  </span>
                  <h4 className="text-lg md:text-xl font-black font-display uppercase tracking-tighter italic text-gray-900">
                    {editingEventId ? "Editar Compromisso PJ" : "Cadastrar Meta no Dia"}
                  </h4>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-xl transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="space-y-4 pt-4 relative z-10 text-gray-700">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#141414] italic">
                    Título / Assunto Principal
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-orange-500 rounded-xl px-4 py-3 outline-none text-sm placeholder-gray-300 font-extrabold text-gray-900"
                    placeholder="Ex: Conciliar impostos fiscais"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#141414] italic mt-1">
                      Categoria Estratégica
                    </label>
                    <select
                      value={category}
                      onChange={(e: any) => setCategory(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 outline-none text-xs font-black uppercase text-gray-800 cursor-pointer"
                    >
                      <option value="reuniao">💼 Reunião / Alinhamento</option>
                      <option value="imposto">📁 Guia / Imposto PJ</option>
                      <option value="meta">🎯 Meta / Planejamento</option>
                      <option value="fornecedor">🏪 Fornecedor / Compra</option>
                      <option value="outro">🏷️ Outros Assuntos</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#141414] italic mt-1">
                      Horário Marcado
                    </label>
                    <input
                      type="time"
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-orange-500 rounded-xl px-4 py-2.5 outline-none text-xs font-black text-gray-850"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#141414] italic mt-1">
                    Nível de Urgência
                  </label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setPriority("normal")}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase transition-all border text-center cursor-pointer",
                        priority === "normal"
                          ? "bg-orange-50 border-orange-500 text-orange-700 font-black shadow-sm"
                          : "bg-gray-50 hover:bg-gray-100 text-gray-500 border-gray-200"
                      )}
                    >
                      Normal (Geral)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriority("alta")}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase transition-all border text-center cursor-pointer",
                        priority === "alta"
                          ? "bg-red-50 border-red-500 text-red-700 font-bold shadow-sm"
                          : "bg-gray-50 hover:bg-gray-100 text-gray-500 border-gray-200"
                      )}
                    >
                      Urgência Alta (Crítico PJ)
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#141414] italic mt-1">
                    Detalhamento / Anotações
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-orange-500 rounded-xl p-4 outline-none text-xs placeholder-gray-400 font-medium text-gray-700 resize-none leading-relaxed"
                    placeholder="Descreva detalhes adicionais deste compromisso ou anotações..."
                  />
                </div>

                <div className="flex gap-4 pt-4 select-none">
                  <button
                    type="submit"
                    className="flex-1 bg-[#141414] hover:bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 cursor-pointer text-xs"
                  >
                    {editingEventId ? "Salvar Alterações" : "Cadastrar na Agenda"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-500 py-4 rounded-2xl font-black uppercase tracking-widest transition-all cursor-pointer text-xs"
                  >
                    Voltar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  // Day dot lookup/calculator helper
  function renderDotsForDay(dStr: string, isSel?: boolean) {
    const evsCount = events.filter((e) => e.dateStr === dStr && (e.storeId === activeStoreId || e.storeId === "all" || activeStoreId === "all")).length;
    const billsCount = bills.filter((b) => formatDateStr(new Date(b.dueDate)) === dStr).length;
    const transCount = transactions.filter((t) => formatDateStr(new Date(t.date)) === dStr).length;

    return (
      <>
        {evsCount > 0 && (
          <span className={cn("w-1.5 h-1.5 rounded-full inline-block shrink-0", isSel ? "bg-white" : "bg-blue-500")} title={`${evsCount} anotações`} />
        )}
        {billsCount > 0 && (
          <span className={cn("w-1.5 h-1.5 rounded-full inline-block shrink-0", isSel ? "bg-white" : "bg-orange-500")} title={`${billsCount} contas a vencer`} />
        )}
        {transCount > 0 && (
          <span className={cn("w-1.5 h-1.5 rounded-full inline-block shrink-0", isSel ? "bg-white" : "bg-emerald-500")} title={`${transCount} lançamentos`} />
        )}
      </>
    );
  }
}
