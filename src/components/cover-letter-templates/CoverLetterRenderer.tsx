import React from 'react';
import { CoverLetterData, CoverLetterStyleOptions } from '../../types/coverLetter';
import { Mail, Phone, MapPin } from 'lucide-react';

interface CoverLetterRendererProps {
  data: CoverLetterData;
  options: CoverLetterStyleOptions;
  targetId?: string;
}

export const CoverLetterRenderer: React.FC<CoverLetterRendererProps> = ({
  data,
  options,
  targetId = 'cover-letter-print-container',
}) => {
  const { templateId, accentColor, fontSize } = options;

  const fontScale = fontSize === 'small' ? '0.825rem' : fontSize === 'large' ? '1rem' : '0.9rem';
  const headingScale = fontSize === 'small' ? '1.1rem' : fontSize === 'large' ? '1.4rem' : '1.25rem';
  const fontFamily = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";

  const { sender, recipient, meta, content } = data;

  return (
    <div
      id={targetId}
      style={{
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        fontFamily,
        fontSize: fontScale,
        lineHeight: 1.6,
        color: '#1e293b',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* ==================== A4 SEITE ==================== */}
      <div
        className="cv-a4-page"
        style={{
          width: '100%',
          minHeight: '1020px',
          backgroundColor: '#ffffff',
          boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
          borderRadius: '8px',
          padding: '42px 48px',
          boxSizing: 'border-box',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Page Badge (Nur auf dem Bildschirm sichtbar, NIEMALS in der PDF) */}
        <div
          className="no-print"
          style={{
            position: 'absolute',
            top: '12px',
            right: '16px',
            fontSize: '0.675rem',
            fontWeight: 700,
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          📄 Anschreiben (A4)
        </div>

        <div>
          {/* --- HEADER LAYOUT --- */}
          {templateId === 'modern_glass' ? (
            <div
              style={{
                padding: '20px 24px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}30 100%)`,
                borderLeft: `6px solid ${accentColor}`,
                marginBottom: '32px',
                pageBreakInside: 'avoid',
                breakInside: 'avoid',
              }}
            >
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                {sender.fullName}
              </h1>
              {sender.title && (
                <h2 style={{ fontSize: headingScale, fontWeight: 700, color: accentColor, marginTop: '2px', marginBottom: '8px' }}>
                  {sender.title}
                </h2>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '0.8rem', color: '#475569' }}>
                {sender.email && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Mail size={13} color={accentColor} />
                    {sender.email}
                  </span>
                )}
                {sender.phone && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={13} color={accentColor} />
                    {sender.phone}
                  </span>
                )}
                {sender.location && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={13} color={accentColor} />
                    {sender.location}
                  </span>
                )}
              </div>
            </div>
          ) : templateId === 'minimal_clean' ? (
            <div style={{ borderBottom: `2px solid ${accentColor}`, paddingBottom: '16px', marginBottom: '32px' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                {sender.fullName}
              </h1>
              {sender.title && (
                <h2 style={{ fontSize: headingScale, fontWeight: 600, color: accentColor, marginTop: '2px', marginBottom: '8px' }}>
                  {sender.title}
                </h2>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '0.8rem', color: '#64748b' }}>
                {sender.email && <span><Mail size={12} color={accentColor} style={{ marginRight: '4px' }} />{sender.email}</span>}
                {sender.phone && <span><Phone size={12} color={accentColor} style={{ marginRight: '4px' }} />{sender.phone}</span>}
                {sender.location && <span><MapPin size={12} color={accentColor} style={{ marginRight: '4px' }} />{sender.location}</span>}
              </div>
            </div>
          ) : (
            /* Classic DIN Layout Header */
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', borderBottom: `1px solid ${accentColor}40`, paddingBottom: '16px' }}>
              <div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{sender.fullName}</h1>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.825rem', color: '#64748b' }}>{sender.title || 'Bewerber'}</p>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                <p style={{ margin: 0 }}>{sender.email}</p>
                <p style={{ margin: 0 }}>{sender.phone}</p>
                <p style={{ margin: 0 }}>{sender.location}</p>
              </div>
            </div>
          )}

          {/* --- RECIPIENT & META ADDRESS BLOCK --- */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
            {/* Recipient Block */}
            <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5, maxWidth: '320px' }}>
              {/* Absender-Zeile für Fensterbriefumschlag (DIN) */}
              <div style={{ fontSize: '0.675rem', color: '#94a3b8', borderBottom: '1px dotted #cbd5e1', paddingBottom: '2px', marginBottom: '8px' }}>
                {sender.fullName} • {sender.location}
              </div>
              <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{recipient.company}</p>
              {recipient.department && <p style={{ margin: 0, color: '#475569' }}>{recipient.department}</p>}
              {recipient.contactPerson && <p style={{ margin: 0, color: '#475569' }}>{recipient.contactPerson}</p>}
              {recipient.address && <p style={{ margin: 0, color: '#475569' }}>{recipient.address}</p>}
              {recipient.zipCity && <p style={{ margin: 0, color: '#475569' }}>{recipient.zipCity}</p>}
            </div>

            {/* Place & Date Block */}
            <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>
              {meta.placeAndDate}
            </div>
          </div>

          {/* --- SUBJECT (BETREFF) --- */}
          <div style={{ marginBottom: '24px' }}>
            <h3
              style={{
                fontSize: headingScale,
                fontWeight: 800,
                color: '#0f172a',
                margin: 0,
                lineHeight: 1.35,
                borderLeft: `4px solid ${accentColor}`,
                paddingLeft: '12px',
              }}
            >
              {meta.subject}
            </h3>
          </div>

          {/* --- LETTER BODY --- */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: '#1e293b', fontSize: fontScale, lineHeight: 1.65 }}>
            {/* Anrede */}
            <p style={{ margin: 0, fontWeight: 600 }}>{content.salutation}</p>

            {/* Einleitung */}
            {content.intro && <p style={{ margin: 0, textIndent: '0px' }}>{content.intro}</p>}

            {/* Hauptteil Absätze */}
            {(content.bodyParagraphs || []).map((paragraph, idx) => (
              <p key={idx} style={{ margin: 0 }}>
                {paragraph}
              </p>
            ))}

            {/* Gesprächswunsch / Call to Action */}
            {content.callToAction && <p style={{ margin: 0 }}>{content.callToAction}</p>}

            {/* Grussformel & Unterschrift */}
            <div style={{ marginTop: '24px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <p style={{ margin: 0, fontWeight: 600 }}>{content.closing}</p>
              <div style={{ height: '36px' }} /> {/* Platz für Unterschrift */}
              <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                {content.signatureName || sender.fullName}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
