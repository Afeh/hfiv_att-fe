import { jsPDF } from "jspdf";
import type { Contributor, Expenditure, Summary } from "./api";

const PAGE_WIDTH = 595.28; // A4 width in points
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const BOTTOM_LIMIT = PAGE_HEIGHT - MARGIN - 24;

// jsPDF's built-in fonts only cover Latin-1, so anything outside it is replaced.
const CURRENCY_CODES: Record<string, string> = {
  "₦": "NGN",
  "₹": "INR",
  "₱": "PHP",
  "₵": "GHS",
  "₺": "TRY",
  "₴": "UAH",
  "฿": "THB",
};

function latin1(value: string): string {
  let out = "";
  for (const char of value) {
    out += (char.codePointAt(0) ?? 0) <= 0xff ? char : "?";
  }
  return out.replace(/[\r\n\t]+/g, " ");
}

function currencyPrefix(symbol: string): string {
  const trimmed = symbol.trim();
  if (/^[\x20-\x7e]+$/.test(trimmed)) return trimmed;
  const code = CURRENCY_CODES[trimmed];
  return code ? `${code} ` : "";
}

type Cell = { text: string; x: number; align?: "left" | "right" };

export function exportContributionsPdf(data: {
  summary: Summary;
  contributors: Contributor[];
  expenditures: Expenditure[];
}) {
  const { summary, contributors, expenditures } = data;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const left = MARGIN;
  const right = PAGE_WIDTH - MARGIN;
  const prefix = currencyPrefix(summary.currency_symbol);
  const money = (amount: number) =>
    `${prefix}${Math.round(amount).toLocaleString("en-US")}`;

  let y = MARGIN + 10;

  const pageBreak = (needed: number) => {
    if (y + needed > BOTTOM_LIMIT) {
      doc.addPage();
      y = MARGIN + 10;
    }
  };

  const section = (title: string) => {
    pageBreak(70);
    y += 24;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30);
    doc.text(latin1(title.toUpperCase()), left, y);
    y += 6;
    doc.setDrawColor(190);
    doc.setLineWidth(0.75);
    doc.line(left, y, right, y);
    y += 16;
  };

  const row = (
    cells: Cell[],
    opts?: { bold?: boolean; divider?: boolean; indent?: number }
  ) => {
    pageBreak(20);
    doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
    doc.setFontSize(10);
    doc.setTextColor(20);
    for (const cell of cells) {
      doc.text(latin1(cell.text), cell.x, y, { align: cell.align ?? "left" });
    }
    y += 4;
    if (opts?.divider !== false) {
      doc.setDrawColor(230);
      doc.setLineWidth(0.5);
      doc.line(left + (opts?.indent ?? 0), y, right, y);
    }
    y += 12;
  };

  const truncate = (text: string, maxWidth: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const safe = latin1(text);
    if (doc.getTextWidth(safe) <= maxWidth) return safe;
    let cut = safe;
    while (cut.length > 1 && doc.getTextWidth(`${cut}...`) > maxWidth) {
      cut = cut.slice(0, -1);
    }
    return `${cut}...`;
  };

  // ── Header ────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.setTextColor(20);
  doc.text(latin1(summary.group_name), left, y);
  y += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text("Contributions report", left, y);
  doc.text(
    latin1(`Generated ${new Date().toLocaleDateString("en-GB")}`),
    right,
    y,
    { align: "right" }
  );
  y += 10;
  doc.setDrawColor(30);
  doc.setLineWidth(1.5);
  doc.line(left, y, right, y);
  doc.setTextColor(20);

  // ── Overview ──────────────────────────────────────────────────────
  section("Overview");
  row([
    { text: "Total contributed", x: left },
    { text: money(summary.total_contributed), x: right, align: "right" },
  ]);
  row([
    { text: "Total expenditure", x: left },
    { text: money(summary.total_expenditure), x: right, align: "right" },
  ]);
  row(
    [
      { text: "Remaining balance", x: left },
      { text: money(summary.remaining_amount), x: right, align: "right" },
    ],
    { bold: true, divider: false }
  );

  // ── Contributors ──────────────────────────────────────────────────
  section(`Contributors (${contributors.length})`);
  if (contributors.length === 0) {
    row([{ text: "No contributions recorded yet.", x: left }], {
      divider: false,
    });
  } else {
    row(
      [
        { text: "Name", x: left + 20 },
        { text: "Paid", x: right, align: "right" },
      ],
      { bold: true }
    );
    contributors.forEach((contributor, index) => {
      row([
        { text: `${index + 1}.`, x: left },
        { text: contributor.person_name, x: left + 20 },
        { text: money(contributor.total_contributed), x: right, align: "right" },
      ]);
    });
    row(
      [
        { text: "Total", x: left },
        { text: money(summary.total_contributed), x: right, align: "right" },
      ],
      { bold: true, divider: false }
    );
  }

  // ── Expenditure ───────────────────────────────────────────────────
  section(`Expenditure (${expenditures.length})`);
  if (expenditures.length === 0) {
    row([{ text: "No expenditure recorded yet.", x: left }], {
      divider: false,
    });
  } else {
    const descriptionWidth = right - (left + 70) - 110;
    row(
      [
        { text: "Date", x: left },
        { text: "Description", x: left + 70 },
        { text: "Amount", x: right, align: "right" },
      ],
      { bold: true }
    );
    expenditures.forEach((item) => {
      const category = item.category_name ? ` (${item.category_name})` : "";
      row([
        { text: item.date_spent, x: left },
        { text: truncate(`${item.description}${category}`, descriptionWidth), x: left + 70 },
        { text: money(item.amount), x: right, align: "right" },
      ]);
    });
    row(
      [
        {
          text: "Total",
          x: left,
        },
        { text: money(summary.total_expenditure), x: right, align: "right" },
      ],
      { bold: true, divider: false }
    );
  }

  // ── Page numbers ──────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      latin1(`Page ${page} of ${pageCount}`),
      PAGE_WIDTH / 2,
      PAGE_HEIGHT - MARGIN / 2,
      { align: "center" }
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`contributions-report-${stamp}.pdf`);
}
