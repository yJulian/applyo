# Applyo - Entwicklungs-Richtlinien & Anweisungen

## 🌐 Internationalisierung (i18n) - Zwingende Vorschrift

- **Regel für neue Features**: Alle neu umgesetzten Funktionen, Komponenten, Modale, Buttons, Badges, Benachrichtigungen und UI-Texte MÜSSEN immer vollständig internationalisiert werden.
- **i18n Framework**: Wir nutzen `i18next` und `react-i18next`.
- **Übersetzungs-Dateien**:
  - 🇩🇪 Deutsch: [`src/i18n/locales/de.json`](file:///home/julian/Development/Applyo/src/i18n/locales/de.json)
  - 🇬🇧 Englisch: [`src/i18n/locales/en.json`](file:///home/julian/Development/Applyo/src/i18n/locales/en.json)
- **Keine hardcodierten Texte**: In React-Komponenten dürfen keine statischen UI-Texte hartkodiert werden. Es muss immer `const { t } = useTranslation();` genutzt werden (`t('namespace.key')`).
- **Spracherkennung & Einstellungen**: Die Konfiguration liegt in [`src/i18n/config.ts`](file:///home/julian/Development/Applyo/src/i18n/config.ts). Neue Einstellungen oder Optionen müssen automatisch in den Modi `auto` (GeoIP / Browser), `de` und `en` unterstützt werden.
