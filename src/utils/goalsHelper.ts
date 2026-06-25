export function getDynamicGoals(transactions: any[], categories: any[]) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const currentMonthTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const realRevenue = currentMonthTransactions
    .filter((t) => {
      const category = categories.find((c) => c.id === t.categoryId);
      const descUpper = (t.description || "").toUpperCase();
      const isInvestmentByDesc = descUpper.includes("RESERVA") || 
                                 descUpper.includes("EMERGENCIA") || 
                                 descUpper.includes("EMERGÊNCIA") || 
                                 descUpper.includes("APORTE") || 
                                 descUpper.includes("INVESTIMENTO");
      return category?.group === "REVENUE" && !isInvestmentByDesc;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const realOpex = currentMonthTransactions
    .filter((t) => {
      const category = categories.find((c) => c.id === t.categoryId);
      const descUpper = (t.description || "").toUpperCase();
      const isInvestmentByDesc = descUpper.includes("RESERVA") || 
                                 descUpper.includes("EMERGENCIA") || 
                                 descUpper.includes("EMERGÊNCIA") || 
                                 descUpper.includes("APORTE") || 
                                 descUpper.includes("INVESTIMENTO");
      return category?.group === "OPEX" && !isInvestmentByDesc;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  // Somar investimentos filtrando por palavras-chave na descrição
  const getInvestmentForGoal = (goalTitle: string) => {
    return currentMonthTransactions
      .filter((t) => {
        const category = categories.find((c) => c.id === t.categoryId);
        const descUpper = (t.description || "").toUpperCase();
        
        const isInvestment = (category?.group === "INVESTMENT") || 
                             descUpper.includes("RESERVA") || 
                             descUpper.includes("EMERGENCIA") || 
                             descUpper.includes("EMERGÊNCIA") || 
                             descUpper.includes("APORTE") || 
                             descUpper.includes("INVESTIMENTO");

        if (!isInvestment) return false;
        
        const titleUpper = goalTitle.toUpperCase();
        
        // Se for Reserva de Emergência, somamos os investimentos gerais ou os específicos de Emergência
        if (titleUpper === "RESERVA DE EMERGÊNCIA" || titleUpper === "RESERVA DE EMERGENCIA") {
          const namesOtherReserves = ["EXPANSÃO", "EXPANSAO", "PROVISÃO", "PROVISAO", "FUNDO", "REDUÇÃO", "REDUCAO", "FATURAMENTO"];
          const hasOtherReserve = namesOtherReserves.some(name => descUpper.includes(name));
          return descUpper.includes("EMERGÊNCIA") || descUpper.includes("EMERGENCIA") || (!hasOtherReserve);
        }
        
        return descUpper.includes(titleUpper);
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const emergencyReserveInvest = getInvestmentForGoal("Reserva de Emergência");

  return [
    {
      title: "Reserva de Emergência",
      current: 8500 + emergencyReserveInvest,
      target: 15000,
      color: "bg-orange-500",
    },
    {
      title: "Redução de Custos Fixos",
      current: realOpex || 2200,
      target: 1800,
      color: "bg-[#f97316]",
      inverse: true,
    },
    {
      title: "Meta de Faturamento (Maio)",
      current: realRevenue || 33000,
      target: 45000,
      color: "bg-gray-900",
    },
  ];
}
export default getDynamicGoals;
