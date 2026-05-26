import jsPDF from "jspdf";

/**
 * Utilitário de Padronização e Sofisticação de Relatórios PDF conforme as Normas ABNT (NBR 14724 + IBGE Tabular)
 * Totalmente parametrizado para suportar tanto o estilo acadêmico rigoroso (ABNT) quanto o estilo corporativo colorido (Personalizado da Empresa).
 */

export interface TableColumn {
  header: string;
  key: string;
  width: number; // in mm
  align?: "left" | "center" | "right";
}

export class AbntPdfDocument {
  doc: jsPDF;
  y: number = 30;
  currentPage: number = 1;
  leftMargin: number = 30;
  rightMargin: number = 20;
  topMargin: number = 30;
  bottomMargin: number = 20;
  pageWidth: number = 210;
  pageHeight: number = 297;
  contentWidth: number = 160; // 210 - 30 - 20
  lineSpacingFactor: number = 1.5;

  // Custom Corporate Palette configuration
  primaryColor: { r: number; g: number; b: number } = { r: 15, g: 23, b: 42 };     // Slate 900
  secondaryColor: { r: number; g: number; b: number } = { r: 249, g: 115, b: 22 }; // Amber-Orange
  isAbntStandard: boolean = true;

  constructor(options?: {
    primaryColor?: { r: number; g: number; b: number };
    secondaryColor?: { r: number; g: number; b: number };
    isAbntStandard?: boolean;
  }) {
    this.doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });
    this.y = this.topMargin;

    if (options) {
      if (options.primaryColor) this.primaryColor = options.primaryColor;
      if (options.secondaryColor) this.secondaryColor = options.secondaryColor;
      if (options.isAbntStandard !== undefined) this.isAbntStandard = options.isAbntStandard;
    }
  }

  /**
   * Verifica se o conteúdo a ser impresso ultrapassa o limite inferior da folha (277 mm).
   */
  checkNewPage(elementHeight: number) {
    const maxUsableY = this.pageHeight - this.bottomMargin; // 277mm
    if (this.y + elementHeight > maxUsableY) {
      this.doc.addPage();
      this.currentPage++;
      this.y = this.topMargin;
    }
  }

  /**
   * Cria uma Capa (Folha de Rosto) com design condizente com a modalidade selecionada.
   */
  drawCover(companyName: string, title: string, subtitle?: string, sector: string = "GESTÃO E MODELAGEM FINANCEIRA") {
    if (this.isAbntStandard) {
      // ------ CAPA NO PADRÃO RIGOROSO ABNT NBR 14724 ------
      // Neutro, centro-alinhado, sem painéis de cor densos

      // Topo: Nome da Organização/Instituição (com recuo normal)
      this.doc.setFont("Helvetica", "bold");
      this.doc.setFontSize(12);
      this.doc.setTextColor(30, 41, 59); // neutral dark grey
      this.doc.text(companyName.toUpperCase(), 105, 45, { align: "center" });
      
      this.doc.setFont("Helvetica", "normal");
      this.doc.setFontSize(9);
      this.doc.setTextColor(100, 116, 139);
      this.doc.text(sector.toUpperCase(), 105, 52, { align: "center" });

      // Réguas horizontais finas delimitando o Título acadêmico centralizado
      this.doc.setDrawColor(203, 213, 225);
      this.doc.setLineWidth(0.35);
      this.doc.line(30, 100, 180, 100);

      this.doc.setFont("Helvetica", "bold");
      this.doc.setFontSize(15);
      this.doc.setTextColor(15, 23, 42); 
      this.doc.text(title.toUpperCase(), 105, 114, { align: "center" });

      if (subtitle) {
        this.doc.setFont("Helvetica", "normal");
        this.doc.setFontSize(10.5);
        this.doc.setTextColor(71, 85, 105);
        this.doc.text(subtitle, 105, 124, { align: "center" });
      }

      this.doc.line(30, 135, 180, 135);

      // Caixa de Nota Explicativa Acadêmica (ABNT) em tons neutros
      const boxY = 165;
      const boxHeight = 44;
      this.doc.setFillColor(250, 250, 250);
      this.doc.rect(30, boxY, 150, boxHeight, "F");
      this.doc.setDrawColor(212, 212, 216);
      this.doc.setLineWidth(0.2);
      this.doc.rect(30, boxY, 150, boxHeight, "S");

      // Texto interno
      this.doc.setFont("Helvetica", "bold");
      this.doc.setFontSize(8);
      this.doc.setTextColor(115, 115, 115);
      this.doc.text("NOTA FINANCEIRA DE GESTÃO E CONFORMIDADE TÉCNICA", 36, boxY + 7);

      this.doc.setFont("Helvetica", "normal");
      this.doc.setFontSize(9);
      this.doc.setTextColor(64, 64, 64);
      const notaTexto = `Demonstrativo gerencial unificado de controle geral, integrando os resultados orçamentários correntes, precificação de SKUs operacionais, pareceres da mentoria e avaliação de múltiplos setoriais de mercado sob a regulamentação ABNT.`;
      const notaLinhas = this.doc.splitTextToSize(notaTexto, 138);
      
      let lineY = boxY + 14;
      notaLinhas.forEach((line: string) => {
        this.doc.text(line, 36, lineY);
        lineY += 5.2;
      });

      // Rodapé da capa com Localização e Ano
      this.doc.setFont("Helvetica", "normal");
      this.doc.setFontSize(10);
      this.doc.setTextColor(115, 115, 115);
      this.doc.text("SÃO PAULO - BRASIL", 105, 255, { align: "center" });
      
      this.doc.setFont("Helvetica", "bold");
      this.doc.setFontSize(10.5);
      this.doc.setTextColor(15, 23, 42);
      this.doc.text("2026", 105, 261, { align: "center" });

    } else {
      // ------ CAPA CORPORATIVA PERSONALIZADA (Com as Cores da Empresa) ------
      const p = this.primaryColor;
      const s = this.secondaryColor;

      // Banner superior na Cor Principal
      this.doc.setFillColor(p.r, p.g, p.b);
      this.doc.rect(0, 0, 210, 75, "F");

      // Ribbon divisor na Cor Secundária
      this.doc.setFillColor(s.r, s.g, s.b);
      this.doc.rect(0, 75, 210, 3.5, "F");

      // Nome da empresa em Branco no banner
      this.doc.setFont("Helvetica", "bold");
      this.doc.setFontSize(13);
      this.doc.setTextColor(255, 255, 255);
      this.doc.text(companyName.toUpperCase(), 105, 36, { align: "center" });
      
      this.doc.setFont("Helvetica", "normal");
      this.doc.setFontSize(8.5);
      this.doc.setTextColor(244, 244, 245); // leve cor de destaque
      this.doc.text(sector.toUpperCase(), 105, 43, { align: "center" });

      // Linhas geométricas de grade modernas em tons sutis da cor principal
      this.doc.setDrawColor(p.r, p.g, p.b);
      this.doc.setLineWidth(0.1);
      for (let borderY = 100; borderY <= 240; borderY += 15) {
        this.doc.line(15, borderY, 195, borderY);
      }

      // Título destacado na Cor Principal
      this.doc.setFont("Helvetica", "bold");
      this.doc.setFontSize(18);
      this.doc.setTextColor(p.r, p.g, p.b);
      this.doc.text(title.toUpperCase(), 105, 122, { align: "center" });

      // Detalhe geométrico na Cor Secundária
      this.doc.setFillColor(s.r, s.g, s.b);
      this.doc.rect(85, 128, 40, 1.2, "F");

      if (subtitle) {
        this.doc.setFont("Helvetica", "normal");
        this.doc.setFontSize(11);
        // Tonalidade suave
        this.doc.setTextColor(71, 85, 105);
        this.doc.text(subtitle, 105, 137, { align: "center" });
      }

      // Card de Parecer com borda na Cor Principal e Destaque na Cor Secundária
      const boxY = 168;
      const boxHeight = 44;
      this.doc.setFillColor(248, 250, 252);
      this.doc.rect(25, boxY, 160, boxHeight, "F");
      
      this.doc.setFillColor(s.r, s.g, s.b); // Barra esquerda na Cor Secundária
      this.doc.rect(25, boxY, 2.2, boxHeight, "F");

      this.doc.setDrawColor(p.r, p.g, p.b);
      this.doc.setLineWidth(0.2);
      this.doc.rect(25, boxY, 160, boxHeight, "S");

      // Textos
      this.doc.setFont("Helvetica", "bold");
      this.doc.setFontSize(8.5);
      this.doc.setTextColor(p.r, p.g, p.b);
      this.doc.text("PARECER EXECUTIVO FINANCEIRO INTEGRAL", 32, boxY + 7);

      this.doc.setFont("Helvetica", "normal");
      this.doc.setFontSize(9.5);
      this.doc.setTextColor(51, 65, 85);
      const notaTexto = `Este documento técnico reúne demonstrativos completos de performance corporativa sob orientações metodológicas e identidade de marca unificadas. Ele apresenta o fluxo de caixa detalhado, o DRE vertical, preços e múltiplos de valuation.`;
      const notaLinhas = this.doc.splitTextToSize(notaTexto, 145);
      
      let lineY = boxY + 14;
      notaLinhas.forEach((line: string) => {
        this.doc.text(line, 32, lineY);
        lineY += 5.2;
      });

      // Marcas de rodapé
      this.doc.setFont("Helvetica", "normal");
      this.doc.setFontSize(10);
      this.doc.setTextColor(p.r, p.g, p.b);
      this.doc.text("SÃO PAULO - BRASIL", 105, 255, { align: "center" });
      
      this.doc.setFont("Helvetica", "bold");
      this.doc.setFontSize(10.5);
      this.doc.setTextColor(s.r, s.g, s.b);
      this.doc.text("2026", 105, 261, { align: "center" });
    }

    // Avançar página para o início real do relatório
    this.doc.addPage();
    this.currentPage = 2;
    this.y = this.topMargin;
  }

  /**
   * Mantido por compatibilidade de compilação.
   */
  drawRunningHeader() {
    // No-op, resolvido no pós-processamento de save()
  }

  /**
   * Adiciona réguas e numerações elegantes de página no pós-processamento.
   */
  drawPageDecorations(pageNum: number, totalPages: number) {
    if (pageNum === 1) return; // Capa tem layout limpo

    if (this.isAbntStandard) {
      // ------ CABEÇALHO/RODAPÉ NEUTRO E ACADÊMICO ABNT ------
      this.doc.setDrawColor(180, 180, 180);
      this.doc.setLineWidth(0.25);
      this.doc.line(this.leftMargin, 20, this.pageWidth - this.rightMargin, 20);

      this.doc.setFont("Helvetica", "bold");
      this.doc.setFontSize(8);
      this.doc.setTextColor(80, 80, 80);
      this.doc.text("RELATÓRIO FINANCEIRO CONSOLIDADO INTEGRAL", this.leftMargin, 16.2);

      this.doc.setFont("Helvetica", "normal");
      this.doc.setFontSize(8.5);
      this.doc.setTextColor(80, 80, 80);
      this.doc.text(`${pageNum} / ${totalPages}`, this.pageWidth - this.rightMargin, 16.2, { align: "right" });

      // Rodapé
      this.doc.setDrawColor(220, 220, 220);
      this.doc.setLineWidth(0.15);
      this.doc.line(this.leftMargin, 280, this.pageWidth - this.rightMargin, 280);

      this.doc.setFont("Helvetica", "normal");
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(115, 115, 115);
      this.doc.text("Valora AI  •  Emissão em conformidade contábil e orçamentária geral", this.leftMargin, 284.5);
      this.doc.text("REGRAS ABNT NBR 14724 & TABULAR IBGE", this.pageWidth - this.rightMargin, 284.5, { align: "right" });
    } else {
      // ------ CABEÇALHO/RODAPÉ EXECUTIVO DE CORES DE MARCA ------
      const p = this.primaryColor;
      const s = this.secondaryColor;

      // Régua superior na Cor Principal
      this.doc.setDrawColor(p.r, p.g, p.b);
      this.doc.setLineWidth(0.35);
      this.doc.line(this.leftMargin, 20, this.pageWidth - this.rightMargin, 20);

      // Quadrado de branding na Cor Secundária
      this.doc.setFillColor(s.r, s.g, s.b);
      this.doc.rect(this.leftMargin, 14, 2.5, 2.5, "F");

      this.doc.setFont("Helvetica", "bold");
      this.doc.setFontSize(8.5);
      this.doc.setTextColor(p.r, p.g, p.b);
      this.doc.text("VALORA AI", this.leftMargin + 4.5, 16.2);

      this.doc.setFont("Helvetica", "normal");
      this.doc.setFontSize(8.4);
      this.doc.setTextColor(100, 116, 139);
      this.doc.text(" |   DIRETORIA DE ADMINISTRAÇÃO E FINANÇAS CORPORATIVAS", this.leftMargin + 21, 16.2);

      // Numeração estilizada na Cor Secundária
      this.doc.setFont("Helvetica", "bold");
      this.doc.setFontSize(8.5);
      this.doc.setTextColor(s.r, s.g, s.b);
      this.doc.text(`SOLHAS ${pageNum} DE ${totalPages}`, this.pageWidth - this.rightMargin, 16.2, { align: "right" });

      // Rodapé
      this.doc.setDrawColor(p.r, p.g, p.b);
      this.doc.setLineWidth(0.12);
      this.doc.line(this.leftMargin, 280, this.pageWidth - this.rightMargin, 280);

      this.doc.setFont("Helvetica", "italic");
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(148, 163, 184);
      this.doc.text("Dafne AI Neural Engine - Relatório de Inteligência Orçamentária Avançada", this.leftMargin, 284.5);
      
      this.doc.setFont("Helvetica", "bold");
      this.doc.setTextColor(p.r, p.g, p.b);
      this.doc.text("COMPARTILHAMENTO CORPORATIVO PRIVADO", this.pageWidth - this.rightMargin, 284.5, { align: "right" });
    }
  }

  /**
   * Adiciona Título de Seção Primária.
   */
  addPrimaryHeading(text: string) {
    this.checkNewPage(18);
    this.y += 4;

    if (this.isAbntStandard) {
      // Normas ABNT: Sem adereços coloridos, apenas texto em negrito preto com recuo regulamentar
      this.doc.setFont("Helvetica", "bold");
      this.doc.setFontSize(12);
      this.doc.setTextColor(0, 0, 0); // Preto absoluto
      this.doc.text(text.toUpperCase(), this.leftMargin, this.y);
    } else {
      // Personalizado: Retângulo esquerdo na Cor Secundária e Título na Cor Principal
      const s = this.secondaryColor;
      this.doc.setFillColor(s.r, s.g, s.b);
      this.doc.rect(this.leftMargin - 6, this.y - 4, 3.2, 5, "F");

      this.doc.setFont("Helvetica", "bold");
      this.doc.setFontSize(12);
      const p = this.primaryColor;
      this.doc.setTextColor(p.r, p.g, p.b);
      this.doc.text(text.toUpperCase(), this.leftMargin, this.y);
    }

    this.y += 8;
  }

  /**
   * Adiciona Título de Seção Secundária.
   */
  addSecondaryHeading(text: string) {
    this.checkNewPage(14);
    this.y += 2;

    if (this.isAbntStandard) {
      this.doc.setFont("Helvetica", "bold");
      this.doc.setFontSize(11);
      this.doc.setTextColor(40, 40, 40);
      this.doc.text(text, this.leftMargin, this.y);
    } else {
      const p = this.primaryColor;
      this.doc.setFillColor(p.r, p.g, p.b);
      this.doc.rect(this.leftMargin - 6, this.y - 3.8, 3.2, 4.2, "F");

      this.doc.setFont("Helvetica", "bold");
      this.doc.setFontSize(11.5);
      this.doc.setTextColor(p.r, p.g, p.b);
      this.doc.text(text, this.leftMargin, this.y);
    }

    this.y += 7.5;
  }

  /**
   * Escreve parágrafo de texto corrido.
   */
  addParagraph(text: string) {
    if (!text || !text.trim()) return;
    const cleanText = text.replace(/[*_`]/g, "").trim();
    const wrappedLines = this.doc.splitTextToSize(cleanText, this.contentWidth);

    this.doc.setFont("Helvetica", "normal");
    this.doc.setFontSize(11);
    this.doc.setTextColor(30, 41, 59); // Slate-800

    wrappedLines.forEach((lineText: string) => {
      this.checkNewPage(7);
      this.doc.text(lineText, this.leftMargin, this.y);
      this.y += 6.35; // Espaçamento duplo conforme ABNT
    });

    this.y += 2.5; // Espaçamento entre blocos
  }

  /**
   * Adiciona bullet point.
   */
  addBulletItem(symbol: string, text: string) {
    const cleanText = text.replace(/[*_`]/g, "").trim();
    const wrapped = this.doc.splitTextToSize(cleanText, this.contentWidth - 8);

    this.doc.setFont("Helvetica", "normal");
    this.doc.setFontSize(10.5);
    this.doc.setTextColor(51, 65, 85);

    wrapped.forEach((line: string, index: number) => {
      this.checkNewPage(6);
      if (index === 0) {
        // Enfatiza o símbolo marcador em laranja (se personalizado) ou neutro (se ABNT)
        if (this.isAbntStandard) {
          this.doc.setTextColor(0, 0, 0);
          this.doc.text(`${symbol}`, this.leftMargin + 2, this.y);
        } else {
          const s = this.secondaryColor;
          this.doc.setTextColor(s.r, s.g, s.b);
          this.doc.text(`${symbol}`, this.leftMargin + 2, this.y);
        }
        
        this.doc.setTextColor(51, 65, 85);
        this.doc.text(line, this.leftMargin + 6, this.y);
      } else {
        this.doc.text(line, this.leftMargin + 6, this.y);
      }
      this.y += 5.2;
    });

    this.y += 1.5;
  }

  /**
   * Cria caixas destacadas de sumário de KPIs e parâmetros de rentabilidade.
   */
  addSummaryCard(title: string, metrics: { label: string; value: string; color?: { r: number; g: number; b: number } }[]) {
    this.checkNewPage(35);
    this.y += 2;

    const cardHeight = 23;
    const width = this.contentWidth;

    if (this.isAbntStandard) {
      // ------ CARD NEUTRO MONOCROMÁTICO (ABNT) ------
      this.doc.setFillColor(250, 250, 250);
      this.doc.rect(this.leftMargin, this.y, width, cardHeight, "F");

      this.doc.setDrawColor(200, 200, 200);
      this.doc.setLineWidth(0.2);
      this.doc.rect(this.leftMargin, this.y, width, cardHeight, "S");

      // Título do Card
      this.doc.setFont("Helvetica", "bold");
      this.doc.setFontSize(8);
      this.doc.setTextColor(115, 115, 115);
      this.doc.text(title.toUpperCase(), this.leftMargin + 5, this.y + 6);

      // Colunas dinâmicas
      const colWidth = width / metrics.length;
      metrics.forEach((m, idx) => {
        const posX = this.leftMargin + (idx * colWidth) + 5;

        this.doc.setFont("Helvetica", "bold");
        this.doc.setFontSize(7.5);
        this.doc.setTextColor(140, 140, 140);
        this.doc.text(m.label.toUpperCase(), posX, this.y + 12);

        this.doc.setFont("Helvetica", "bold");
        this.doc.setFontSize(10.5);
        this.doc.setTextColor(15, 23, 42); // Escuro neutro
        this.doc.text(m.value, posX, this.y + 18.2);
      });

    } else {
      // ------ CARD VIBRANTE COM IDENTIDADE DE MARCA CORPORATIVA ------
      const p = this.primaryColor;
      const s = this.secondaryColor;

      this.doc.setFillColor(248, 250, 252);
      this.doc.rect(this.leftMargin, this.y, width, cardHeight, "F");

      // Ribbon esquerdo na Cor Secundária
      this.doc.setFillColor(s.r, s.g, s.b);
      this.doc.rect(this.leftMargin, this.y, 2.2, cardHeight, "F");

      this.doc.setDrawColor(p.r, p.g, p.b);
      this.doc.setLineWidth(0.12);
      this.doc.rect(this.leftMargin, this.y, width, cardHeight, "S");

      this.doc.setFont("Helvetica", "bold");
      this.doc.setFontSize(8);
      this.doc.setTextColor(p.r, p.g, p.b);
      this.doc.text(title.toUpperCase(), this.leftMargin + 5, this.y + 6);

      const colWidth = width / metrics.length;
      metrics.forEach((m, idx) => {
        const posX = this.leftMargin + (idx * colWidth) + 5;

        this.doc.setFont("Helvetica", "bold");
        this.doc.setFontSize(7.5);
        this.doc.setTextColor(120, 120, 120);
        this.doc.text(m.label.toUpperCase(), posX, this.y + 12);

        this.doc.setFont("Helvetica", "bold");
        this.doc.setFontSize(11);
        
        if (m.color) {
          this.doc.setTextColor(m.color.r, m.color.g, m.color.b);
        } else {
          this.doc.setTextColor(p.r, p.g, p.b);
        }
        
        this.doc.text(m.value, posX, this.y + 18.2);
      });
    }

    this.y += cardHeight + 6;
  }

  /**
   * Desenha tabelas completas em DRE ou Skus.
   * Suporta o estilo minimalista tabular IBGE puro e a tabela executiva zebrada e colorida.
   */
  addAbntTable(columns: TableColumn[], data: any[], sourceTitle: string = "Elaborado pelo Gestor (2026)") {
    const tableWidth = this.contentWidth;
    const requiredHeight = 8.5 + (data.length * 6.8) + 12;
    this.checkNewPage(requiredHeight);

    this.y += 2;

    if (this.isAbntStandard) {
      // ------ TABEÇÃO IBGE ACADÊMICO REULAMENTAR ------
      // Apenas divisores horizontais pretos, sem preenchimentos coloridos nas células ou zebra.
      const headerHeight = 7.5;

      this.doc.setDrawColor(0, 0, 0); // Traço preto
      this.doc.setLineWidth(0.35);
      // Linha do topo do cabeçalho
      this.doc.line(this.leftMargin, this.y, this.leftMargin + tableWidth, this.y);

      // Titulação colunas
      this.doc.setFont("Helvetica", "bold");
      this.doc.setFontSize(8.5);
      this.doc.setTextColor(0, 0, 0);

      let headerX = this.leftMargin;
      columns.forEach((col) => {
        let alignX = headerX;
        if (col.align === "right") alignX += col.width - 2;
        else if (col.align === "center") alignX += col.width / 2;
        else alignX += 2.2;

        this.doc.text(col.header.toUpperCase(), alignX, this.y + 4.8, { align: col.align || "left" });
        headerX += col.width;
      });

      this.y += headerHeight;

      // Divider horizontal pós cabeçalho
      this.doc.setLineWidth(0.2);
      this.doc.line(this.leftMargin, this.y, this.leftMargin + tableWidth, this.y);

      // Linhas de dados
      const rowHeight = 6.2;
      data.forEach((row, rowIdx) => {
        this.checkNewPage(8);
        const isTotalRow = row.isBold || row.isTotal;

        if (isTotalRow) {
          // Traço sutil divisor especial para totais
          this.doc.setDrawColor(0, 0, 0);
          this.doc.setLineWidth(0.2);
          this.doc.line(this.leftMargin, this.y, this.leftMargin + tableWidth, this.y);
          this.doc.setFont("Helvetica", "bold");
          this.doc.setTextColor(0, 0, 0);
        } else {
          this.doc.setFont("Helvetica", "normal");
          this.doc.setTextColor(60, 60, 60);
        }
        this.doc.setFontSize(8.5);

        let dataX = this.leftMargin;
        columns.forEach((col) => {
          let alignX = dataX;
          if (col.align === "right") alignX += col.width - 2;
          else if (col.align === "center") alignX += col.width / 2;
          else alignX += 2.2;

          const val = row[col.key] !== undefined ? String(row[col.key]) : "";
          const maxChars = Math.floor(col.width * 0.65);
          const truncatedVal = val.length > maxChars 
            ? val.substring(0, maxChars - 3) + "..." 
            : val;

          this.doc.text(truncatedVal, alignX, this.y + 4.2, { align: col.align || "left" });
          dataX += col.width;
        });

        this.y += rowHeight;
      });

      // Linha de encerramento da tabela
      this.doc.setDrawColor(0, 0, 0);
      this.doc.setLineWidth(0.35);
      this.doc.line(this.leftMargin, this.y, this.leftMargin + tableWidth, this.y);
      this.y += 4;

    } else {
      // ------ TABEÇÃO EXECUTIVO ZEBRADO COM IDENTIDADE DE MARCA ------
      const p = this.primaryColor;
      const s = this.secondaryColor;
      const headerHeight = 7.5;

      // Header com fundo preenchido na Cor Principal
      this.doc.setFillColor(p.r, p.g, p.b);
      this.doc.rect(this.leftMargin, this.y, tableWidth, headerHeight, "F");

      this.doc.setDrawColor(s.r, s.g, s.b);
      this.doc.setLineWidth(0.4);
      this.doc.line(this.leftMargin, this.y, this.leftMargin + tableWidth, this.y);

      this.doc.setFont("Helvetica", "bold");
      this.doc.setFontSize(8.5);
      this.doc.setTextColor(255, 255, 255); // Branco completo de alto contraste

      let headerX = this.leftMargin;
      columns.forEach((col) => {
        let alignX = headerX;
        if (col.align === "right") alignX += col.width - 2;
        else if (col.align === "center") alignX += col.width / 2;
        else alignX += 2.2;

        this.doc.text(col.header.toUpperCase(), alignX, this.y + 4.8, { align: col.align || "left" });
        headerX += col.width;
      });

      this.y += headerHeight;

      // Divider horizontal
      this.doc.setDrawColor(s.r, s.g, s.b);
      this.doc.setLineWidth(0.35);
      this.doc.line(this.leftMargin, this.y, this.leftMargin + tableWidth, this.y);

      // Linhas
      const rowHeight = 6.2;
      data.forEach((row, rowIdx) => {
        this.checkNewPage(8);
        const isTotalRow = row.isBold || row.isTotal;

        if (isTotalRow) {
          // Total destacado por um leve tom secundário
          this.doc.setFillColor(Math.floor((s.r + 255) / 2), Math.floor((s.g + 255) / 2), Math.floor((s.b + 255) / 2));
          this.doc.rect(this.leftMargin, this.y, tableWidth, rowHeight, "F");

          this.doc.setDrawColor(s.r, s.g, s.b);
          this.doc.setLineWidth(0.25);
          this.doc.line(this.leftMargin, this.y, this.leftMargin + tableWidth, this.y);
          this.doc.setFont("Helvetica", "bold");
          this.doc.setTextColor(p.r, p.g, p.b);
        } else if (rowIdx % 2 === 1) {
          // Zebrado sutil no tom complementar
          this.doc.setFillColor(Math.floor((p.r + 255 * 8) / 9), Math.floor((p.g + 255 * 8) / 9), Math.floor((p.b + 255 * 8) / 9));
          this.doc.rect(this.leftMargin, this.y, tableWidth, rowHeight, "F");
        }

        // Delimitadores discretos
        this.doc.setDrawColor(Math.floor((p.r + 255 * 11) / 12), Math.floor((p.g + 255 * 11) / 12), Math.floor((p.b * 11 + 255) / 12));
        this.doc.setLineWidth(0.08);
        this.doc.line(this.leftMargin, this.y + rowHeight, this.leftMargin + tableWidth, this.y + rowHeight);

        if (!isTotalRow) {
          this.doc.setFont("Helvetica", "normal");
          this.doc.setTextColor(51, 65, 85);
        }
        this.doc.setFontSize(8.5);

        let dataX = this.leftMargin;
        columns.forEach((col) => {
          let alignX = dataX;
          if (col.align === "right") alignX += col.width - 2;
          else if (col.align === "center") alignX += col.width / 2;
          else alignX += 2.2;

          const val = row[col.key] !== undefined ? String(row[col.key]) : "";
          const maxChars = Math.floor(col.width * 0.65);
          const truncatedVal = val.length > maxChars 
            ? val.substring(0, maxChars - 3) + "..." 
            : val;

          this.doc.text(truncatedVal, alignX, this.y + 4.2, { align: col.align || "left" });
          dataX += col.width;
        });

        this.y += rowHeight;
      });

      // Fechamento base
      this.doc.setDrawColor(p.r, p.g, p.b);
      this.doc.setLineWidth(0.35);
      this.doc.line(this.leftMargin, this.y, this.leftMargin + tableWidth, this.y);
      this.y += 4;
    }

    // Rodapé de Fonte
    this.checkNewPage(8);
    this.doc.setFont("Helvetica", "italic");
    this.doc.setFontSize(8);
    this.doc.setTextColor(148, 163, 184); // Slate 400
    this.doc.text(`Fonte: ${sourceTitle}`, this.leftMargin, this.y);
    this.y += 8;
  }

  /**
   * Pós-processa decorações e salva o arquivo.
   */
  save(filename: string) {
    const total = this.currentPage;
    for (let i = 1; i <= total; i++) {
      this.doc.setPage(i);
      this.drawPageDecorations(i, total);
    }
    this.doc.save(filename);
  }
}
