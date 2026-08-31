# Audit de l'existant — KHS Bank

Cette section détaille l'audit mené par MOM-TECH conformément à la méthode décrite dans
[l'étude du cahier des charges](../02-cahier-des-charges/etude-cahier-des-charges.md) : inventaire
exhaustif, entretiens avec les parties prenantes, analyse des écarts, restitution structurée.

L'audit couvre les trois domaines du périmètre (lots principaux, lots complémentaires, cybersécurité) sur
les deux sites de KHS Bank :

- [Audit réseau](audit-reseau.md)
- [Audit systèmes](audit-systemes.md)
- [Audit cybersécurité](audit-cybersecurite.md)
- [Conclusion de l'audit](conclusion-audit.md) — synthèse des constats et matrice de criticité, base des
  [propositions de solutions](../05-solutions/)

## Périmètre et méthode de réalisation

| Site | Rôle | Population | Éléments audités |
|---|---|---|---|
| Paris (siège) | Direction, DSI, back-office central, salle serveurs principale | 780 utilisateurs | Réseau cœur, serveurs, sécurité, postes |
| Lyon (site secondaire) | Back-office régional, centre de relation client | 140 utilisateurs | Réseau local, poste clients, liaison au siège |

L'audit a été mené par les deux sous-équipes projet, en s'appuyant sur : la documentation existante
fournie par la DSI de KHS Bank, des relevés techniques sur site (câblage, baies, configurations
d'équipements), des entretiens avec le Responsable Infrastructure & Réseau, le RSSI et un panel
d'utilisateurs représentatif de chaque service.
