# Contrat de maintenance informatique

**Entre les soussignés :**

La société **MOM-TECH**, représentée par son Chef de projet en sa qualité d'intervenant,

Ci-après dénommée « le Prestataire », d'une part,

**Et :**

La société **KHS Bank**, représentée par sa Directrice/son Directeur des Systèmes d'Information en sa
qualité d'intervenant,

Ci-après dénommée « le Client », d'autre part,

Dénommées conjointement « Les parties », il a été préalablement exposé ce qui suit : le présent contrat
est un contrat de maintenance et de support informatique faisant suite au projet de migration et de
sécurisation du système d'information de KHS Bank.

## Article 1 — Objet

Le présent contrat a pour objet de définir les conditions dans lesquelles le Prestataire assure la
maintenance préventive et corrective de l'infrastructure déployée (réseau, systèmes, virtualisation,
cybersécurité) ainsi que l'astreinte du SOC, décrits dans les [propositions de solutions](../05-solutions/).

## Article 2 — Durée

Le présent contrat est conclu pour une durée initiale de **trois ans**, à compter du procès-verbal de
recette (cf. [Recette](recette.md)), renouvelable par tacite reconduction par périodes d'un an, sauf
dénonciation par l'une des parties avec un préavis de trois mois.

## Article 3 — Obligations du Prestataire

Le Prestataire s'engage à :

- assurer la **maintenance préventive** (supervision continue, application des correctifs de sécurité,
  contrôle des sauvegardes et de la réplication PRA/PCA) ;
- assurer la **maintenance corrective** sur incident, selon les niveaux de service définis à l'Article 4 ;
- maintenir une **astreinte SOC 24/7** pour les incidents de sécurité critiques ;
- fournir un **reporting mensuel** des indicateurs de service (disponibilité, incidents, tickets traités) à
  la DSI de KHS Bank ;
- réaliser une **revue de sécurité trimestrielle** et un **test d'intrusion annuel**
  (cf. [Lot F](../05-solutions/lot-f-audit-securite-ged.md)) ;
- assurer une **veille technologique** en matière d'infrastructure, d'intelligence artificielle et de
  cybersécurité, conformément à l'article 3.1 du cahier des charges.

## Article 4 — Niveaux de service (SLA)

| Criticité | Exemple | Délai de prise en charge | Délai de résolution cible |
|---|---|---|---|
| Critique | Panne du cœur de réseau, indisponibilité KHS-Core, incident de sécurité majeur | 15 minutes | 1 heure (RTO KHS-Core) |
| Majeure | Panne d'un équipement redondé, dégradation de service | 1 heure | 4 heures |
| Mineure | Incident sans impact utilisateur direct | 4 heures | 2 jours ouvrés |
| Demande standard | Demande d'évolution mineure, question d'exploitation | 1 jour ouvré | Selon planification |

Le non-respect des délais de résolution cibles pour les incidents de criticité **critique** et **majeure**
donne lieu à des pénalités contractuelles, définies en annexe financière du contrat.

## Article 5 — Obligations du Client

Le Client s'engage à désigner un référent technique disponible pour les échanges avec le Prestataire, à
faciliter l'accès aux locaux et aux équipements pour les interventions programmées, et à respecter les
échéances de paiement définies à l'Article 6.

## Article 6 — Prix et facturation

Conformément au [bilan financier](bilan-financier.md), la facturation récurrente s'élève à
**≈ 125 440 € par mois** (licences, maintenance réseau, astreinte SOC, maintenance infrastructure,
sauvegarde/réplication), payable mensuellement à terme échu.

## Article 7 — Confidentialité

Le Prestataire s'engage à respecter la confidentialité des données bancaires et personnelles auxquelles
il pourrait avoir accès dans le cadre de ses interventions, conformément au RGPD et au secret bancaire,
et à faire signer une clause de confidentialité à l'ensemble de ses collaborateurs intervenant sur le
périmètre KHS Bank.

## Article 8 — Résiliation

Le contrat peut être résilié de plein droit par l'une des parties en cas de manquement grave de l'autre
partie à ses obligations, après mise en demeure restée infructueuse pendant trente jours.
