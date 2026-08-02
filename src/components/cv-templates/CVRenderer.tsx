import React from 'react';
import { CVData, CVStyleOptions } from '../../types/cv';
import { Mail, Phone, MapPin, Briefcase, GraduationCap, Code2, FolderGit2 } from 'lucide-react';

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

  const isMinimal = templateId === 'minimal_clean';

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
        fontFamily: fontFamily,
        fontSize: fontScale,
        lineHeight: 1.5,
        color: '#1e293b',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* ==================== A4 SEITE 1 BOGEN ==================== */}
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
          📄 A4 Seite 1
        </div>

        {/* --- HEADER --- */}
        {isMinimal ? (
          <div style={{ borderBottom: `2px solid ${accentColor}`, paddingBottom: '16px', marginBottom: '20px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <h1 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              {data.header.fullName}
            </h1>
            <h2 style={{ fontSize: headingScale, fontWeight: 600, color: accentColor, marginTop: '2px', marginBottom: '8px' }}>
              {data.header.title}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '0.8rem', color: '#64748b' }}>
              {data.header.email && <span>✉ {data.header.email}</span>}
              {data.header.phone && <span>📞 {data.header.phone}</span>}
              {data.header.location && <span>📍 {data.header.location}</span>}
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '20px 24px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}30 100%)`,
              borderLeft: `6px solid ${accentColor}`,
              marginBottom: '20px',
              pageBreakInside: 'avoid',
              breakInside: 'avoid',
            }}
          >
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              {data.header.fullName}
            </h1>
            <h2 style={{ fontSize: headingScale, fontWeight: 700, color: accentColor, marginTop: '4px', marginBottom: '10px' }}>
              {data.header.title}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '0.8rem', color: '#475569' }}>
              {data.header.email && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Mail size={13} color={accentColor} />{data.header.email}</span>}
              {data.header.phone && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Phone size={13} color={accentColor} />{data.header.phone}</span>}
              {data.header.location && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><MapPin size={13} color={accentColor} />{data.header.location}</span>}
            </div>
          </div>
        )}

        {/* --- SUMMARY --- */}
        {data.summary && (
          <div style={{ marginBottom: '20px', paddingBottom: '12px', borderBottom: `1px solid ${accentColor}20`, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <p style={{ fontStyle: isMinimal ? 'normal' : 'italic', color: '#334155', margin: 0, fontSize: '0.875rem', lineHeight: 1.55 }}>
              "{data.summary}"
            </p>
          </div>
        )}

        {/* --- CONTENT LAYOUT --- */}
        {isMinimal ? (
          /* MINIMAL CLEAN: SINGLE COLUMN (Header -> Summary -> Experience -> Education -> Skills -> Projects -> Languages) */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Berufserfahrung */}
            {data.experiences && data.experiences.length > 0 && (
              <div>
                <MinimalSection title="Berufserfahrung" accentColor={accentColor} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {data.experiences.map((exp) => (
                    <div key={exp.id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                          {exp.position} — <span style={{ color: '#475569', fontWeight: 600 }}>{exp.company}</span>
                        </span>
                        <span style={{ fontSize: '0.75rem', color: accentColor, fontWeight: 700 }}>
                          {exp.startDate} – {exp.isCurrent ? 'Heute' : exp.endDate}
                        </span>
                      </div>
                      {exp.summary && <p style={{ fontSize: '0.8rem', color: '#475569', margin: '2px 0' }}>{exp.summary}</p>}
                      {exp.highlights && exp.highlights.length > 0 && (
                        <ul style={{ paddingLeft: '16px', margin: '3px 0 0 0', fontSize: '0.775rem', color: '#475569' }}>
                          {exp.highlights.map((h, i) => (
                            <li key={i} style={{ marginBottom: '2px' }}>{h}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ausbildung & Abschlüsse */}
            {data.education && data.education.length > 0 && (
              <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <MinimalSection title="Ausbildung & Abschlüsse" accentColor={accentColor} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {data.education.map((edu) => (
                    <div key={edu.id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>{edu.degree}</strong>
                        <span style={{ fontSize: '0.75rem', color: accentColor, fontWeight: 700 }}>{edu.startDate} – {edu.endDate}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{edu.institution}</div>
                      {edu.description && <p style={{ fontSize: '0.75rem', color: '#475569', margin: '2px 0' }}>{edu.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Kenntnisse & Fähigkeiten */}
            {data.skillCategories && data.skillCategories.length > 0 && (
              <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <MinimalSection title="Kenntnisse & Fähigkeiten" accentColor={accentColor} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {data.skillCategories.map((cat) => (
                    <div key={cat.id} style={{ fontSize: '0.825rem', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                      <strong style={{ color: '#0f172a', display: 'inline-block', minWidth: '150px' }}>{cat.category}: </strong>
                      <span style={{ color: '#475569' }}>{cat.skills.join(', ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ausgewählte Projekte */}
            {showProjects && data.projects && data.projects.length > 0 && (
              <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <MinimalSection title="Ausgewählte Projekte" accentColor={accentColor} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {data.projects.map((p) => (
                    <div key={p.id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        {p.title}
                      </h4>
                      <p style={{ fontSize: '0.775rem', color: '#475569', margin: '2px 0' }}>{p.description}</p>
                      {p.techStack && p.techStack.length > 0 && (
                        <div style={{ fontSize: '0.725rem', color: accentColor, fontWeight: 600 }}>
                          Tech: {p.techStack.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sprachen */}
            {data.languages && data.languages.length > 0 && (
              <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <MinimalSection title="Sprachen" accentColor={accentColor} />
                <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '0.8rem', color: '#475569' }}>
                  {data.languages.map((lang, idx) => (
                    <li key={idx}>{lang}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          /* MODERN GLASS / TECH SLATE: 2-COLUMN EFFICIENT LAYOUT */
          <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '24px' }}>
            {/* LEFT MAIN COLUMN: Berufserfahrung & Projekte */}
            <div>
              <SectionTitle title="Berufserfahrung" icon={<Briefcase size={16} color={accentColor} />} accentColor={accentColor} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                {data.experiences.map((exp) => (
                  <div key={exp.id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        {exp.position}
                      </h4>
                      <span style={{ fontSize: '0.725rem', fontWeight: 600, color: accentColor }}>
                        {exp.startDate} – {exp.isCurrent ? 'Heute' : exp.endDate}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.775rem', fontWeight: 600, color: '#64748b', marginBottom: '3px' }}>
                      {exp.company} {exp.location ? `• ${exp.location}` : ''}
                    </div>
                    {exp.summary && <p style={{ fontSize: '0.775rem', color: '#334155', marginBottom: '3px' }}>{exp.summary}</p>}
                    {exp.highlights && exp.highlights.length > 0 && (
                      <ul style={{ paddingLeft: '14px', margin: 0, fontSize: '0.75rem', color: '#475569' }}>
                        {exp.highlights.map((h, i) => (
                          <li key={i} style={{ marginBottom: '2px' }}>{h}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              {/* Projects */}
              {showProjects && data.projects && data.projects.length > 0 && (
                <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <SectionTitle title="Ausgewählte Projekte" icon={<FolderGit2 size={16} color={accentColor} />} accentColor={accentColor} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {data.projects.map((p) => (
                      <div key={p.id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                          {p.title}
                        </h4>
                        <p style={{ fontSize: '0.75rem', color: '#475569', margin: '2px 0' }}>{p.description}</p>
                        {p.techStack && p.techStack.length > 0 && (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '3px' }}>
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

            {/* RIGHT SIDEBAR: Skills & Education */}
            <div>
              {/* Skills */}
              {data.skillCategories && data.skillCategories.length > 0 && (
                <div style={{ marginBottom: '20px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <SectionTitle title="Skills & Expertisen" icon={<Code2 size={16} color={accentColor} />} accentColor={accentColor} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {data.skillCategories.map((cat) => (
                      <div key={cat.id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                        <h5 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                          {cat.category}
                        </h5>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {cat.skills.map((s, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '0.7rem',
                                padding: '2px 6px',
                                borderRadius: '8px',
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
                <div style={{ marginBottom: '16px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <SectionTitle title="Ausbildung & Abschlüsse" icon={<GraduationCap size={16} color={accentColor} />} accentColor={accentColor} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {data.education.map((edu) => (
                      <div key={edu.id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                        <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                          {edu.degree}
                        </h4>
                        <div style={{ fontSize: '0.725rem', fontWeight: 600, color: accentColor }}>
                          {edu.institution} ({edu.startDate} – {edu.endDate})
                        </div>
                        {edu.description && <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '2px 0' }}>{edu.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages */}
              {data.languages && data.languages.length > 0 && (
                <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <h5 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    Sprachen
                  </h5>
                  <ul style={{ paddingLeft: '14px', margin: 0, fontSize: '0.75rem', color: '#475569' }}>
                    {data.languages.map((lang, idx) => (
                      <li key={idx}>{lang}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SectionTitle: React.FC<{ title: string; icon?: React.ReactNode; accentColor: string }> = ({ title, icon, accentColor }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: `2px solid ${accentColor}30`, paddingBottom: '5px', marginBottom: '10px', pageBreakAfter: 'avoid', breakAfter: 'avoid', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
    {icon}
    <h3 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#0f172a', margin: 0 }}>
      {title}
    </h3>
  </div>
);

const MinimalSection: React.FC<{ title: string; accentColor: string }> = ({ title, accentColor }) => (
  <h3 style={{ fontSize: '0.825rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: accentColor, marginBottom: '8px', marginTop: '16px', pageBreakAfter: 'avoid', breakAfter: 'avoid', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
    {title}
  </h3>
);
