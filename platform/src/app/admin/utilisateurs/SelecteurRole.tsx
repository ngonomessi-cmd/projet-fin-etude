"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { changerRoleAction } from "./actions";
import type { RoleUtilisateur } from "@/lib/types";
import { LABEL_ROLE } from "@/lib/labels";

const ROLES: RoleUtilisateur[] = ["lecteur", "redacteur", "validateur", "administrateur", "auditeur"];

export function SelecteurRole({ utilisateurId, roleActuel }: { utilisateurId: string; roleActuel: RoleUtilisateur }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function changer(nouveauRole: RoleUtilisateur) {
    if (nouveauRole === roleActuel) return;
    setEnCours(true);
    setErreur(null);
    const resultat = await changerRoleAction(utilisateurId, nouveauRole);
    setEnCours(false);
    if (resultat.erreur) {
      setErreur(resultat.erreur);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <select
        defaultValue={roleActuel}
        disabled={enCours}
        onChange={(e) => changer(e.target.value as RoleUtilisateur)}
        className="rounded-md border border-slate-300 px-2 py-1 text-sm disabled:opacity-50"
      >
        {ROLES.map((role) => (
          <option key={role} value={role}>
            {LABEL_ROLE[role]}
          </option>
        ))}
      </select>
      {erreur && <p className="mt-1 text-xs text-red-600">{erreur}</p>}
    </div>
  );
}
