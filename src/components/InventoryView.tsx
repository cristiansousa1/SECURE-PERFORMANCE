import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Trash2, 
  Edit, 
  AlertTriangle, 
  CheckCircle, 
  Sparkles, 
  RefreshCw, 
  FileText, 
  Check, 
  ArrowRight, 
  FileDown,
  Volume2,
  Square,
  DollarSign,
  Boxes,
  Activity,
  ChevronRight,
  TrendingDown,
  Percent
} from 'lucide-react';
import { useFinance } from '../contexts/FinanceContext';
import { InventoryItem, ProductPriceCalc, ProductRecipeItem } from '../types';
import ReactMarkdown from 'react-markdown';

export default function InventoryView() {
  const {
    products,
    updateProduct,
    inventoryItems,
    addInventoryItem,
    deleteInventoryItem,
    updateInventoryItem,
    isDemoMode,
    profile,
    showToast
  } = useFinance();

  // Sub-tab state
  const [subTab, setSubTab] = useState<'items' | 'recipes' | 'ai'>('items');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  const [itemName, setItemName] = useState('');
  const [itemSku, setItemSku] = useState('');
  const [itemQty, setItemQty] = useState('');
  const [itemMin, setItemMin] = useState('');
  const [itemUnit, setItemUnit] = useState<'g' | 'kg' | 'un'>('g');
  const [itemCost, setItemCost] = useState('');

  // Recipe states
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [recipeItemInsumoId, setRecipeItemInsumoId] = useState<string>('');
  const [recipeItemQty, setRecipeItemQty] = useState('');

  // AI advisory state
  const [stockReport, setStockReport] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Filter low stock state
  const [filterLowStock, setFilterLowStock] = useState(false);

  // Active product for recipe tab
  const activeProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || products[0];
  }, [products, selectedProductId]);

  // Calculated recipe cost for active product
  const activeRecipeCost = useMemo(() => {
    if (!activeProduct || !activeProduct.recipe) return 0;
    return activeProduct.recipe.reduce((total, recipeItem) => {
      const insumo = inventoryItems.find(i => i.id === recipeItem.inventoryItemId);
      if (!insumo) return total;
      return total + (recipeItem.quantityNeeded * insumo.costPricePerUnit);
    }, 0);
  }, [activeProduct, inventoryItems]);

  // Reset form helper
  const resetForm = () => {
    setItemName('');
    setItemSku('');
    setItemQty('');
    setItemMin('');
    setItemUnit('g');
    setItemCost('');
    setEditingItem(null);
    setShowForm(false);
  };

  // Submit supply item (Add / Edit)
  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !itemQty || !itemMin || !itemCost) {
      showToast('Por favor, preencha todos os campos obrigatórios!', 'warning');
      return;
    }

    const qtyVal = parseFloat(itemQty);
    const minVal = parseFloat(itemMin);
    const costVal = parseFloat(itemCost);

    if (isNaN(qtyVal) || isNaN(minVal) || isNaN(costVal)) {
      showToast('Insira valores numéricos válidos!', 'error');
      return;
    }

    const itemData = {
      name: itemName.trim(),
      sku: itemSku.trim() || undefined,
      currentQuantity: qtyVal,
      minQuantity: minVal,
      unit: itemUnit,
      costPricePerUnit: costVal
    };

    try {
      if (editingItem) {
        await updateInventoryItem(editingItem.id, itemData);
        showToast(`Insumo "${itemName}" atualizado com sucesso!`, 'success');
      } else {
        await addInventoryItem(itemData);
        showToast(`Insumo "${itemName}" cadastrado com sucesso!`, 'success');
      }
      resetForm();
    } catch (err) {
      console.error(err);
      showToast('Erro ao gravar insumo no estoque.', 'error');
    }
  };

  // Open Edit Form
  const handleEditClick = (item: InventoryItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemSku(item.sku || '');
    setItemQty(item.currentQuantity.toString());
    setItemMin(item.minQuantity.toString());
    setItemUnit(item.unit);
    setItemCost(item.costPricePerUnit.toString());
    setShowForm(true);
  };

  // Delete Supply Item
  const handleDeleteClick = async (id: string, name: string) => {
    if (confirm(`Deseja remover permanentemente o insumo "${name}"?`)) {
      try {
        await deleteInventoryItem(id);
        showToast('Insumo removido com sucesso!', 'info');
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Add Recipe Item (Vincular ingrediente ao produto)
  const handleAddRecipeItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct) {
      showToast('Selecione ou cadastre um produto primeiro!', 'warning');
      return;
    }
    if (!recipeItemInsumoId) {
      showToast('Selecione um insumo para vincular!', 'warning');
      return;
    }
    const neededQty = parseFloat(recipeItemQty);
    if (isNaN(neededQty) || neededQty <= 0) {
      showToast('Insira uma quantidade necessária positiva!', 'warning');
      return;
    }

    // Check if ingredient is already in recipe
    const currentRecipe = activeProduct.recipe || [];
    const duplicate = currentRecipe.find(r => r.inventoryItemId === recipeItemInsumoId);
    if (duplicate) {
      showToast('Este insumo já está cadastrado na ficha técnica deste produto!', 'warning');
      return;
    }

    const updatedRecipe: ProductRecipeItem[] = [
      ...currentRecipe,
      { inventoryItemId: recipeItemInsumoId, quantityNeeded: neededQty }
    ];

    try {
      await updateProduct(activeProduct.id, { recipe: updatedRecipe });
      showToast('Ingrediente adicionado à ficha técnica!', 'success');
      setRecipeItemQty('');
      setRecipeItemInsumoId('');
    } catch (err) {
      console.error(err);
    }
  };

  // Remove Recipe Item
  const handleRemoveRecipeItem = async (insumoId: string) => {
    if (!activeProduct || !activeProduct.recipe) return;
    
    const updatedRecipe = activeProduct.recipe.filter(r => r.inventoryItemId !== insumoId);
    try {
      await updateProduct(activeProduct.id, { recipe: updatedRecipe });
      showToast('Ingrediente removido da ficha técnica!', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  // Update Product Cost with Calculated Recipe Cost
  const handleSyncRecipeCostToProduct = async () => {
    if (!activeProduct || activeRecipeCost <= 0) return;
    
    // Calculate new Margins and CMV %
    // CMV% = (cost / selling) * 100
    // Margin% = ((selling - cost - taxes - other) / selling) * 100
    const cost = activeRecipeCost;
    const sellingPrice = activeProduct.sellingPrice || 1;
    const taxRate = activeProduct.taxRate || 0;
    const otherCostsPct = activeProduct.otherCostsPct || 0;
    
    const cmvPct = (cost / sellingPrice) * 100;
    const profitMarginPct = ((sellingPrice - cost - (sellingPrice * (taxRate / 100)) - (sellingPrice * (otherCostsPct / 100))) / sellingPrice) * 100;
    const profitValue = sellingPrice - cost - (sellingPrice * (taxRate / 100)) - (sellingPrice * (otherCostsPct / 100));

    try {
      await updateProduct(activeProduct.id, {
        costPrice: Number(cost.toFixed(2)),
        cmvPct: Number(cmvPct.toFixed(2)),
        profitMarginPct: Number(profitMarginPct.toFixed(2)),
        profitValue: Number(profitValue.toFixed(2))
      });
      showToast(`Custo real de R$ ${cost.toFixed(2)} sincronizado diretamente no CMV do produto!`, 'success');
    } catch (err) {
      console.error(err);
    }
  };

  // Call server-side AI inventory advisor endpoint
  const handleFetchAiReport = async () => {
    if (inventoryItems.length === 0) {
      showToast('Cadastre pelo menos 1 insumo para obter diagnósticos!', 'warning');
      return;
    }
    setLoadingAi(true);
    try {
      const res = await fetch('/api/ai/inventory-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryItems,
          products,
          profile
        })
      });
      const data = await res.json();
      if (data.text) {
        setStockReport(data.text);
        showToast('Diagnóstico operacional estruturado pela I.A. Dafne!', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Falha ao acionar mentoria de estoque.', 'error');
    } finally {
      setLoadingAi(false);
    }
  };

  // Text to Speech
  const handleToggleSpeech = (text: string) => {
    if (!('speechSynthesis' in window)) {
      showToast('Sua versão de navegador não suporta sintetização de áudio.', 'warning');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Clean markdown tags for clear speech synthesis
    const cleanText = text
      .replace(/[#*`_-]/g, '')
      .replace(/\s+/g, ' ')
      .slice(0, 1000); // safety length

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05;
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Export PDF Report
  const handleExportPDF = () => {
    if (!stockReport) return;
    showToast('Iniciando carregamento do PDF...', 'info');
    // Using simple browser print styling or just dynamic iframe print for high durability
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Laudo Operacional de Estoque & CMV - FinAI</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
              h1 { color: #f97316; font-size: 24px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; }
              h3 { color: #0f172a; font-size: 16px; margin-top: 25px; }
              p, li { line-height: 1.6; font-size: 14px; }
              .header { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; }
              .logo { font-weight: 900; color: #f97316; }
            </style>
          </head>
          <body>
            <div class="header">
              <span class="logo">FinAI Mentor</span>
              <span>Dafne Diagnóstico Operacional - ${new Date().toLocaleDateString('pt-BR')}</span>
            </div>
            <h1>Diagnóstico de Inteligência de Estoque & Matéria Prima</h1>
            <div style="margin-top: 20px;">
              ${stockReport.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>')}
            </div>
            <script>window.onload = function() { window.print(); }</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Count items below safety limit
  const lowStockCount = useMemo(() => {
    return inventoryItems.filter(i => i.currentQuantity <= i.minQuantity).length;
  }, [inventoryItems]);

  // Active items based on filter
  const filteredItems = useMemo(() => {
    if (filterLowStock) {
      return inventoryItems.filter(i => i.currentQuantity <= i.minQuantity);
    }
    return inventoryItems;
  }, [inventoryItems, filterLowStock]);

  return (
    <div id="inventory-module-card" className="bg-white rounded-[2.5rem] border border-gray-150-80 shadow-xs overflow-hidden animate-in fade-in duration-300">
      
      {/* Module Header and Stats */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-orange-500/5 to-amber-500/5 border-b border-gray-150">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-orange-500 text-white rounded-3xl shrink-0 shadow-lg shadow-orange-500/20">
              <Boxes size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-[#141414] text-lg flex items-center gap-2">
                Controle Fino de Estoque, Insumos & CMV
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Cadastre insumos, configure quantidades de segurança e calcule o CMV real de seus produtos em gramas, quilos ou unidades.
              </p>
            </div>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 w-full md:w-auto self-stretch md:self-auto shrink-0">
            <button
              onClick={() => { setSubTab('items'); }}
              className={`flex-1 md:flex-initial text-center py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subTab === 'items' ? 'bg-white text-gray-900 shadow-xs border border-gray-150' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              📦 Insumos
            </button>
            <button
              onClick={() => { setSubTab('recipes'); }}
              className={`flex-1 md:flex-initial text-center py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subTab === 'recipes' ? 'bg-white text-gray-900 shadow-xs border border-gray-150' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              📝 Fichas Técnicas
            </button>
            <button
              onClick={() => { setSubTab('ai'); }}
              className={`flex-1 md:flex-initial text-center py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                subTab === 'ai' ? 'bg-white text-gray-900 shadow-xs border border-gray-150' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Sparkles size={13} className="inline mr-1 text-orange-500" />
              Mentor IA
              {lowStockCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center font-black animate-pulse text-[8px]">
                  {lowStockCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Dashboard Indicators / Alert ribbons */}
        <div id="stock-alerts-indicator" className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-white p-4.5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-4">
            <div className={`p-3 rounded-xl ${lowStockCount > 0 ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-emerald-100 text-emerald-600'} shrink-0`}>
              <AlertTriangle size={18} />
            </div>
            <div>
              <span className="block text-[9px] uppercase font-black tracking-widest text-[#9c9c9c]">Insumos Críticos</span>
              <span className={`block text-base font-black italic font-sans ${lowStockCount > 0 ? 'text-rose-600 animate-pulse' : 'text-emerald-600'}`}>
                {lowStockCount === 0 ? 'TUDO OK!' : `${lowStockCount} Abaixo do Mínimo`}
              </span>
            </div>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl shrink-0">
              <Package size={18} />
            </div>
            <div>
              <span className="block text-[9px] uppercase font-black tracking-widest text-[#9c9c9c]">Total de Insumos</span>
              <span className="block text-base font-black italic font-sans text-gray-900">
                {inventoryItems.length} Cadastrados
              </span>
            </div>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-xl shrink-0">
              <TrendingDown size={18} />
            </div>
            <div>
              <span className="block text-[9px] uppercase font-black tracking-widest text-[#9c9c9c]">CMV & Insumos</span>
              <span className="block text-base font-black italic font-sans text-amber-600">
                Ficha Integrada
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SUB-TAB content: Items management */}
      {subTab === 'items' && (
        <div id="items-subtab-container" className="p-6 md:p-8 space-y-6">
          <div className="flex justify-between items-center gap-4">
            <div>
              <h4 className="font-extrabold text-[#141414] text-sm">Biblioteca Geral de Matérias Primas & Insumos</h4>
              <p className="text-[11px] text-gray-500">Crie, edite e monitore os custos e volumes individuais de cada componente.</p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setFilterLowStock(!filterLowStock)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  filterLowStock ? 'bg-rose-50 border-rose-200 text-rose-700 font-extrabold' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                ⚠️ Filtrar Baixo Estoque {lowStockCount > 0 && `(${lowStockCount})`}
              </button>
              <button
                onClick={() => {
                  if (showForm) resetForm();
                  else setShowForm(true);
                }}
                className="px-4 py-1.5 bg-[#141414] hover:bg-[#141414]/90 text-white rounded-xl text-xs font-extrabold uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus size={14} /> Registrar Insumo
              </button>
            </div>
          </div>

          {/* Form to insert / edit a raw material */}
          {showForm && (
            <form onSubmit={handleItemSubmit} className="bg-gray-50 border border-gray-150/80 p-5 rounded-3xl animate-in slide-in-from-top-4 duration-300 grid grid-cols-1 sm:grid-cols-3 gap-4.5">
              <div className="sm:col-span-3 pb-2 border-b border-gray-200/65 flex justify-between items-center">
                <h5 className="text-[11px] font-black uppercase tracking-wider text-gray-700">
                  {editingItem ? '✏️ Editar Dados do Insumo' : '✨ Cadastro de Novo Insumo'}
                </h5>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs font-extrabold text-rose-600 hover:text-rose-700 tracking-wider cursor-pointer font-mono"
                >
                  CANCELAR
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wide mb-1">
                  Nome do Insumo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carne Moida, Pão Brioche, Embalagem"
                  value={itemName}
                  onChange={e => setItemName(e.target.value)}
                  className="w-full text-xs font-bold bg-white border border-gray-250 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wide mb-1">
                  SKU / Código Interno (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: IN-982"
                  value={itemSku}
                  onChange={e => setItemSku(e.target.value)}
                  className="w-full text-xs font-bold bg-white border border-gray-250 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wide mb-1">
                  Unidade de Medida *
                </label>
                <select
                  value={itemUnit}
                  onChange={e => setItemUnit(e.target.value as 'g' | 'kg' | 'un')}
                  className="w-full text-xs font-black bg-white border border-gray-250 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                >
                  <option value="g">Gramas (g)</option>
                  <option value="kg">Quilos (kg)</option>
                  <option value="un">Unidades (un)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wide mb-1">
                  Quantidade Atual em Estoque *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  min="0"
                  placeholder="Ex: 5000"
                  value={itemQty}
                  onChange={e => setItemQty(e.target.value)}
                  className="w-full text-xs font-bold font-mono bg-white border border-gray-250 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wide mb-1">
                  Quantidade de Segurança Mínima *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  min="0"
                  placeholder="Ex: 1000"
                  value={itemMin}
                  onChange={e => setItemMin(e.target.value)}
                  className="w-full text-xs font-bold font-mono bg-white border border-gray-250 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wide mb-1">
                  Preço de Custo Unitário (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-bold">R$</span>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    min="0"
                    placeholder={`Por ${itemUnit}`}
                    value={itemCost}
                    onChange={e => setItemCost(e.target.value)}
                    className="w-full text-xs font-bold font-mono bg-white border border-gray-250 rounded-xl pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                  />
                </div>
                <span className="text-[9px] text-[#9c9c9c] font-semibold mt-1 block">
                  Ex: R$ 0.05 por grama (Equivale a R$ 50/kg)
                </span>
              </div>

              <div className="sm:col-span-3 flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md"
                >
                  {editingItem ? 'Salvar Alterações' : 'Confirmar Cadastro'}
                </button>
              </div>
            </form>
          )}

          {/* Grid list of Stock Items */}
          {filteredItems.length === 0 ? (
            <div className="text-center p-12 bg-gray-50 rounded-3xl border border-gray-150">
              <Package className="mx-auto text-gray-300 mb-3" size={32} />
              <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest leading-relaxed">
                Nenhum insumo encontrado.
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                {filterLowStock ? 'Nenhum item está abaixo do limite de segurança agrícola!' : 'Cadastre seu primeiro suprimento / insumo clicando acima.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-gray-150">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-150">
                    <th className="px-5 py-4">Insumo</th>
                    <th className="px-5 py-4">Estoque Atual</th>
                    <th className="px-5 py-4">Nível Segurança</th>
                    <th className="px-5 py-4">Custo Unitário</th>
                    <th className="px-5 py-4 text-center">Status</th>
                    <th className="px-5 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-bold text-gray-800">
                  {filteredItems.map(item => {
                    const isBelowMin = item.currentQuantity <= item.minQuantity;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div>
                            <span className="block font-extrabold text-sm text-gray-900">{item.name}</span>
                            {item.sku && <span className="text-[9px] font-mono bg-slate-100 text-gray-500 px-1.5 py-0.5 rounded mt-0.5 inline-block uppercase">{item.sku}</span>}
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono text-gray-900 font-extrabold">
                          {item.currentQuantity.toLocaleString('pt-BR')} {item.unit}
                        </td>
                        <td className="px-5 py-4 font-mono text-gray-500">
                          {item.minQuantity.toLocaleString('pt-BR')} {item.unit}
                        </td>
                        <td className="px-5 py-4 font-mono text-indigo-650 font-extrabold">
                          R$ {item.costPricePerUnit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} / {item.unit}
                        </td>
                        <td className="px-5 py-4 text-center">
                          {isBelowMin ? (
                            <span className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-700 font-black text-[9px] px-2.5 py-1 rounded-full uppercase animate-pulse">
                              <AlertTriangle size={10} /> BAIXO ESTOQUE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-black text-[9px] px-2.5 py-1 rounded-full uppercase">
                              <CheckCircle size={10} /> Adequado
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(item)}
                              className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                              title="Editar Insumo"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(item.id, item.name)}
                              className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Deletar Insumo"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB content: Ficha Técnica (Product recipe mapping & CMV costing link) */}
      {subTab === 'recipes' && (
        <div id="recipes-subtab-container" className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Pick product and insert ingredients form */}
            <div className="lg:col-span- così col-span-12 lg:col-span-5 space-y-5">
              <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-3xl space-y-4">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">Ficha Técnica & Receita dos Pratos</h4>
                  <p className="text-[11px] text-gray-500 mt-1">Selecione um produto cadastrado e adicione os respectivos ingredientes para calcular o custo total real.</p>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wide mb-1.5">
                    Selecionar Produto Cadastrado
                  </label>
                  {products.length === 0 ? (
                    <p className="text-rose-500 font-bold text-xs">Vá para a aba de Precificação e crie produtos para podermos definir receitas!</p>
                  ) : (
                    <select
                      value={selectedProductId}
                      onChange={e => setSelectedProductId(e.target.value)}
                      className="w-full text-xs font-black bg-white border border-gray-250 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Entrada: R$ {p.costPrice.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {activeProduct && inventoryItems.length > 0 && (
                  <form onSubmit={handleAddRecipeItem} className="border-t border-slate-250/50 pt-4 space-y-3.5">
                    <span className="block text-[10px] font-black text-slate-700 uppercase tracking-widest">
                      ➕ Vincular Ingrediente / Insumo
                    </span>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-black uppercase text-gray-500 mb-1">
                          Insumo
                        </label>
                        <select
                          required
                          value={recipeItemInsumoId}
                          onChange={e => setRecipeItemInsumoId(e.target.value)}
                          className="w-full text-xs font-bold bg-white border border-gray-250 rounded-xl px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                        >
                          <option value="">Selecione...</option>
                          {inventoryItems.map(i => (
                            <option key={i.id} value={i.id}>
                              {i.name} ({i.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-black uppercase text-gray-500 mb-1">
                          Qtd Necessária
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            required
                            min="0.0001"
                            placeholder="Ex: 150"
                            value={recipeItemQty}
                            onChange={e => setRecipeItemQty(e.target.value)}
                            className="w-full text-xs font-bold font-mono bg-white border border-gray-250 rounded-xl px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
                          />
                          <span className="absolute right-3 top-1.5 text-xs text-gray-400 font-extrabold bg-white pl-1">
                            {inventoryItems.find(ii => ii.id === recipeItemInsumoId)?.unit || ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Plus size={14} /> Adicionar à Receita
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* List ingredient components of active product */}
            <div className="lg:col-span-7 col-span-12 space-y-5">
              {activeProduct ? (
                <div className="bg-white border border-gray-150 p-6 rounded-3xl space-y-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gray-100">
                    <div>
                      <span className="text-[10px] font-black uppercase text-orange-500 tracking-wider">Ficha Técnica de Fabricação</span>
                      <h4 className="font-extrabold text-gray-900 text-base">{activeProduct.name}</h4>
                    </div>

                    <div className="text-right">
                      <span className="block text-[9px] uppercase font-black text-gray-400 tracking-wide">Custo Total Receita</span>
                      <span className="block text-lg font-black text-indigo-750 font-mono">
                        R$ {activeRecipeCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Ingredients Listing */}
                  {!activeProduct.recipe || activeProduct.recipe.length === 0 ? (
                    <div className="text-center p-8 bg-slate-50 rounded-2xl border border-gray-100">
                      <FileText className="mx-auto text-slate-300 mb-2" size={24} />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sem ingredientes vinculados ainda.</p>
                      <p className="text-[11px] text-slate-400 mt-1">Preencha o formulário ao lado para vincular insumos e monitorar o custo de produção do prato.</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest grid grid-cols-12 gap-2 border-b border-gray-100 pb-2">
                        <span className="col-span-5">Ingrediente</span>
                        <span className="col-span-3 text-center">Insumo Unitário</span>
                        <span className="col-span-2 text-center">Consumo</span>
                        <span className="col-span-2 text-right">Subtotal</span>
                      </div>

                      {activeProduct.recipe.map(recipeItem => {
                        const insumo = inventoryItems.find(i => i.id === recipeItem.inventoryItemId);
                        if (!insumo) return null;
                        const itemCostVal = recipeItem.quantityNeeded * insumo.costPricePerUnit;
                        return (
                          <div key={recipeItem.inventoryItemId} className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-800 items-center hover:bg-slate-50/55 p-1 rounded-xl">
                            <span className="col-span-5 text-gray-900">{insumo.name}</span>
                            <span className="col-span-3 text-center font-mono text-gray-400">R$ {insumo.costPricePerUnit.toFixed(4)}/{insumo.unit}</span>
                            <span className="col-span-2 text-center font-mono">{recipeItem.quantityNeeded} {insumo.unit}</span>
                            <div className="col-span-2 text-right flex items-center justify-end gap-1.5 font-mono">
                              <span className="text-gray-900">R$ {itemCostVal.toFixed(2)}</span>
                              <button
                                onClick={() => handleRemoveRecipeItem(recipeItem.inventoryItemId)}
                                className="p-1 text-gray-300 hover:text-rose-500 rounded-md hover:bg-rose-50 cursor-pointer shrink-0"
                                title="Deletar Ingrediente"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {/* Sync cost price button */}
                      <div className="border-t border-gray-150 pt-5 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-left">
                          <p className="text-[11px] text-gray-500 italic max-w-sm">
                            O custo cadastrado manualmente deste produto é **R$ {activeProduct.costPrice.toFixed(2)}**. O custo real da ficha técnica é **R$ {activeRecipeCost.toFixed(2)}**.
                          </p>
                        </div>
                        <button
                          onClick={handleSyncRecipeCostToProduct}
                          className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer shadow-md transition-all self-stretch md:self-auto text-center justify-center shrink-0"
                        >
                          <Check size={14} /> Vincular CMV Ficha Técnica (R$ {activeRecipeCost.toFixed(2)})
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-12 bg-slate-50 rounded-3xl border border-slate-200/50">
                  <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Selecione um produto para iniciar.</p>
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}

      {/* SUB-TAB content: AI stock monitoring diagnosis (Asessora Dafne) */}
      {subTab === 'ai' && (
        <div id="ai-subtab-container" className="p-6 md:p-8 space-y-6">
          <div className="bg-slate-50 border border-indigo-100 rounded-3xl p-6.5 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xs text-left line-clamp-2">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-[#141414] text-white rounded-3xl shrink-0 animate-bounce">
                <Sparkles size={24} className="text-amber-400" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-[#141414] text-base leading-tight">Auditoria de Abastecimento Integrada (Dafne I.A.)</h4>
                <p className="text-xs text-gray-500 mt-1">Dafne monitora os volumes, cruza dados com o CMV das receitas e projeta alertas inteligentes de ruptura e gargalo.</p>
              </div>
            </div>

            <div className="flex bg-gray-150 p-1 rounded-2xl w-full sm:w-auto self-stretch sm:self-auto shrink-0 gap-2 font-black items-center justify-center">
              {stockReport && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleSpeech(stockReport)}
                    className={`p-3 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                      isSpeaking ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                    title={isSpeaking ? "Interromper voz" : "Ouvir voz mentora da Dafne"}
                  >
                    {isSpeaking ? <Square size={13} fill="currentColor" /> : <Volume2 size={13} />}
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center cursor-pointer transition-all"
                    title="Exportar laudo de estoque para PDF"
                  >
                    <FileDown size={13} />
                  </button>
                </div>
              )}
              <button
                onClick={handleFetchAiReport}
                disabled={loadingAi}
                className="px-5 py-3 bg-[#141414] hover:bg-[#141414]/90 text-white text-xs font-black uppercase tracking-widest rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {loadingAi ? 'Analisando Estoque...' : 'Gerar Diagnóstico I.A.'}
              </button>
            </div>
          </div>

          {/* Report Display details */}
          {stockReport ? (
            <div className="p-6 md:p-8 space-y-6 border border-gray-150/80 rounded-[2rem] bg-white animate-in fade-in duration-400 text-xs">
              <div className="prose max-w-none text-xs leading-relaxed text-gray-750">
                <ReactMarkdown>{stockReport}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="text-center p-12 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
              <Sparkles className="mx-auto text-slate-300 animate-pulse mb-3" size={32} />
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest leading-relaxed">Avaliação Inteligente Não Iniciada</p>
              <p className="text-[11px] text-slate-400 mt-1">Aperte em "Gerar Diagnóstico I.A." para obter análise das quantidades críticas e do impacto no CMV da empresa.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
