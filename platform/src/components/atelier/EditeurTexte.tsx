"use client";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect } from "react";
import type { ContenuTexte } from "@/lib/atelier/contenus";
import { EnTeteDocument } from "@/components/atelier/EnTeteDocument";
import { useTraduction } from "@/components/i18n/Langue";
import type { Traduire } from "@/lib/i18n/plateforme";

type Bouton = {
  libelle: string;
  titre: string;
  actif?: (e: Editor) => boolean;
  action: (e: Editor) => void;
  desactive?: (e: Editor) => boolean;
  classe?: string;
};

const groupes = (t: Traduire): Bouton[][] => [
  [
    { libelle: "↶", titre: t("Annuler (Ctrl+Z)", "Undo (Ctrl+Z)"), action: (e) => e.chain().focus().undo().run(), desactive: (e) => !e.can().undo() },
    { libelle: "↷", titre: t("Rétablir (Ctrl+Y)", "Redo (Ctrl+Y)"), action: (e) => e.chain().focus().redo().run(), desactive: (e) => !e.can().redo() },
  ],
  [
    { libelle: t("Texte", "Text"), titre: t("Paragraphe", "Paragraph"), actif: (e) => e.isActive("paragraph"), action: (e) => e.chain().focus().setParagraph().run() },
    { libelle: t("T1", "H1"), titre: t("Titre 1", "Heading 1"), actif: (e) => e.isActive("heading", { level: 1 }), action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run() },
    { libelle: t("T2", "H2"), titre: t("Titre 2", "Heading 2"), actif: (e) => e.isActive("heading", { level: 2 }), action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
    { libelle: t("T3", "H3"), titre: t("Titre 3", "Heading 3"), actif: (e) => e.isActive("heading", { level: 3 }), action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  ],
  [
    { libelle: t("G", "B"), titre: t("Gras (Ctrl+B)", "Bold (Ctrl+B)"), classe: "font-bold", actif: (e) => e.isActive("bold"), action: (e) => e.chain().focus().toggleBold().run() },
    { libelle: "I", titre: t("Italique (Ctrl+I)", "Italic (Ctrl+I)"), classe: "italic font-serif", actif: (e) => e.isActive("italic"), action: (e) => e.chain().focus().toggleItalic().run() },
    { libelle: t("S", "U"), titre: t("Souligné (Ctrl+U)", "Underline (Ctrl+U)"), classe: "underline", actif: (e) => e.isActive("underline"), action: (e) => e.chain().focus().toggleUnderline().run() },
    { libelle: t("B", "S"), titre: t("Barré", "Strikethrough"), classe: "line-through", actif: (e) => e.isActive("strike"), action: (e) => e.chain().focus().toggleStrike().run() },
  ],
  [
    { libelle: "⯇", titre: t("Aligner à gauche", "Align left"), actif: (e) => e.isActive({ textAlign: "left" }), action: (e) => e.chain().focus().setTextAlign("left").run() },
    { libelle: "≡", titre: t("Centrer", "Center"), actif: (e) => e.isActive({ textAlign: "center" }), action: (e) => e.chain().focus().setTextAlign("center").run() },
    { libelle: "⯈", titre: t("Aligner à droite", "Align right"), actif: (e) => e.isActive({ textAlign: "right" }), action: (e) => e.chain().focus().setTextAlign("right").run() },
    { libelle: "☰", titre: t("Justifier", "Justify"), actif: (e) => e.isActive({ textAlign: "justify" }), action: (e) => e.chain().focus().setTextAlign("justify").run() },
  ],
  [
    { libelle: t("• Liste", "• List"), titre: t("Liste à puces", "Bulleted list"), actif: (e) => e.isActive("bulletList"), action: (e) => e.chain().focus().toggleBulletList().run() },
    { libelle: t("1. Liste", "1. List"), titre: t("Liste numérotée", "Numbered list"), actif: (e) => e.isActive("orderedList"), action: (e) => e.chain().focus().toggleOrderedList().run() },
    { libelle: "❝", titre: t("Citation", "Quote"), actif: (e) => e.isActive("blockquote"), action: (e) => e.chain().focus().toggleBlockquote().run() },
    { libelle: "―", titre: t("Ligne de séparation", "Horizontal line"), action: (e) => e.chain().focus().setHorizontalRule().run() },
  ],
  [
    { libelle: t("▦ Tableau", "▦ Table"), titre: t("Insérer un tableau 3 × 3", "Insert a 3 × 3 table"), action: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
    { libelle: t("+ Ligne", "+ Row"), titre: t("Ajouter une ligne dessous", "Add a row below"), action: (e) => e.chain().focus().addRowAfter().run(), desactive: (e) => !e.can().addRowAfter() },
    { libelle: "+ Col.", titre: t("Ajouter une colonne à droite", "Add a column to the right"), action: (e) => e.chain().focus().addColumnAfter().run(), desactive: (e) => !e.can().addColumnAfter() },
    { libelle: t("− Ligne", "− Row"), titre: t("Supprimer la ligne", "Delete row"), action: (e) => e.chain().focus().deleteRow().run(), desactive: (e) => !e.can().deleteRow() },
    { libelle: "− Col.", titre: t("Supprimer la colonne", "Delete column"), action: (e) => e.chain().focus().deleteColumn().run(), desactive: (e) => !e.can().deleteColumn() },
    { libelle: t("✕ Tableau", "✕ Table"), titre: t("Supprimer le tableau", "Delete table"), action: (e) => e.chain().focus().deleteTable().run(), desactive: (e) => !e.can().deleteTable() },
  ],
];

export function EditeurTexte({
  contenu,
  lectureSeule = false,
  classification,
  onChange,
}: {
  contenu: ContenuTexte;
  lectureSeule?: boolean;
  classification?: string;
  onChange?: (contenu: ContenuTexte) => void;
}) {
  const { t } = useTraduction();
  const editeur = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      TableKit.configure({ table: { resizable: false } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: contenu,
    editable: !lectureSeule,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: { attributes: { class: "contenu-atelier focus:outline-none" } },
    onUpdate: ({ editor }) => onChange?.(editor.getJSON() as ContenuTexte),
  });

  useEffect(() => {
    editeur?.setEditable(!lectureSeule);
  }, [editeur, lectureSeule]);

  return (
    <div className="flex flex-col">
      {!lectureSeule && editeur && (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 rounded-t-lg border border-paper-200 bg-white px-2 py-1.5 shadow-sm">
          {groupes(t).map((groupe, i) => (
            <div key={i} className="flex items-center gap-0.5 border-r border-paper-200 pr-1 last:border-r-0">
              {groupe.map((b) => (
                <button
                  key={b.titre}
                  type="button"
                  title={b.titre}
                  aria-label={b.titre}
                  aria-pressed={b.actif?.(editeur)}
                  disabled={b.desactive?.(editeur)}
                  onMouseDown={(ev) => ev.preventDefault()}
                  onClick={() => b.action(editeur)}
                  className={`min-w-8 rounded px-2 py-1 text-xs text-[#1c2029] transition-colors hover:bg-paper-100 disabled:opacity-30 ${
                    b.actif?.(editeur) ? "bg-navy-950 text-white hover:bg-navy-900" : ""
                  } ${b.classe ?? ""}`}
                >
                  {b.libelle}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
      <div className={`overflow-x-auto bg-paper-100 px-2 py-6 sm:px-6 ${lectureSeule ? "rounded-lg" : "rounded-b-lg border border-t-0 border-paper-200"}`}>
        <div className="mx-auto min-h-[60vh] w-full max-w-[816px] bg-white px-8 py-10 shadow-md sm:px-16 sm:py-14">
          <EnTeteDocument classification={classification} />
          <EditorContent editor={editeur} />
        </div>
      </div>
    </div>
  );
}
