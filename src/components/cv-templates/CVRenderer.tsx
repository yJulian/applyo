import React from 'react';
import { CVData, CVStyleOptions } from '../../types/cv';
import { Mail, Phone, MapPin, Globe, Briefcase, GraduationCap, Code2, FolderGit2 } from 'lucide-react';

interface CVRendererProps {
  data: CVData;
  options: CVStyleOptions;
  targetId?: string;
}

export const CVRenderer: React.FC<CVRendererProps> = ({ data, options, targetId = 'cv-print-container' }) => {
  const { templateId, accentColor, fontSize, showProjects } = options;

  const fontScale = fontSize === 'small' ? '0.825rem' : fontSize === 'large' ? '1rem' : '0.9rem';
  const headingScale = fontSize === 'small' ? '1.1rem' : fontSize === 'large' ? '1.4rem' : '1.25rem';
  const fontFamily = templateId === 'classic_executive'
    ? "'Georgia', 'Times New Roman', serif"
    : "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";

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
        fontFamily: fontFamily,
        fontSize: fontScale,
        lineHeight: 1.5,
        color: '#1e293b',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* ==================== A4 SEITE 1 ==================== */}
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

        {/* --- TEMPLATE: MODERN GLASS --- */}
        {templateId === 'modern_glass' && (
          <div>
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
        )}

        {/* --- TEMPLATE: MINIMAL CLEAN --- */}
        {templateId === 'minimal_clean' && (
          <div>
            <div style={{ borderBottom: `2px solid ${accentColor}`, paddingBottom: '16px', marginBottom: '22px' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                {data.header.fullName}
              </h1>
              <h2 style={{ fontSize: headingScale, fontWeight: 600, color: accentColor, marginTop: '2px' }}>
                {data.header.title}
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.8rem', color: '#64748b', marginTop: '8px' }}>
                {data.header.email && <span>{data.header.email}</span>}
                {data.header.phone && <span>• {data.header.phone}</span>}
                {data.header.location && <span>• {data.header.location}</span>}
                {data.header.linkedin && <span>• {data.header.linkedin}</span>}
              </div>
            </div>

            {data.summary && (
              <p style={{ fontSize: '0.9rem', color: '#334155', marginBottom: '22px', lineHeight: 1.6 }}>
                {data.summary}
              </p>
            )}

            <MinimalSection title="Berufserfahrung" accentColor={accentColor} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {data.experiences.slice(0, 3).map((exp) => (
                <div key={exp.id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{exp.position} — <span style={{ color: '#475569' }}>{exp.company}</span></span>
                    <span style={{ fontSize: '0.775rem', color: accentColor, fontWeight: 600 }}>{exp.startDate} – {exp.isCurrent ? 'Heute' : exp.endDate}</span>
                  </div>
                  {exp.highlights && (
                    <ul style={{ paddingLeft: '16px', margin: '4px 0 0 0', fontSize: '0.825rem', color: '#475569' }}>
                      {exp.highlights.map((h, i) => <li key={i}>{h}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <MinimalSection title="Kenntnisse & Fähigkeiten" accentColor={accentColor} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              {data.skillCategories.map((cat) => (
                <div key={cat.id} style={{ fontSize: '0.85rem' }}>
                  <strong style={{ color: '#0f172a' }}>{cat.category}: </strong>
                  <span style={{ color: '#475569' }}>{cat.skills.join(', ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TEMPLATE: TECH SLATE --- */}
        {templateId === 'tech_slate' && (
          <div>
            <div style={{ background: '#0f172a', color: '#ffffff', padding: '24px 28px', borderRadius: '8px', marginBottom: '22px' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>{data.header.fullName}</h1>
              <h2 style={{ fontSize: headingScale, color: accentColor, fontWeight: 700, marginTop: '4px' }}>{data.header.title}</h2>
              <div style={{ display: 'flex', gap: '14px', fontSize: '0.8rem', color: '#94a3b8', marginTop: '10px', flexWrap: 'wrap' }}>
                <span>✉ {data.header.email}</span>
                <span>📞 {data.header.phone}</span>
                <span>📍 {data.header.location}</span>
              </div>
            </div>

            {data.summary && <p style={{ fontSize: '0.9rem', color: '#334155', marginBottom: '20px', lineHeight: 1.6 }}>{data.summary}</p>}

            <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '26px' }}>
              <div>
                <SectionTitle title="Berufserfahrung" icon={<Briefcase size={16} color={accentColor} />} accentColor={accentColor} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {data.experiences.slice(0, 3).map((exp) => (
                    <div key={exp.id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                        <span style={{ color: '#0f172a' }}>{exp.position} ({exp.company})</span>
                        <span style={{ color: accentColor, fontSize: '0.8rem' }}>{exp.startDate} – {exp.isCurrent ? 'Heute' : exp.endDate}</span>
                      </div>
                      <ul style={{ paddingLeft: '16px', margin: '4px 0 0 0', fontSize: '0.8rem', color: '#475569' }}>
                        {exp.highlights?.map((h, i) => <li key={i}>{h}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <SectionTitle title="Tech Stack & Skills" icon={<Code2 size={16} color={accentColor} />} accentColor={accentColor} />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '20px' }}>
                  {data.skillCategories.flatMap((c) => c.skills).map((s, idx) => (
                    <span key={idx} style={{ padding: '3px 9px', background: `${accentColor}18`, color: accentColor, borderRadius: '6px', fontWeight: 600, fontSize: '0.75rem' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TEMPLATE: CLASSIC EXECUTIVE --- */}
        {templateId === 'classic_executive' && (
          <div>
            <div style={{ textAlign: 'center', borderBottom: '3px double #0f172a', paddingBottom: '16px', marginBottom: '22px' }}>
              <h1 style={{ fontSize: '2.1rem', fontWeight: 700, color: '#0f172a', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
                {data.header.fullName}
              </h1>
              <h2 style={{ fontSize: '1.1rem', fontStyle: 'italic', color: accentColor, marginTop: '4px' }}>
                {data.header.title}
              </h2>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '0.8rem', color: '#475569', marginTop: '8px' }}>
                {data.header.email && <span>{data.header.email}</span>}
                {data.header.phone && <span>| {data.header.phone}</span>}
                {data.header.location && <span>| {data.header.location}</span>}
              </div>
            </div>

            {data.summary && <p style={{ fontSize: '0.925rem', color: '#334155', marginBottom: '22px', lineHeight: 1.6, textAlign: 'justify' }}>{data.summary}</p>}

            <SectionTitle title="Berufserfahrung" icon={<Briefcase size={16} color={accentColor} />} accentColor={accentColor} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {data.experiences.slice(0, 3).map((exp) => (
                <div key={exp.id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <span style={{ color: '#0f172a' }}>{exp.position} — {exp.company}</span>
                    <span style={{ color: accentColor, fontSize: '0.8rem' }}>{exp.startDate} – {exp.isCurrent ? 'Heute' : exp.endDate}</span>
                  </div>
                  {exp.highlights && (
                    <ul style={{ paddingLeft: '18px', margin: '4px 0 0 0', fontSize: '0.825rem', color: '#334155' }}>
                      {exp.highlights.map((h, i) => <li key={i}>{h}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
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

      {/* ==================== A4 SEITE 2 ==================== */}
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

          {/* RIGHT COLUMN: Ausbildung & Sprachen */}
          <div>
            {/* Education if not on page 1 */}
            {data.education && data.education.length > 0 && (
              <div style={{ marginBottom: '20px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <SectionTitle title="Ausbildung & Abschlüsse" icon={<GraduationCap size={16} color={accentColor} />} accentColor={accentColor} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {data.education.map((edu) => (
                    <div key={edu.id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        {edu.degree}
                      </h4>
                      <div style={{ fontSize: '0.775rem', fontWeight: 600, color: accentColor }}>
                        {edu.institution} ({edu.startDate} – {edu.endDate})
                      </div>
                      {edu.description && <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0' }}>{edu.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
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

const MinimalSection: React.FC<{ title: string; accentColor: string }> = ({ title, accentColor }) => (
  <h3 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: accentColor, marginBottom: '10px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
    {title}
  </h3>
);
