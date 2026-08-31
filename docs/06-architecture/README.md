# Architecture cible

Cette section consolide, sous forme de schémas, l'ensemble des choix justifiés dans les
[propositions de solutions](../05-solutions/) :

- [Architecture réseau cible](architecture-reseau-cible.md) — schéma des deux sites, segmentation VLAN,
  plan d'adressage (VLSM).
- [Architecture systèmes cible](architecture-systemes-cible.md) — salle serveurs, cluster de
  virtualisation, stockage et réplication.
- [Architecture sécurité cible](architecture-securite-cible.md) — identité, EDR, SOC/SIEM, GED sécurisée,
  logique d'accès *zero trust*.

## Principe directeur de l'architecture

L'architecture cible répond à trois principes, directement issus des constats d'audit et des contraintes
du cahier des charges :

1. **Aucun point de défaillance unique** sur les composants critiques (réseau, accès Internet, pare-feu,
   virtualisation, stockage) — traite l'ensemble des constats R1 à R5 et S1.
2. **Isolation stricte des flux bancaires** par segmentation VLAN et filtrage applicatif, du poste client
   jusqu'à la base de données KHS-Core.
3. **Sécurité intégrée dès la conception** (*security by design*) : identité, chiffrement, journalisation et
   détection sont pensés comme un ensemble cohérent (socle Microsoft 365 E5/Entra ID + Sentinel), non
   comme des briques ajoutées après coup.
