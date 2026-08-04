import React, { useState, useEffect } from 'react';
import { X, Scale, ShieldCheck, Mail, Server, Database, Key, Info } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'impressum' | 'datenschutz';
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'impressum',
}) => {
  const [activeTab, setActiveTab] = useState<'impressum' | 'datenschutz'>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          (e.currentTarget as any)._mouseDownOnBackdrop = true;
        } else {
          (e.currentTarget as any)._mouseDownOnBackdrop = false;
        }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && (e.currentTarget as any)._mouseDownOnBackdrop) {
          onClose();
        }
        (e.currentTarget as any)._mouseDownOnBackdrop = false;
      }}
    >
      <div className="modal-card glass-panel" style={{ maxWidth: '720px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(99,102,241,0.15)', color: 'var(--accent-primary)' }}>
              {activeTab === 'impressum' ? <Scale size={20} /> : <ShieldCheck size={20} />}
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Rechtliche Informationen</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Impressum gem. § 5 DDG & Datenschutzerklärung gem. DSGVO
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', flexShrink: 0 }}>
          <button
            onClick={() => setActiveTab('impressum')}
            className={`btn ${activeTab === 'impressum' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, gap: '6px', fontSize: '0.85rem' }}
          >
            <Scale size={15} />
            <span>Impressum</span>
          </button>
          <button
            onClick={() => setActiveTab('datenschutz')}
            className={`btn ${activeTab === 'datenschutz' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, gap: '6px', fontSize: '0.85rem' }}
          >
            <ShieldCheck size={15} />
            <span>Datenschutzerklärung</span>
          </button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '6px', fontSize: '0.875rem', lineHeight: '1.6', color: 'var(--text-main)' }}>
          {activeTab === 'impressum' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '0.95rem', color: 'var(--accent-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Info size={16} /> Angaben gemäß § 5 DDG
                </h3>
                <div style={{ lineHeight: '1.35', color: 'var(--text-muted)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>Julian Leitner</div>
                  <div>Neuenwegstraße 37</div>
                  <div>76703 Kraichtal</div>
                  <div>Deutschland</div>
                </div>

                <h4 style={{ fontSize: '0.875rem', margin: '8px 0 2px 0', color: '#e2e8f0' }}>Kontakt:</h4>
                <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                  <Mail size={14} /> E-Mail: yJulian@outlook.de
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '0.95rem', color: '#e2e8f0', marginBottom: '8px' }}>Haftung für Inhalte</h3>
                <p style={{ margin: '0 0 8px 0', color: 'var(--text-muted)' }}>
                  Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '0.95rem', color: '#e2e8f0', marginBottom: '8px' }}>Haftung für Links</h3>
                <p style={{ margin: '0 0 8px 0', color: 'var(--text-muted)' }}>
                  Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '0.95rem', color: '#e2e8f0', marginBottom: '8px' }}>Urheberrecht</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                  Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(99,102,241,0.08)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.2)' }}>
                <h3 style={{ fontSize: '1rem', color: '#a5b4fc', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Database size={16} /> 1. Datenschutz auf einen Blick (Local-First-Prinzip)
                </h3>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                  Applyo ist als <strong>Local-First-Webanwendung</strong> konzipiert. Ihre eingegebenen Daten, Stellenbewerbungen, Lebensläufe und Notizen verbleiben ausschließlich lokal im Speicher Ihres Browsers (IndexedDB / File System Access API) und werden <strong>niemals</strong> auf eigene Server von Applyo hochgeladen oder gespeichert.
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '0.95rem', color: '#e2e8f0', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Server size={16} /> 2. Webhosting & Server-Log-Files (GitHub Pages)
                </h3>
                <p style={{ margin: '0 0 8px 0', color: 'var(--text-muted)' }}>
                  Diese Website wird über <strong>GitHub Pages</strong> gehostet (Diensteanbieter: GitHub Inc., 88 Colin P Kelly Jr St, San Francisco, CA 94107, USA). Beim Aufruf der Website erfasst GitHub automatisch Informationen in sogenannten Server-Log-Files, die Ihr Browser automatisch übermittelt. Dies umfasst:
                </p>
                <ul style={{ margin: '0 0 8px 18px', padding: 0, color: 'var(--text-muted)' }}>
                  <li>Browsertyp und Browserversion</li>
                  <li>Verwendetes Betriebssystem</li>
                  <li>Referrer URL & Hostname des zugreifenden Rechners</li>
                  <li>Uhrzeit der Serveranfrage & IP-Adresse</li>
                </ul>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                  Die Erfassung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der Websitebetreiber hat ein berechtigtes Interesse an der technisch fehlerfreien Darstellung und der Optimierung seiner Website – hierfür müssen die Server-Log-Files erfasst werden.
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '0.95rem', color: '#e2e8f0', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Key size={16} /> 3. Nutzung von KI-Diensten (Optional)
                </h3>
                <p style={{ margin: '0 0 8px 0', color: 'var(--text-muted)' }}>
                  Wenn Sie optional KI-Funktionen (z. B. Google Gemini, OpenAI, Anthropic oder lokale Modelle wie Ollama) in den Einstellungen aktivieren:
                </p>
                <ul style={{ margin: '0 0 8px 18px', padding: 0, color: 'var(--text-muted)' }}>
                  <li>Werden Ihre eingegebenen API-Schlüssel lokal in Ihrem Browser gespeichert.</li>
                  <li>Werden Prompts und Stelleninhalte direkt von Ihrem Browser an den von Ihnen ausgewählten Schnittstellen-Anbieter übermittelt.</li>
                  <li>Applyo betreibt keinen eigenen Zwischenserver für KI-Anfragen.</li>
                </ul>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '0.95rem', color: '#e2e8f0', marginBottom: '8px' }}>4. Ihre Rechte gem. DSGVO</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                  Sie haben jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung sowie ein Recht auf Berichtigung oder Löschung dieser Daten. Bei Fragen können Sie sich jederzeit unter der im Impressum angegebenen E-Mail-Adresse an uns wenden.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
          <button onClick={onClose} className="btn btn-primary" style={{ padding: '8px 20px' }}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
