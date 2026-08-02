import React from 'react';
import { CVData, CVStyleOptions } from '../../types/cv';
import { Mail, Phone, MapPin, Globe, Briefcase, GraduationCap, Code2, FolderGit2 } from 'lucide-react';

interface CVRendererProps {
  data: CVData;
  options: CVStyleOptions;
  targetId?: string;
}

export const CVRenderer: React.FC<CVRendererProps> = ({ data, options, targetId = 'cv-print-container' }) => {
  const { accentColor, fontSize, showProjects } = options;

  const fontScale = fontSize === 'small' ? '0.825rem' : fontSize === 'large' ? '1rem' : '0.9rem';
  const headingScale = fontSize === 'small' ? '1.1rem' : fontSize === 'large' ? '1.4rem' : '1.25rem';

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
        gap: '28px',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: fontScale,
        lineHeight: 1.5,
        color: '#1e293b',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* ==================== A4 SEITE 1 (2-SPALTIGES MODERN GLASS LAYOUT) ==================== */}
      <div
        className="cv-a4-page"
        style={{
          width: '100%',
          minHeight: '1020px',
          backgroundColor: '#ffffff',
          boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
          borderRadius: '8px',
          padding: '38px',
          boxSizing: 'border-box',
          position: 'relative',
          pageBreakAfter: 'always',
          breakAfter: 'page',
        }}
      >
        {/* Page Badge */}
        <div style={{ position: 'absolute', top: '12px', right: '16px', fontSize: '0.675rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
          📄 A4 Seite 1
        </div>

        {/* Header Banner */}
        <div
          style={{
            padding: '22px 26px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}30 100%)`,
            borderLeft: `6px solid ${accentColor}`,
            marginBottom: '22px',
          }}
        >
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            {data.header.fullName}
          </h1>
          <h2 style={{ fontSize: headingScale, fontWeight: 700, color: accentColor, marginTop: '4px', marginBottom: '12px' }}>
            {data.header.title}
          </h2>

          {/* Contact Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '0.8rem', color: '#475569' }}>
            {data.header.email && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={13} color={accentColor} />
                {data.header.email}
              </span>
            )}
            {data.header.phone && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={13} color={accentColor} />
                {data.header.phone}
              </span>
            )}
            {data.header.location && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={13} color={accentColor} />
                {data.header.location}
              </span>
            )}
            {data.header.website && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Globe size={13} color={accentColor} />
                {data.header.website}
              </span>
            )}
            {data.header.github && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Code2 size={13} color={accentColor} />
                {data.header.github}
              </span>
            )}
            {data.header.linkedin && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Globe size={13} color={accentColor} />
                {data.header.linkedin}
              </span>
            )}
          </div>
        </div>

        {/* Summary */}
        {data.summary && (
          <div style={{ marginBottom: '22px', paddingBottom: '14px', borderBottom: `1px solid ${accentColor}20` }}>
            <p style={{ fontStyle: 'italic', color: '#334155', margin: 0, fontSize: '0.9rem', lineHeight: 1.55 }}>
              "{data.summary}"
            </p>
          </div>
        )}

        {/* 2-COLUMN LAYOUT */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '26px' }}>
          {/* LEFT MAIN COLUMN: Berufserfahrung */}
          <div>
            <SectionTitle title="Berufserfahrung" icon={<Briefcase size={16} color={accentColor} />} accentColor={accentColor} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {data.experiences.slice(0, 3).map((exp) => (
                <div key={exp.id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <h4 style={{ fontSize: '0.925rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                      {exp.position}
                    </h4>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: accentColor }}>
                      {exp.startDate} – {exp.isCurrent ? 'Heute' : exp.endDate}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                    {exp.company} {exp.location ? `• ${exp.location}` : ''}
                  </div>
                  {exp.summary && <p style={{ fontSize: '0.8rem', color: '#334155', marginBottom: '4px' }}>{exp.summary}</p>}
                  {exp.highlights && exp.highlights.length > 0 && (
                    <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '0.775rem', color: '#475569' }}>
                      {exp.highlights.map((h, i) => (
                        <li key={i} style={{ marginBottom: '2px' }}>{h}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDEBAR: Skills & Expertisen + Ausbildung */}
          <div>
            {/* Skills */}
            {data.skillCategories && data.skillCategories.length > 0 && (
              <div style={{ marginBottom: '22px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <SectionTitle title="Skills & Expertisen" icon={<Code2 size={16} color={accentColor} />} accentColor={accentColor} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {data.skillCategories.map((cat) => (
                    <div key={cat.id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                      <h5 style={{ fontSize: '0.775rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                        {cat.category}
                      </h5>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {cat.skills.map((s, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '0.725rem',
                              padding: '2px 7px',
                              borderRadius: '10px',
                              background: `${accentColor}12`,
                              color: accentColor,
                              border: `1px solid ${accentColor}30`,
                              fontWeight: 600,
                            }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {data.education && data.education.length > 0 && (
              <div style={{ marginBottom: '18px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <SectionTitle title="Ausbildung" icon={<GraduationCap size={16} color={accentColor} />} accentColor={accentColor} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {data.education.map((edu) => (
                    <div key={edu.id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                      <h4 style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        {edu.degree}
                      </h4>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: accentColor }}>
                        {edu.institution} ({edu.startDate} – {edu.endDate})
                      </div>
                      {edu.description && <p style={{ fontSize: '0.725rem', color: '#64748b', margin: '2px 0' }}>{edu.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visual Page Break Separator Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '8px 16px',
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px dashed var(--accent-cyan)',
          borderRadius: '8px',
          color: '#38bdf8',
          fontSize: '0.75rem',
          fontWeight: 700,
          margin: '2px 0',
        }}
      >
        <span>📄 --- A4 SEITENUMBRUCH (ENDE SEITE 1) ---</span>
      </div>

      {/* ==================== A4 SEITE 2 (WEITERE EXPERIENZ & PROJEKTE) ==================== */}
      <div
        className="cv-a4-page"
        style={{
          width: '100%',
          minHeight: '1020px',
          backgroundColor: '#ffffff',
          boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
          borderRadius: '8px',
          padding: '38px',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {/* Page Badge */}
        <div style={{ position: 'absolute', top: '12px', right: '16px', fontSize: '0.675rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
          📄 A4 Seite 2
        </div>

        {/* Top Header Mini Title on Page 2 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `2px solid ${accentColor}30`, paddingBottom: '8px', marginBottom: '22px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>{data.header.fullName} — Lebenslauf</span>
          <span style={{ fontSize: '0.8rem', color: accentColor, fontWeight: 700 }}>{data.header.title}</span>
        </div>

        {/* 2-COLUMN LAYOUT ON PAGE 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '26px' }}>
          {/* LEFT COLUMN: Weitere Berufserfahrungen & Ausgewählte Projekte */}
          <div>
            {/* Additional Experiences if > 3 */}
            {data.experiences.length > 3 && (
              <div style={{ marginBottom: '22px' }}>
                <SectionTitle title="Weitere Erfahrungen" icon={<Briefcase size={16} color={accentColor} />} accentColor={accentColor} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {data.experiences.slice(3).map((exp) => (
                    <div key={exp.id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                          {exp.position}
                        </h4>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: accentColor }}>
                          {exp.startDate} – {exp.endDate}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.775rem', fontWeight: 600, color: '#64748b' }}>
                        {exp.company}
                      </div>
                      {exp.highlights && (
                        <ul style={{ paddingLeft: '14px', margin: '4px 0 0 0', fontSize: '0.75rem', color: '#475569' }}>
                          {exp.highlights.map((h, i) => <li key={i}>{h}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ausgewählte Projekte */}
            {showProjects && data.projects && data.projects.length > 0 && (
              <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <SectionTitle title="Ausgewählte Projekte" icon={<FolderGit2 size={16} color={accentColor} />} accentColor={accentColor} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {data.projects.map((p) => (
                    <div key={p.id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        {p.title}
                      </h4>
                      <p style={{ fontSize: '0.775rem', color: '#475569', margin: '2px 0' }}>{p.description}</p>
                      {p.techStack && p.techStack.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                          {p.techStack.map((t, idx) => (
                            <span key={idx} style={{ fontSize: '0.675rem', padding: '1px 6px', borderRadius: '4px', background: `${accentColor}15`, color: accentColor, fontWeight: 600 }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Sprachen & Zertifikate */}
          <div>
            {data.languages && data.languages.length > 0 && (
              <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <h5 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                  Sprachen & Qualifikationen
                </h5>
                <ul style={{ paddingLeft: '14px', margin: 0, fontSize: '0.8rem', color: '#475569' }}>
                  {data.languages.map((lang, idx) => (
                    <li key={idx} style={{ marginBottom: '3px' }}>{lang}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionTitle: React.FC<{ title: string; icon?: React.ReactNode; accentColor: string }> = ({ title, icon, accentColor }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: `2px solid ${accentColor}30`, paddingBottom: '6px', marginBottom: '12px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
    {icon}
    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#0f172a', margin: 0 }}>
      {title}
    </h3>
  </div>
);
