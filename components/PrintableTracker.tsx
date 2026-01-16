
import React, { useRef, useState } from 'react';
import { Habit, User } from '../types';
import { getDaysInMonth } from '../utils/habitUtils';
import { MONTHS } from '../constants';
import { jsPDF } from 'jspdf';

interface PrintableTrackerProps {
  user: User;
  habits: Habit[];
}

const PrintableTracker: React.FC<PrintableTrackerProps> = ({ user, habits }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  
  // Ref kept for the on-screen preview
  const contentRef = useRef<HTMLDivElement>(null);

  const handleGeneratePDF = async () => {
    setIsGenerating(true);

    // Allow UI to update (spinner) before blocking main thread with PDF gen
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Config
      const margin = 10;
      const pageWidth = 297;
      const pageHeight = 210;
      const contentWidth = pageWidth - (margin * 2);
      const rowHeight = 7; // Compact rows
      const startY = 30; // Header finishes around here
      
      const colors = {
        slate900: '#0f172a',
        slate600: '#475569',
        slate400: '#94a3b8',
        slate200: '#e2e8f0',
        white: '#ffffff'
      };

      // Helper: Draw Header
      const drawHeader = (pageNum: number, totalPages: number) => {
        doc.setTextColor(colors.slate900);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text('HABIT TRACKER PROTOCOL', margin, 18);

        doc.setFontSize(9);
        doc.setTextColor(colors.slate600);
        doc.text(`${MONTHS[month].toUpperCase()} ${year} // PILOT: ${user.name.toUpperCase()}`, margin, 24);

        // Confidential Tag
        doc.setFillColor(colors.slate900);
        doc.rect(pageWidth - margin - 50, 13, 50, 7, 'F');
        doc.setTextColor(colors.white);
        doc.setFontSize(7);
        doc.text('CONFIDENTIAL / ANALOG SYNC', pageWidth - margin - 25, 17.5, { align: 'center' });

        if (totalPages > 1) {
             doc.setTextColor(colors.slate400);
             doc.text(`PAGE ${pageNum} OF ${totalPages}`, pageWidth - margin, 24, { align: 'right' });
        }
      };

      // Helper: Draw Grid
      const drawGrid = (pageHabits: Habit[]) => {
          const habitColWidth = 60;
          const dayColWidth = (contentWidth - habitColWidth) / daysInMonth;
          
          // Header Row
          doc.setDrawColor(colors.slate900);
          doc.setLineWidth(0.3);
          doc.setFillColor(colors.slate200);
          doc.rect(margin, startY, contentWidth, rowHeight, 'FD');
          
          doc.setTextColor(colors.slate900);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.text('HABIT METRIC', margin + 3, startY + 4.5);
          
          // Day Numbers
          doc.setFontSize(6);
          for (let i = 1; i <= daysInMonth; i++) {
            const x = margin + habitColWidth + ((i - 1) * dayColWidth);
            const centerX = x + (dayColWidth / 2);
            doc.line(x, startY, x, startY + rowHeight);
            doc.text(i.toString(), centerX, startY + 4.5, { align: 'center' });
          }

          // Rows
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');

          // Ensure we draw at least a few empty rows if the page is empty, or fill to bottom?
          const rowsToDraw = Math.max(pageHabits.length, 5);

          for (let r = 0; r < rowsToDraw; r++) {
            const y = startY + rowHeight + (r * rowHeight);
            const habit = pageHabits[r];

            // Row Outline
            doc.setDrawColor(colors.slate900);
            doc.setLineWidth(0.2);
            doc.rect(margin, y, contentWidth, rowHeight);
            
            // Habit Name
            if (habit) {
              doc.setTextColor(colors.slate900);
              doc.text(habit.name.toUpperCase(), margin + 3, y + 4.5);
            } else {
              doc.setTextColor(colors.slate400);
              doc.text('____________________', margin + 3, y + 4.5);
            }

            // Vertical Lines
            doc.setDrawColor(colors.slate400);
            doc.setLineWidth(0.1);
            for (let d = 0; d < daysInMonth; d++) {
               const x = margin + habitColWidth + (d * dayColWidth);
               doc.line(x, y, x, y + rowHeight);
            }
            
            // Main Divider
            doc.setDrawColor(colors.slate900);
            doc.setLineWidth(0.3);
            doc.line(margin + habitColWidth, y, margin + habitColWidth, y + rowHeight);
          }
      };

      // Helper: Draw Bottom Widgets
      const drawWidgets = () => {
          const widgetHeight = 35;
          const y = pageHeight - margin - widgetHeight - 5; // 5mm above footer/bottom
          const boxGap = 8;
          const sectionWidth = (contentWidth - (boxGap * 2)) / 3;

           // Helper for section header
          const drawSectionHeader = (x: number, y: number, title: string) => {
             doc.setFontSize(7);
             doc.setFont('helvetica', 'bold');
             doc.setTextColor(colors.slate900);
             doc.text(title, x + 2, y + 4);
             doc.setLineWidth(0.2);
             doc.setDrawColor(colors.slate900);
             doc.line(x, y + 6, x + sectionWidth, y + 6);
          };

          // 1. Weekly Focus
          const box1X = margin;
          doc.setDrawColor(colors.slate900);
          doc.setLineWidth(0.3);
          doc.rect(box1X, y, sectionWidth, widgetHeight);
          drawSectionHeader(box1X, y, 'WEEKLY FOCUS / OBJECTIVES');
          
          doc.setDrawColor(colors.slate400);
          for(let l=0; l<3; l++) {
             const lineY = y + 14 + (l * 8);
             doc.rect(box1X + 4, lineY - 2.5, 2.5, 2.5); // Checkbox
             doc.line(box1X + 10, lineY, box1X + sectionWidth - 4, lineY);
          }

          // 2. Mood Graph
          const box2X = margin + sectionWidth + boxGap;
          doc.setDrawColor(colors.slate900);
          doc.rect(box2X, y, sectionWidth, widgetHeight);
          drawSectionHeader(box2X, y, 'MOOD / ENERGY GRAPH');
          
          doc.setDrawColor(colors.slate400);
          doc.line(box2X + 4, y + 28, box2X + sectionWidth - 4, y + 28); // X
          doc.line(box2X + 4, y + 28, box2X + 4, y + 10); // Y

          // 3. Screen Time / Wins
          const box3X = box2X + sectionWidth + boxGap;
          doc.setDrawColor(colors.slate900);
          doc.rect(box3X, y, sectionWidth, widgetHeight);
          drawSectionHeader(box3X, y, 'SCREEN TIME / WINS');
          
          doc.setDrawColor(colors.slate400);
          // Grid of squares
          for(let i=0; i<12; i++) {
             const sqSize = 3.5;
             const gap = 1.5;
             const cols = 6;
             const x = box3X + 4 + ((i % cols) * (sqSize + gap));
             const row = Math.floor(i / cols);
             const yPos = y + 10 + (row * (sqSize + gap));
             doc.rect(x, yPos, sqSize, sqSize);
          }
          doc.setFontSize(6);
          doc.setTextColor(colors.slate600);
          doc.text('TARGET < 2.5H', box3X + 4, y + 25);
          
          // Win Box
          doc.rect(box3X + 4, y + 28, sectionWidth - 8, 5);
          doc.text('BIGGEST WIN:', box3X + 5, y + 31.5);
      };
      
      const drawFooter = () => {
          doc.setFontSize(6);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(colors.slate400);
          const footerText = 'PRECISION THROUGH CONSISTENCY. FOCUS THROUGH MANUAL ENTRY.';
          doc.text(footerText, pageWidth / 2, pageHeight - 5, { align: 'center' });
      };

      // PAGINATION LOGIC
      // Available height for grid on a widget page
      // pageHeight(210) - startY(30) - widgets(35) - widgetBuffer(5) - bottomMargin(10) = ~130mm
      const availableHeightWidgetPage = 130;
      const maxRowsWidgetPage = Math.floor(availableHeightWidgetPage / rowHeight); // ~18 rows
      
      // Available height for grid on a full page
      // pageHeight(210) - startY(30) - bottomMargin(10) = ~170mm
      const availableHeightFullPage = 170;
      const maxRowsFullPage = Math.floor(availableHeightFullPage / rowHeight); // ~24 rows

      const chunks: Habit[][] = [];
      let remaining = [...habits];

      // Logic: If we can fit remaining in the LAST page configuration, do it. Else take a FULL page.
      while (remaining.length > 0) {
          if (remaining.length <= maxRowsWidgetPage) {
              chunks.push(remaining);
              remaining = [];
          } else {
              chunks.push(remaining.slice(0, maxRowsFullPage));
              remaining = remaining.slice(maxRowsFullPage);
          }
      }
      if (chunks.length === 0) chunks.push([]); // Ensure at least 1 page

      // Generate Pages
      chunks.forEach((chunk, index) => {
          if (index > 0) doc.addPage('a4', 'landscape');
          const isLastPage = index === chunks.length - 1;

          drawHeader(index + 1, chunks.length);
          drawGrid(chunk);
          if (isLastPage) drawWidgets();
          drawFooter();
      });

      doc.save(`UltimateHabitTracker_${user.name.replace(/[^a-zA-Z0-9]/g, '_')}_${MONTHS[month]}.pdf`);
      
    } catch (err) {
      console.error("PDF Gen Error:", err);
      alert("Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white text-slate-900 min-h-screen flex flex-col items-center p-4 md:p-8">
      
      <div className="mb-6 w-full max-w-5xl flex flex-col md:flex-row justify-between items-center gap-4 no-print">
        <div>
           <h2 className="text-xl font-bold text-slate-700">Printable Preview</h2>
           <p className="text-sm text-slate-500">Optimized for A4 Landscape. Compact layout.</p>
        </div>
        <button 
          onClick={handleGeneratePDF}
          disabled={isGenerating}
          className={`bg-slate-900 text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-emerald-600 transition shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2`}
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Generating PDF...</span>
            </>
          ) : (
            <span>Download PDF</span>
          )}
        </button>
      </div>

      {/* Printable Area Preview - Scrollable for long lists */}
      <div className="w-full max-w-[297mm] overflow-auto border border-slate-200 shadow-2xl bg-slate-100 p-4">
        <div ref={contentRef} id="tracker-content" className="bg-white p-8 w-[297mm] min-h-[210mm] relative mx-auto box-border shadow-sm">
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 mb-4">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Habit Tracker Protocol</h1>
              <p className="text-xs font-bold text-slate-500 uppercase">{MONTHS[month]} {year} // Pilot: {user.name}</p>
            </div>
            <div className="text-right">
              <div className="inline-block px-2 py-0.5 bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest">Confidential / Analog Sync</div>
            </div>
          </div>

          <div className="flex flex-col h-full">
            {/* Main Grid Section */}
            <div className="mb-4">
              <table className="w-full border-collapse border border-slate-900 table-fixed">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-900 p-1 text-left w-[20%] text-[10px] font-bold uppercase text-slate-900">Habit Metric</th>
                    {Array.from({length: daysInMonth}).map((_, i) => (
                      <th key={i} className="border border-slate-900 p-0.5 text-center text-[8px] text-slate-700">{i + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {habits.length > 0 ? habits.map((h, i) => (
                    <tr key={i} className="h-6">
                      <td className="border border-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase truncate text-slate-800">{h.name}</td>
                      {Array.from({length: daysInMonth}).map((_, j) => (
                        <td key={j} className="border border-slate-900"></td>
                      ))}
                    </tr>
                  )) : null}
                  {/* Fill a few empty rows for preview aesthetic if list is short */}
                  {Array.from({length: Math.max(0, 5 - habits.length)}).map((_, i) => (
                    <tr key={`empty-${i}`} className="h-6">
                      <td className="border border-slate-900 px-2 italic text-slate-300 text-[10px]">____________________</td>
                      {Array.from({length: daysInMonth}).map((_, j) => (
                        <td key={j} className="border border-slate-900"></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Widgets - Preview Only (Fixed at bottom relative to content in preview, but PDF logic handles placement) */}
            <div className="mt-auto pt-4 grid grid-cols-3 gap-4 border-t border-dashed border-slate-300">
              {/* Weekly Focus */}
              <div className="border border-slate-900 p-2 h-24">
                <h3 className="text-[9px] font-black uppercase tracking-widest mb-2 border-b border-slate-300 pb-1 text-slate-900">Weekly Focus</h3>
                <div className="space-y-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex space-x-2 items-center"><div className="w-1.5 h-1.5 border border-slate-400"></div><div className="flex-1 border-b border-slate-200"></div></div>
                  ))}
                </div>
              </div>
              
              {/* Mood */}
              <div className="border border-slate-900 p-2 h-24">
                <h3 className="text-[9px] font-black uppercase tracking-widest mb-2 border-b border-slate-300 pb-1 text-slate-900">Mood Graph</h3>
                <div className="w-full h-14 border-l border-b border-slate-300 relative"></div>
              </div>

              {/* Screen Time */}
              <div className="border border-slate-900 p-2 h-24">
                  <h3 className="text-[9px] font-black uppercase tracking-widest mb-2 border-b border-slate-300 pb-1 text-slate-900">Screen Time</h3>
                  <div className="grid grid-cols-6 gap-0.5 mb-2">
                    {Array.from({length: 12}).map((_, i) => (
                      <div key={i} className="aspect-square border border-slate-100 flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full border border-slate-200"></div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[7px] text-slate-400 font-bold uppercase">Target: &lt; 2.5 Hrs</p>
               </div>
            </div>
            
            <div className="text-center mt-4">
               <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-300 italic">Precision through consistency. Focus through manual entry.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableTracker;
