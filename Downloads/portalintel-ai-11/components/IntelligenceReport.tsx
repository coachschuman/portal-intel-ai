
import React from 'react';

interface IntelligenceReportProps {
  text: string;
  className?: string;
}

/**
 * A high-fidelity Markdown parser for PortalIntel scouting reports.
 * Renders headers, bolding, italics, lists, and highlighting for scouting terms.
 */
export const IntelligenceReport: React.FC<IntelligenceReportProps> = ({ text, className = "" }) => {
  if (!text) return null;

  // Clean up excessive double-newlines
  const normalizedText = text.replace(/\n{3,}/g, '\n\n');
  const lines = normalizedText.split('\n');

  const renderFormattedLine = (line: string, index: number) => {
    const trimmedLine = line.trim();
    
    // 1. Check for Headers (###, ##, #)
    if (trimmedLine.startsWith('###')) {
      return (
        <h3 key={index} className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mt-10 mb-6 border-l-4 border-blue-500 pl-6 animate-in slide-in-from-left-2 duration-500 first:mt-2">
          {trimmedLine.replace('###', '').trim()}
        </h3>
      );
    }
    if (trimmedLine.startsWith('##')) {
      return (
        <h2 key={index} className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter mt-12 mb-8 border-b border-slate-800 pb-4">
          {trimmedLine.replace('##', '').trim()}
        </h2>
      );
    }

    // 2. Check for Bullet Points (- or *)
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      return (
        <li key={index} className="ml-6 mb-3 text-slate-300 list-disc marker:text-blue-500 leading-relaxed font-medium">
          {formatInline(trimmedLine.substring(2))}
        </li>
      );
    }

    // 3. Check for Numbered Lists
    const numMatch = trimmedLine.match(/^(\d+)\.\s/);
    if (numMatch) {
      return (
        <div key={index} className="flex gap-4 mb-4 items-start">
           <span className="text-blue-500 font-black text-sm pt-1">{numMatch[1]}.</span>
           <p className="text-slate-300 flex-1 leading-relaxed font-medium">
             {formatInline(trimmedLine.replace(/^(\d+)\.\s/, ''))}
           </p>
        </div>
      );
    }

    // 4. Empty lines
    if (trimmedLine === '') return <div key={index} className="h-4" />;
    
    // 5. Default Paragraph
    return (
      <p key={index} className="mb-5 text-slate-300 leading-relaxed font-medium text-base md:text-lg">
        {formatInline(trimmedLine)}
      </p>
    );
  };

  /**
   * Handles inline formatting like **bold**, *italic*, and specific keywords
   */
  const formatInline = (text: string) => {
    // Split by bold patterns first
    const parts = text.split(/(\*\*.*?\*\*)/g);
    
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const clean = part.slice(2, -2);
        
        // Keywords that get specialized highlighting
        const scoutingKeywords = ["Scheme Fit", "PI Grade", "ROI", "Surveillance", "Audit", "Technical Mastery", "Physical Ceiling", "NFL Projection"];
        const isKeyword = scoutingKeywords.some(tag => clean.toLowerCase().includes(tag.toLowerCase()));
        
        return (
          <strong key={i} className={`font-black tracking-tight ${isKeyword ? 'text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded shadow-sm' : 'text-white'}`}>
            {clean}
          </strong>
        );
      }
      
      // Handle italics within the remaining text
      if (part.includes('*')) {
        const italicParts = part.split(/(\*.*?\*)/g);
        return italicParts.map((ip, j) => {
          if (ip.startsWith('*') && ip.endsWith('*')) {
            return <em key={j} className="text-slate-400 font-medium italic">{ip.slice(1, -1)}</em>;
          }
          return ip;
        });
      }
      
      return part;
    });
  };

  return (
    <div className={`intelligence-grid-report select-text ${className}`}>
      {lines.map((line, i) => renderFormattedLine(line, i))}
    </div>
  );
};
