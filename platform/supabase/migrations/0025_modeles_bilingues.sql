-- ============================================================================
-- Modèles de documents bilingues (plateforme FR / EN).
--
--   - Chaque modèle porte une langue (fr par défaut : tous les modèles
--     existants restent français).
--   - À la création d'un document, chacun voit les modèles de la langue de
--     son interface ; l'administrateur choisit la langue de chaque modèle.
--   - Version anglaise des 6 modèles communs fournis avec la plateforme.
--
-- À exécuter après la migration 0024.
-- ============================================================================

alter table public.modeles_documents
  add column if not exists langue text not null default 'fr';

alter table public.modeles_documents drop constraint if exists ck_modeles_langue;
alter table public.modeles_documents add constraint ck_modeles_langue check (langue in ('fr', 'en'));

create index if not exists idx_modeles_langue on public.modeles_documents (langue);

-- Modèles communs en anglais (organisation null)
insert into public.modeles_documents (organisation, langue, titre, description, format, contenu)
select null, 'en', v.titre, v.description, v.format, v.contenu::jsonb
from (values
  ('Internal memo', 'Official internal note: subject, provisions, effective date, signature.', 'texte', $j${
    "type": "doc", "content": [
      {"type": "heading", "attrs": {"level": 1, "textAlign": "center"}, "content": [{"type": "text", "text": "INTERNAL MEMO"}]},
      {"type": "paragraph", "attrs": {"textAlign": "center"}, "content": [{"type": "text", "text": "No. ……/……/……"}]},
      {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Subject: "}, {"type": "text", "text": "[subject of the memo]"}]},
      {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "To: "}, {"type": "text", "text": "[departments concerned]"}]},
      {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Background"}]},
      {"type": "paragraph", "content": [{"type": "text", "text": "[Briefly explain the background and the reasons for this memo.]"}]},
      {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Provisions"}]},
      {"type": "bulletList", "content": [
        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[First provision]"}]}]},
        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[Second provision]"}]}]},
        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[Third provision]"}]}]}
      ]},
      {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Effective date"}]},
      {"type": "paragraph", "content": [{"type": "text", "text": "This memo takes effect on the date it is signed."}]},
      {"type": "paragraph", "attrs": {"textAlign": "right"}, "content": [{"type": "text", "text": "[City], [date]"}]},
      {"type": "paragraph", "attrs": {"textAlign": "right"}, "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "[Name and title of the signatory]"}]}
    ]}$j$),
  ('Meeting minutes', 'Attendees, agenda, discussion and table of decisions.', 'texte', $j${
    "type": "doc", "content": [
      {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "Meeting minutes"}]},
      {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Date: "}, {"type": "text", "text": "[date]   "}, {"type": "text", "marks": [{"type": "bold"}], "text": "Venue: "}, {"type": "text", "text": "[place or video call]"}]},
      {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Written by: "}, {"type": "text", "text": "[name]"}]},
      {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Attendees"}]},
      {"type": "bulletList", "content": [
        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[Name — title]"}]}]},
        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[Name — title]"}]}]}
      ]},
      {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Agenda"}]},
      {"type": "orderedList", "attrs": {"start": 1}, "content": [
        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[Item 1]"}]}]},
        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[Item 2]"}]}]}
      ]},
      {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Discussion"}]},
      {"type": "paragraph", "content": [{"type": "text", "text": "[Summary of the discussion, item by item.]"}]},
      {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Decisions and actions"}]},
      {"type": "table", "content": [
        {"type": "tableRow", "content": [
          {"type": "tableHeader", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Action"}]}]},
          {"type": "tableHeader", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Owner"}]}]},
          {"type": "tableHeader", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Deadline"}]}]}
        ]},
        {"type": "tableRow", "content": [
          {"type": "tableCell", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[action]"}]}]},
          {"type": "tableCell", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[name]"}]}]},
          {"type": "tableCell", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[date]"}]}]}
        ]},
        {"type": "tableRow", "content": [
          {"type": "tableCell", "content": [{"type": "paragraph"}]},
          {"type": "tableCell", "content": [{"type": "paragraph"}]},
          {"type": "tableCell", "content": [{"type": "paragraph"}]}
        ]}
      ]},
      {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Next meeting: "}, {"type": "text", "text": "[date]"}]}
    ]}$j$),
  ('Official letter', 'Letterhead letter: references, subject, body, closing.', 'texte', $j${
    "type": "doc", "content": [
      {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "[Organisation name]"}]},
      {"type": "paragraph", "content": [{"type": "text", "text": "[Address] — [Phone] — [Email]"}]},
      {"type": "paragraph", "attrs": {"textAlign": "right"}, "content": [{"type": "text", "text": "[City], [date]"}]},
      {"type": "paragraph", "attrs": {"textAlign": "right"}, "content": [{"type": "text", "text": "For the attention of [recipient]"}, {"type": "hardBreak"}, {"type": "text", "text": "[Recipient's address]"}]},
      {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Ref.: "}, {"type": "text", "text": "[reference]"}]},
      {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Subject: "}, {"type": "text", "text": "[subject of the letter]"}]},
      {"type": "paragraph", "content": [{"type": "text", "text": "Dear Sir or Madam,"}]},
      {"type": "paragraph", "attrs": {"textAlign": "justify"}, "content": [{"type": "text", "text": "[Body of the letter.]"}]},
      {"type": "paragraph", "attrs": {"textAlign": "justify"}, "content": [{"type": "text", "text": "Yours faithfully,"}]},
      {"type": "paragraph", "attrs": {"textAlign": "right"}, "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "[Name and title of the signatory]"}]}
    ]}$j$),
  ('Budget tracking', 'Planned / actual budget per item, with variances and rates calculated automatically.', 'tableur', $j${
    "feuilles": [{
      "nom": "Budget",
      "gras": ["A1", "A3", "B3", "C3", "D3", "E3", "A10", "B10", "C10", "D10", "E10"],
      "cellules": {
        "A1": "Budget tracking — financial year [year]",
        "A3": "Item", "B3": "Planned budget", "C3": "Actual", "D3": "Variance", "E3": "Execution rate (%)",
        "A4": "Operations", "B4": "12000000", "C4": "9500000", "D4": "=B4-C4", "E4": "=IF(B4=0;0;ROUND(C4/B4*100;1))",
        "A5": "Staff", "B5": "45000000", "C5": "44100000", "D5": "=B5-C5", "E5": "=IF(B5=0;0;ROUND(C5/B5*100;1))",
        "A6": "Communication", "B6": "6000000", "C6": "3200000", "D6": "=B6-C6", "E6": "=IF(B6=0;0;ROUND(C6/B6*100;1))",
        "A7": "Equipment", "B7": "15000000", "C7": "11800000", "D7": "=B7-C7", "E7": "=IF(B7=0;0;ROUND(C7/B7*100;1))",
        "A8": "Travel", "B8": "8000000", "C8": "6400000", "D8": "=B8-C8", "E8": "=IF(B8=0;0;ROUND(C8/B8*100;1))",
        "A10": "Total", "B10": "=SUM(B4:B8)", "C10": "=SUM(C4:C8)", "D10": "=B10-C10", "E10": "=IF(B10=0;0;ROUND(C10/B10*100;1))"
      }
    }]}$j$),
  ('Case tracking register', 'Register of cases: client or investor, subject, dates, status, owner.', 'tableur', $j${
    "feuilles": [{
      "nom": "Cases",
      "gras": ["A1", "A3", "B3", "C3", "D3", "E3", "F3", "A15", "B15"],
      "cellules": {
        "A1": "Case tracking",
        "A3": "No.", "B3": "Client / investor", "C3": "Subject", "D3": "Filing date", "E3": "Status", "F3": "Owner",
        "A4": "1", "A5": "2", "A6": "3", "A7": "4", "A8": "5", "A9": "6", "A10": "7", "A11": "8", "A12": "9", "A13": "10",
        "A15": "Cases entered", "B15": "=COUNTA(B4:B13)"
      }
    }]}$j$),
  ('Project presentation', 'Background, objectives, strengths and risks, timeline, next steps.', 'presentation', $j${
    "diapositives": [
      {"disposition": "titre", "titre": "[Project title]", "sousTitre": "[Department / unit — date]"},
      {"disposition": "contenu", "titre": "Background", "puces": ["[Current situation]", "[Stakes]", "[Identified need]"]},
      {"disposition": "contenu", "titre": "Objectives", "puces": ["[Objective 1]", "[Objective 2]", "[Objective 3]"]},
      {"disposition": "deux_colonnes", "titre": "Strengths and risks", "colonneGauche": {"titre": "Strengths", "puces": ["[Strength 1]", "[Strength 2]"]}, "colonneDroite": {"titre": "Risks", "puces": ["[Risk 1]", "[Risk 2]"]}},
      {"disposition": "contenu", "titre": "Timeline", "puces": ["[Phase 1 — period]", "[Phase 2 — period]", "[Phase 3 — period]"]},
      {"disposition": "contenu", "titre": "Next steps", "puces": ["[Expected decision]", "[Required resources]"]},
      {"disposition": "titre", "titre": "Thank you", "sousTitre": "[Contact]"}
    ]}$j$)
) as v(titre, description, format, contenu)
where not exists (
  select 1 from public.modeles_documents m where m.organisation is null and m.titre = v.titre
);
