#!/usr/bin/env python3
"""Tests du rôle superviseur (migrations 0034-0035) sur la base locale rejouée par rejouer.sh."""
import subprocess
import sys

BASE = ["psql", "-h", "/var/tmp/pgged", "-p", "5499", "-U", "postgres", "-d", "ged", "-At", "-q", "-v", "ON_ERROR_STOP=1"]
SUP = "33333333-0000-0000-0000-000000000001"
RED, VAL, ADM, AUD, LEC, RED2 = (f"11111111-0000-0000-0000-00000000000{i}" for i in range(1, 7))
ok = ko = 0


def sql(q, uid=None):
    if uid:
        q = (f"set role authenticated; set test.uid = '{uid}';"
             f"set request.jwt.claims = '{{\"sub\":\"{uid}\",\"aal\":\"aal2\"}}';" + q)
    r = subprocess.run(BASE + ["-c", q], capture_output=True, text=True)
    lignes = [l for l in r.stdout.strip().splitlines() if l]
    return r.returncode == 0, (lignes[-1] if lignes else ""), r.stderr.strip()


def verifier(nom, cond, detail=""):
    global ok, ko
    if cond:
        ok += 1; print("✓", nom)
    else:
        ko += 1; print("✗", nom, detail)


# superviseur créé comme un compte ordinaire puis promu par la base
sql(f"""insert into auth.users (id, email, raw_user_meta_data) values ('{SUP}', 'sup@khs', '{{"nom_complet":"Sam Superviseur","departement":"Direction"}}');
update public.profiles set role = 'superviseur' where id = '{SUP}';""")
D_RH = sql(f"""insert into public.documents (titre, classification, statut, departement, owner_id) values
  ('TEST RH confidentiel', 'confidentiel', 'brouillon', 'RH', '{RED2}') returning id""")[1]
D_FIN = sql(f"""insert into public.documents (titre, classification, statut, departement, owner_id) values
  ('TEST Finance', 'restreint', 'brouillon', 'Finance', '{RED}') returning id""")[1]

verifier("brouillon d'un autre : invisible", sql(f"select count(*) from documents where id='{D_RH}'", SUP)[1] == "0")
verifier("rédacteur RH soumet son document", sql(f"select statut from transition_statut_document('{D_RH}', 'en_verification', null)", RED2)[0])
verifier("superviseur voit le document confidentiel RH en vérification", sql(f"select count(*) from documents where id='{D_RH}'", SUP)[1] == "1")
r = sql(f"select statut from transition_statut_document('{D_RH}', 'valide', 'ok')", SUP)
verifier("superviseur valide un document d'un autre département", r[0] and r[1] == "valide", r[2])
r = sql(f"select statut from transition_statut_document('{D_RH}', 'publie', null)", SUP)
verifier("superviseur publie", r[0] and r[1] == "publie", r[2])
r = sql(f"select archive_le is not null from archiver_document('{D_RH}', 'test')", SUP)
verifier("superviseur archive", r[0] and r[1] == "t", r[2])
verifier("le lecteur ne voit toujours pas le document confidentiel RH", sql(f"select count(*) from documents where id='{D_RH}'", LEC)[1] == "0")
verifier("superviseur lit le journal d'audit de toute l'organisation", int(sql("select count(*) from audit_log", SUP)[1] or 0) >= 3)
r = sql(f"insert into documents (titre, classification, statut, departement, owner_id) values ('TEST sup', 'public_interne', 'brouillon', 'Direction', '{SUP}') returning id", SUP)
verifier("superviseur crée un document", r[0], r[2])
# réglages refusés
r = sql(f"select changer_role_utilisateur('{LEC}', 'administrateur')", SUP)
verifier("changement de rôle refusé", not r[0], r[1])
r = sql(f"select definir_parametres_archivage(6, '{{}}'::jsonb)", SUP)
verifier("paramètres d'archivage refusés", not r[0], r[1])
r = sql(f"select designer_titulaire_signature('DG', '{SUP}')", SUP)
verifier("désignation du titulaire de signature refusée", not r[0], r[1])
r = sql("insert into modeles_documents (titre, format, contenu) values ('x', 'texte', '{}'::jsonb)", SUP)
verifier("création de modèle refusée", not r[0], r[1])
r = sql(f"select definir_role_courrier('{LEC}', 'chef')", SUP)
verifier("désignation d'un rôle courrier refusée", not r[0], r[1])
r = sql("select count(*) from etat_mfa_utilisateurs()", SUP)
verifier("état MFA des agents refusé", (not r[0]) or r[1] == "0", r[1])
# non-régression
r = sql(f"select statut from transition_statut_document('{D_FIN}', 'en_verification', null)", RED)
verifier("rédacteur Finance soumet", r[0], r[2])
r = sql(f"select statut from transition_statut_document('{D_FIN}', 'valide', null)", RED2)
verifier("rédacteur RH ne peut pas valider un document Finance", not r[0])
r = sql(f"select statut from transition_statut_document('{D_FIN}', 'valide', null)", VAL)
verifier("validateur Finance valide", r[0] and r[1] == "valide", r[2])
r = sql(f"select changer_role_utilisateur('{LEC}', 'redacteur')", ADM)
verifier("l'administrateur garde la gestion des rôles", r[0], r[2])
r = sql(f"select changer_role_utilisateur('{LEC}', 'superviseur')", ADM)
verifier("l'administrateur peut attribuer le rôle superviseur", r[0], r[2])
sql(f"update profiles set role='lecteur' where id='{LEC}'")
print(f"\n{ok} réussis, {ko} en échec")
sys.exit(1 if ko else 0)
