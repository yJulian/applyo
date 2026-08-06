import React from 'react';
import { CVData, CVStyleOptions, CVExperience, CVEducation } from '../../types/cv';
import { Mail, Phone, MapPin, Briefcase, GraduationCap, Code2, FolderGit2, Globe, Flag } from 'lucide-react';
import {
  getExpPosition, getExpSummary, getExpHighlights,
  getEduDegree, getEduDesc,
  getSkillCat, getSkillList,
  getProjTitle, getProjDesc, getProjTech,
} from '../../utils/cvVersioning';

interface CVRendererProps {
  data: CVData;
  options: CVStyleOptions;
  targetId?: string;
}

export const CVRenderer: React.FC<CVRendererProps> = ({ data, options, targetId = 'cv-print-container' }) => {
  const { templateId, accentColor, fontSize, showProjects } = options;

  const fontScale = fontSize === 'small' ? '0.825rem' : fontSize === 'large' ? '1rem' : '0.9rem';
  const headingScale = fontSize === 'small' ? '1.1rem' : fontSize === 'large' ? '1.4rem' : '1.25rem';
  const fontFamily = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";

  const isMinimal = templateId === 'minimal_clean' || templateId === 'minimal_clean_briefkopf';
  const isBriefkopf = templateId === 'minimal_clean_briefkopf';

  // Filter out items that are toggled off / hidden for this specific resume
  const visibleExperiences = (data.experiences || []).filter(e => !e.hidden);
  const visibleEducation = (data.education || []).filter(e => !e.hidden);
  const visibleSkills = (data.skillCategories || []).filter(s => !s.hidden);
  const visibleProjects = (data.projects || []).filter(p => !p.hidden);

  const getExpDuration = (e: CVExperience) => {
    const end = e.endDate ? e.endDate : (e.isCurrent ? 'Heute' : '');
    if (e.startDate && end) {
      return `${e.startDate} – ${end}`;
    }
    return e.startDate || end;
  };

  const getEduDuration = (e: CVEducation) => {
    if (e.startDate && e.endDate) {
      return `${e.startDate} – ${e.endDate}`;
    }
    return e.startDate || e.endDate || '';
  };

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
        {/* Page Badge (Nur auf dem Bildschirm sichtbar, NIEMALS in der PDF) */}
        <div className="no-print" style={{ position: 'absolute', top: '12px', right: '16px', fontSize: '0.675rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
          📄 A4 Seite 1
        </div>

        {/* --- HEADER --- */}
        {isMinimal ? (
          <div style={{ borderBottom: `2px solid ${accentColor}`, paddingBottom: '16px', marginBottom: '20px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            {/* Briefkopf Absenderadresse (untereinander wie beim Anschreiben, ohne Label oben rechts) */}
            {isBriefkopf && (
              <div
                style={{
                  marginBottom: '16px',
                  paddingBottom: '12px',
                  borderBottom: `1px solid ${accentColor}30`,
                  fontSize: '0.85rem',
                  color: '#475569',
                  lineHeight: 1.45,
                }}
              >
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                  {data.header.fullName}
                </div>
                {data.header.address ? (
                  <div style={{ color: '#475569', marginTop: '2px' }}>
                    {data.header.address.includes('\n')
                      ? data.header.address.split('\n').map((line, i) => <div key={i}>{line}</div>)
                      : data.header.address.includes(',')
                      ? data.header.address.split(',').map((part, i) => <div key={i}>{part.trim()}</div>)
                      : <div>{data.header.address}</div>
                    }
                  </div>
                ) : (
                  <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.8rem', marginTop: '2px' }}>
                    Adresse in Einstellungen festlegen
                  </div>
                )}
              </div>
            )}
            <h1 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              {data.header.fullName}
            </h1>
            <h2 style={{ fontSize: headingScale, fontWeight: 600, color: accentColor, marginTop: '2px', marginBottom: '8px' }}>
              {data.header.title}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '0.8rem', color: '#64748b' }}>
              {data.header.email && <a href={`mailto:${data.header.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'inherit', textDecoration: 'none' }}><Mail size={13} color={accentColor} />{data.header.email}</a>}
              {data.header.phone && <a href={`tel:${data.header.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'inherit', textDecoration: 'none' }}><Phone size={13} color={accentColor} />{data.header.phone}</a>}
              {!isBriefkopf && data.header.location && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><MapPin size={13} color={accentColor} />{data.header.location}</span>}
              {data.header.citizenship && (data.header.showCitizenship ?? true) && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Flag size={13} color={accentColor} />{data.header.citizenship}</span>}
              {data.header.linkedin && (data.header.showLinkedin ?? true) && (
                <a href={data.header.linkedin.startsWith('http') ? data.header.linkedin : `https://${data.header.linkedin}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: accentColor, textDecoration: 'none', fontWeight: 600 }}>
                  <Globe size={13} color={accentColor} />LinkedIn
                </a>
              )}
              {data.header.github && (data.header.showGithub ?? true) && (
                <a href={data.header.github.startsWith('http') ? data.header.github : `https://${data.header.github}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: accentColor, textDecoration: 'none', fontWeight: 600 }}>
                  <Code2 size={13} color={accentColor} />GitHub
                </a>
              )}
              {data.header.xing && (data.header.showXing ?? true) && (
                <a href={data.header.xing.startsWith('http') ? data.header.xing : `https://${data.header.xing}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: accentColor, textDecoration: 'none', fontWeight: 600 }}>
                  <Briefcase size={13} color={accentColor} />XING
                </a>
              )}
              {data.header.website && (data.header.showWebsite ?? true) && (
                <a href={data.header.website.startsWith('http') ? data.header.website : `https://${data.header.website}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: accentColor, textDecoration: 'none', fontWeight: 600 }}>
                  <Globe size={13} color={accentColor} />Website
                </a>
              )}
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
              {data.header.email && <a href={`mailto:${data.header.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'inherit', textDecoration: 'none' }}><Mail size={13} color={accentColor} />{data.header.email}</a>}
              {data.header.phone && <a href={`tel:${data.header.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'inherit', textDecoration: 'none' }}><Phone size={13} color={accentColor} />{data.header.phone}</a>}
              {data.header.location && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><MapPin size={13} color={accentColor} />{data.header.location}</span>}
              {data.header.citizenship && (data.header.showCitizenship ?? true) && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Flag size={13} color={accentColor} />{data.header.citizenship}</span>}
              {data.header.linkedin && (data.header.showLinkedin ?? true) && (
                <a href={data.header.linkedin.startsWith('http') ? data.header.linkedin : `https://${data.header.linkedin}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: accentColor, textDecoration: 'none', fontWeight: 600 }}>
                  <Globe size={13} color={accentColor} />LinkedIn
                </a>
              )}
              {data.header.github && (data.header.showGithub ?? true) && (
                <a href={data.header.github.startsWith('http') ? data.header.github : `https://${data.header.github}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: accentColor, textDecoration: 'none', fontWeight: 600 }}>
                  <Code2 size={13} color={accentColor} />GitHub
                </a>
              )}
              {data.header.xing && (data.header.showXing ?? true) && (
                <a href={data.header.xing.startsWith('http') ? data.header.xing : `https://${data.header.xing}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: accentColor, textDecoration: 'none', fontWeight: 600 }}>
                  <Briefcase size={13} color={accentColor} />XING
                </a>
              )}
              {data.header.website && (data.header.showWebsite ?? true) && (
                <a href={data.header.website.startsWith('http') ? data.header.website : `https://${data.header.website}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: accentColor, textDecoration: 'none', fontWeight: 600 }}>
                  <Globe size={13} color={accentColor} />Website
                </a>
              )}
            </div>
          </div>
        )}

        {/* --- SUMMARY --- */}
        {data.summary && (
          <div style={{ marginBottom: '20px', paddingBottom: '12px', borderBottom: `1px solid ${accentColor}20`, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <p style={{ fontStyle: isMinimal ? 'normal' : 'italic', color: '#334155', margin: 0, fontSize: '0.875rem', lineHeight: 1.55 }}>
              {data.summary}
            </p>
          </div>
        )}

        {/* --- CONTENT LAYOUT --- */}
        {isMinimal ? (
          /* MINIMAL CLEAN: SINGLE COLUMN */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Berufserfahrung */}
            {visibleExperiences.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', margin: 0, padding: 0 }}>
                <thead style={{ display: 'table-header-group', pageBreakInside: 'avoid', breakInside: 'avoid', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>
                  <tr>
                    <td style={{ padding: 0, paddingBottom: '4px' }}>
                      <MinimalSection title="Berufserfahrung" accentColor={accentColor} />
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {visibleExperiences.map((exp) => (
                    <tr key={exp.id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                      <td style={{ padding: 0, paddingBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                            {getExpPosition(exp)} — <span style={{ color: '#475569', fontWeight: 600 }}>{exp.company}</span>
                          </span>
                          <span style={{ fontSize: '0.75rem', color: accentColor, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0, marginLeft: '12px' }}>
                            {getExpDuration(exp)}
                          </span>
                        </div>
                        {getExpSummary(exp) && <p style={{ fontSize: '0.8rem', color: '#475569', margin: '2px 0' }}>{getExpSummary(exp)}</p>}
                        {getExpHighlights(exp) && getExpHighlights(exp).length > 0 && (
                          <ul style={{ paddingLeft: '16px', margin: '3px 0 0 0', fontSize: '0.775rem', color: '#475569' }}>
                            {getExpHighlights(exp).map((h, i) => (
                              <li key={i} style={{ marginBottom: '2px' }}>{h}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Ausbildung & Abschlüsse */}
            {visibleEducation.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', margin: 0, padding: 0 }}>
                <thead style={{ display: 'table-header-group', pageBreakInside: 'avoid', breakInside: 'avoid', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>
                  <tr>
                    <td style={{ padding: 0, paddingBottom: '4px' }}>
                      <MinimalSection title="Ausbildung & Abschlüsse" accentColor={accentColor} />
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {visibleEducation.map((edu) => (
                    <tr key={edu.id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                      <td style={{ padding: 0, paddingBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                          <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>{getEduDegree(edu)}</strong>
                          <span style={{ fontSize: '0.75rem', color: accentColor, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0, marginLeft: '12px' }}>
                            {getEduDuration(edu)}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{edu.institution}</div>
                        {getEduDesc(edu) && <p style={{ fontSize: '0.75rem', color: '#475569', margin: '2px 0' }}>{getEduDesc(edu)}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Kenntnisse & Fähigkeiten */}
            {visibleSkills.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', margin: 0, padding: 0, fontSize: '0.825rem' }}>
                <thead style={{ display: 'table-header-group', pageBreakInside: 'avoid', breakInside: 'avoid', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>
                  <tr>
                    <td colSpan={2} style={{ padding: 0, paddingBottom: '4px' }}>
                      <MinimalSection title="Kenntnisse & Fähigkeiten" accentColor={accentColor} />
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {visibleSkills.map((cat) => (
                    <tr key={cat.id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                      <td style={{ width: '1%', whiteSpace: 'nowrap', fontWeight: 700, color: '#0f172a', paddingRight: '16px', paddingBottom: '6px', verticalAlign: 'top' }}>
                        {getSkillCat(cat)}:
                      </td>
                      <td style={{ color: '#475569', paddingBottom: '6px', verticalAlign: 'top' }}>
                        {getSkillList(cat).join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Ausgewählte Projekte */}
            {showProjects && visibleProjects.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', margin: 0, padding: 0 }}>
                <thead style={{ display: 'table-header-group', pageBreakInside: 'avoid', breakInside: 'avoid', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>
                  <tr>
                    <td style={{ padding: 0, paddingBottom: '4px' }}>
                      <MinimalSection title="Ausgewählte Projekte" accentColor={accentColor} />
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {visibleProjects.map((p) => (
                    <tr key={p.id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                      <td style={{ padding: 0, paddingBottom: '12px' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                          {getProjTitle(p)}
                        </h4>
                        <p style={{ fontSize: '0.775rem', color: '#475569', margin: '2px 0' }}>{getProjDesc(p)}</p>
                        {getProjTech(p) && getProjTech(p).length > 0 && (
                          <div style={{ fontSize: '0.725rem', color: accentColor, fontWeight: 600 }}>
                            Tech: {getProjTech(p).join(', ')}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          /* MODERN GLASS / TECH SLATE: 2-COLUMN LAYOUT */
          <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '24px' }}>
            {/* LEFT MAIN COLUMN */}
            <div>
              {/* Berufserfahrung */}
              {visibleExperiences.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse', margin: 0, padding: 0, marginBottom: '20px' }}>
                  <thead style={{ display: 'table-header-group', pageBreakInside: 'avoid', breakInside: 'avoid', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>
                    <tr>
                      <td style={{ padding: 0, paddingBottom: '4px' }}>
                        <SectionTitle title="Berufserfahrung" icon={<Briefcase size={16} color={accentColor} />} accentColor={accentColor} />
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleExperiences.map((exp) => (
                      <tr key={exp.id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                        <td style={{ padding: 0, paddingBottom: '14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                              {getExpPosition(exp)}
                            </h4>
                            <span style={{ fontSize: '0.725rem', fontWeight: 600, color: accentColor, whiteSpace: 'nowrap', flexShrink: 0, marginLeft: '12px' }}>
                              {getExpDuration(exp)}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.775rem', fontWeight: 600, color: '#64748b', marginBottom: '3px' }}>
                            {exp.company} {exp.location ? `• ${exp.location}` : ''}
                          </div>
                          {getExpSummary(exp) && <p style={{ fontSize: '0.775rem', color: '#334155', marginBottom: '3px' }}>{getExpSummary(exp)}</p>}
                          {getExpHighlights(exp) && getExpHighlights(exp).length > 0 && (
                            <ul style={{ paddingLeft: '14px', margin: 0, fontSize: '0.75rem', color: '#475569' }}>
                              {getExpHighlights(exp).map((h, i) => (
                                <li key={i} style={{ marginBottom: '2px' }}>{h}</li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Projects */}
              {showProjects && visibleProjects.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse', margin: 0, padding: 0 }}>
                  <thead style={{ display: 'table-header-group', pageBreakInside: 'avoid', breakInside: 'avoid', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>
                    <tr>
                      <td style={{ padding: 0, paddingBottom: '4px' }}>
                        <SectionTitle title="Ausgewählte Projekte" icon={<FolderGit2 size={16} color={accentColor} />} accentColor={accentColor} />
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleProjects.map((p) => (
                      <tr key={p.id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                        <td style={{ padding: 0, paddingBottom: '12px' }}>
                          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                            {getProjTitle(p)}
                          </h4>
                          <p style={{ fontSize: '0.75rem', color: '#475569', margin: '2px 0' }}>{getProjDesc(p)}</p>
                          {getProjTech(p) && getProjTech(p).length > 0 && (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '3px' }}>
                              {getProjTech(p).map((t, idx) => (
                                <span key={idx} style={{ fontSize: '0.675rem', padding: '1px 6px', borderRadius: '4px', background: `${accentColor}15`, color: accentColor, fontWeight: 600 }}>
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* RIGHT SIDEBAR */}
            <div>
              {/* Skills */}
              {visibleSkills.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse', margin: 0, padding: 0, marginBottom: '20px' }}>
                  <thead style={{ display: 'table-header-group', pageBreakInside: 'avoid', breakInside: 'avoid', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>
                    <tr>
                      <td style={{ padding: 0, paddingBottom: '4px' }}>
                        <SectionTitle title="Skills & Expertisen" icon={<Code2 size={16} color={accentColor} />} accentColor={accentColor} />
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleSkills.map((cat) => (
                      <tr key={cat.id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                        <td style={{ padding: 0, paddingBottom: '10px' }}>
                          <h5 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                            {getSkillCat(cat)}
                          </h5>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {getSkillList(cat).map((s, idx) => (
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Education */}
              {visibleEducation.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse', margin: 0, padding: 0, marginBottom: '16px' }}>
                  <thead style={{ display: 'table-header-group', pageBreakInside: 'avoid', breakInside: 'avoid', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>
                    <tr>
                      <td style={{ padding: 0, paddingBottom: '4px' }}>
                        <SectionTitle title="Ausbildung & Abschlüsse" icon={<GraduationCap size={16} color={accentColor} />} accentColor={accentColor} />
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleEducation.map((edu) => (
                      <tr key={edu.id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                        <td style={{ padding: 0, paddingBottom: '10px' }}>
                          <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                            {getEduDegree(edu)}
                          </h4>
                          <div style={{ fontSize: '0.725rem', fontWeight: 600, color: accentColor }}>
                            {edu.institution} {getEduDuration(edu) && <span style={{ whiteSpace: 'nowrap' }}>({getEduDuration(edu)})</span>}
                          </div>
                          {getEduDesc(edu) && <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '2px 0' }}>{getEduDesc(edu)}</p>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
