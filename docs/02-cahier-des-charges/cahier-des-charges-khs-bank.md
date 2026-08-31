# Cahier des charges pour l'évolution du système d'information de KHS BANK

> Document rédigé par le donneur d'ordre (KHS Bank), adapté du modèle de cahier des charges fourni par
> l'établissement de formation (Groupe Solaris) au secteur bancaire. Ce document sert de point d'entrée
> au dossier de mise en situation : il fixe le périmètre, les contraintes et l'infrastructure existante que
> MOM-TECH doit auditer puis faire évoluer.

## 1. Contexte

### 1.1 Objet du marché

Ce cahier des charges définit la mission générale de la prestation informatique dans les établissements
du groupe **KHS Bank**.

L'évolution concerne la totalité du système d'information des deux sites, à partir de l'infrastructure
réseau (matérielle et logicielle), des serveurs et postes de travail, des terminaux connectés, des services
et applications bancaires et bureautiques, des procédures de maintenance courante et de sécurité, ainsi
que de la mise en conformité avec les nouveaux enjeux de la cybersécurité et de la continuité d'activité
(gestion de crise, exigences de résilience propres au secteur bancaire). Le donneur d'ordre attend
également des recommandations sur tout élément non prévu au présent projet mais dont le prestataire,
de par sa compétence technique, estimerait l'évolution nécessaire ; dans ce cas, une étude d'impact
(bénéfices/risques) devra être fournie.

L'ampleur de la tâche et la portée des mesures dépendent :

- de la taille du parc informatique et des équipements réseau ;
- du volume et de la sensibilité des données traitées (données bancaires et personnelles des clients) ;
- de la complexité de l'infrastructure ;
- des spécificités et de l'organisation interne de l'établissement (contraintes réglementaires du secteur
  bancaire) ;
- des moyens mis à disposition.

**NB :** L'application métier cœur de métier (le progiciel bancaire **KHS-Core**) n'est pas concernée par la
maintenance applicative, celle-ci étant prise en charge par l'éditeur. Le prestataire reste néanmoins
responsable de l'infrastructure qui l'héberge (serveurs, base de données, réseau, sécurité).

### 1.2 Champ d'application

Le Groupe a engagé depuis plusieurs années une politique de modernisation de son infrastructure de
gestion afin d'offrir un service attractif, réactif et sécurisé à ses clients particuliers, professionnels et
privés, tout en répondant aux exigences croissantes du superviseur bancaire.

### 1.3 À propos de KHS Bank

KHS Bank est un établissement bancaire de taille intermédiaire proposant des services de banque de
détail, de banque des professionnels et de gestion de patrimoine (banque privée). L'établissement
s'appuie sur trois pôles d'activité :

- **Banque de détail** : comptes courants, épargne, crédits immobiliers et à la consommation pour les
  particuliers ;
- **Banque des professionnels et entreprises** : financement, gestion de trésorerie, moyens de paiement ;
- **Gestion de patrimoine / banque privée** : conseil en investissement pour une clientèle exigeante en
  matière de confidentialité et de disponibilité de service.

KHS Bank est agréée en tant qu'établissement de crédit par l'Autorité de Contrôle Prudentiel et de
Résolution (ACPR) et est soumise à ce titre à des obligations renforcées de sécurité, de traçabilité et de
continuité d'activité.

### 1.4 Contexte d'origine

Depuis sa création en 2004, KHS Bank a connu une croissance régulière de son portefeuille clients et de
son produit net bancaire. Afin de conserver sa compétitivité et sa conformité réglementaire, KHS Bank
dispose d'un budget annuel de **14 000 000 €** destiné à la maintenance et à l'évolution de son système
d'information. La société dispose d'un **siège social à Paris La Défense** et d'un **site secondaire à Lyon**
(centre de back-office et plateforme téléphonique clients), qui doit pouvoir accéder en permanence aux
ressources du siège.

Depuis 2019, consciente de la vétusté de son SI et des risques croissants en matière de cybersécurité
(le secteur bancaire étant une cible privilégiée des attaques), la direction a engagé une réflexion sur la
modernisation de son SI sans parvenir, faute de compétences internes suffisantes, à statuer sur les
actions nécessaires. Il a donc été décidé de confier cette migration à un prestataire externe spécialisé,
aussi bien sur les environnements utilisateurs que serveurs, réseau et sécurité.

La société compte environ **780 utilisateurs** répartis dans les différents services du siège (répartis dans
le même immeuble), et environ **140 utilisateurs** sur le site secondaire de Lyon.

### 1.5 Les contraintes principales

KHS Bank est attachée à la démarche **ITIL** ; tous les services sont organisés par rapport au référentiel de
la version 4. Toute la démarche projet du prestataire devra donc s'appuyer sur ce référentiel et en
respecter les préconisations.

Le prestataire devra en outre justifier de toutes les technologies utilisées et démontrer leur conformité
avec les exigences réglementaires du secteur bancaire :

- **RGPD** (Règlement Général sur la Protection des Données) ;
- **Recommandations ACPR/Banque de France** en matière de sécurité des systèmes d'information et de
  plan de continuité d'activité (les interruptions de service sur les moyens de paiement sont
  particulièrement surveillées) ;
- **DSP2** (Directive sur les Services de Paiement 2) et exigences d'authentification forte du client ;
- **Norme PCI-DSS** pour toute donnée relative aux cartes de paiement ;
- **Secret bancaire** et cloisonnement strict des données clients.

### 1.6 Infrastructure existante

Au niveau des services réseau, l'infrastructure actuelle dispose de :

- Connexions VPN permettant la communication entre le siège et le site de Lyon. Ces connexions
  permettent actuellement l'accès à l'annuaire Active Directory, à la messagerie, au serveur de fichiers et
  à l'application métier **KHS-Core**.
- Base de données utilisateurs **SQL Server 2012**, environnement **Windows Active Directory 2016**
  (présent au siège et à Lyon).
- Services : DNS, DHCP, routage, pare-feu, accès Internet, partages fichiers.
- Système de messagerie **Exchange 2013**.
- Services web : portail intranet et espace client (extranet) associés à une base de données dédiée.
- Serveur d'application métier : **KHS-Core**, progiciel bancaire reposant sur une base de données
  **SQL Server 2012**, hébergeant la gestion des comptes, des opérations et des moyens de paiement.
- Les ordinateurs (postes fixes et portables) sont issus de configurations hétérogènes, déployées de
  manière disparate selon les services.
- L'environnement des utilisateurs est basé sur **Windows 8** pour les postes les plus récents ; la suite
  **Office 2007/2010/2011** cohabite selon les services.

Les serveurs du SI : deux serveurs Linux hébergent les applications de gestion administrative, la gestion
économique et financière, la paye et des bases de données Oracle. Un serveur de fichiers sous
**Windows Server 2016** héberge les répertoires personnels et les partages communs. Une dizaine de
serveurs rack hébergent la messagerie, les applications web et les bases de données métier. L'ensemble
des données est stocké sur une seule baie de stockage. Les sauvegardes sont réalisées par deux robots
de sauvegarde, les bandes étant conservées dans les sous-sols du siège — configuration jugée
insuffisante au regard des exigences de continuité d'activité imposées à un établissement bancaire.

Postes de travail : environ **920 postes** (fixes et portables), système d'exploitation Windows 8, suites
bureautiques hétérogènes (Office 2016, Office 2011 Mac, Open Office), navigateurs Internet Explorer 7 et
9. Achats étalés entre 2007 et 2017.

Réseau : architecture à trois niveaux faiblement redondante. L'ensemble des plateaux du siège est
interconnecté en réseau local Ethernet mixte (liens 100 Base TX, backbone 1000 Base TX). Les deux
sites sont connectés via une solution VPN unique, sans lien de secours.

## 2. Opportunité du projet et actions attendues

Il a été décidé de refondre l'ensemble du SI et d'en fiabiliser l'organisation lors d'une action unique
confiée à un prestataire externe spécialisé en intelligence artificielle, cloud et cybersécurité — domaines
jugés stratégiques par la direction pour répondre à la fois aux enjeux de fraude, de résilience et de
compétitivité digitale.

### 2.1 Redondances

D'anciens serveurs locaux sont toujours en activité sur le site de Lyon ; personne ne souhaite les
débrancher, faute de documentation sur leur usage réel.

### 2.2 Congestion et latence

Une équipe du site de Lyon a mis en place un partage de fichiers « sauvage », échappant à la gestion
centrale et générant des coûts cachés et des risques de sécurité. Les utilisateurs constatent un temps de
latence important au démarrage des postes puis tout au long de la journée ; à certains moments, seules
les applications de gestion financière et la téléphonie restent disponibles.

### 2.3 Dysfonctionnements

La coexistence de versions différentes des suites bureautiques pose des problèmes de compatibilité sur
d'anciens fichiers Excel utilisés pour des modèles de simulation financière. Les pertes de fichiers, rares
avant 2010, se banalisent. L'utilisation de systèmes et logiciels obsolètes expose l'établissement à des
failles de sécurité critiques ; le non-respect des exigences RGPD et des recommandations ACPR
exposerait KHS Bank à de lourdes sanctions financières et réputationnelles.

### 2.4 Divers

Certains collaborateurs contournent la lenteur du réseau en se connectant via smartphone en 4G, sur des
partages temporaires non sauvegardés (FTP), au détriment de la traçabilité exigée en environnement
bancaire.

## 3. Besoins et attentes

Face à cette situation, une analyse globale du SI est nécessaire, dans le strict respect de la législation sur
la protection des données et du secret bancaire. Le prestataire retenu devra :

- identifier ce qui est en place et les causes de dysfonctionnements ;
- proposer un diagnostic global et des solutions d'amélioration ;
- refondre, si nécessaire, l'architecture physique et logique de tout ou partie du SI ;
- proposer le remplacement/la mise à jour du matériel non performant ;
- réaliser un audit de sécurité après mise en place de la nouvelle infrastructure ;
- diminuer les coûts de fonctionnement et fiabiliser le SI en conformité avec les réglementations
  bancaires et la sécurité des données, tout en augmentant la productivité, en particulier en situation de
  crise (plan de continuité d'activité).

### 3.1 Actions attendues

Le prestataire devra fournir une description détaillée de son intervention en termes de coûts, de délais
et de gains de performance, et se conformer au formalisme de gestion de projet suivant :

- équipe projet composée de deux sous-équipes : **Équipe Architecture Système** et **Équipe Réseau &
  Sécurité** ;
- identification et nomination de l'instance de pilotage ;
- analyse des principaux risques ;
- définition des indicateurs de suivi du projet ;
- définition de la stratégie d'accompagnement des populations impactées ;
- plan de formation des utilisateurs ;
- veille technologique en matière d'infrastructure, d'intelligence artificielle et de sécurité.

## 4. Structure des réponses et lotissements

### 4.1 Généralités

KHS Bank (Maître d'Ouvrage) recherche un prestataire unique (Maître d'Œuvre), **MOM-TECH**, pour
l'aider à faire évoluer son système d'information et le rendre conforme aux performances et exigences
réglementaires attendues pour un établissement de cette taille.

### 4.2 Lots principaux (lots A à J)

- **Lot A** : Architecture réseau (switches, routeurs, DMZ, accès distants…) et services DHCP/DNS
- **Lot B** : Déploiement des postes clients (client léger, client lourd)
- **Lot C** : Migration des logiciels de bureautique vers Office 365
- **Lot D** : Solution antivirus/EDR centralisée
- **Lot E** : Système de prévention d'intrusion (IDS/IPS)
- **Lot F** : Audit de sécurité
- **Lot G** : PRA / PCA
- **Lot H** : Monitoring et ticketing
- **Lot I** : Gestion de parc informatique et contrat de maintenance
- **Lot J** : Déploiements et mises à jour (OS et applications)

### 4.3 Lots complémentaires (lots 1 à 6)

- **Lot 1** : Stockage et sauvegarde
- **Lot 2** : Annuaire LDAP
- **Lot 3** : Virtualisation
- **Lot 4** : Messagerie
- **Lot 5** : Bases de données (applications métiers / outils collaboratifs)
- **Lot 6** : VOIP

### 4.4 Déploiements — obligation de moyens

Le prestataire devra préciser les moyens dont il dispose pour garantir le respect des délais, minimiser
l'impact de l'évolution du SI sur l'activité bancaire (aucun arrêt total d'un service, en particulier des
moyens de paiement) et les délais moyens d'approvisionnement auprès de ses fournisseurs.

## 5. Examen de l'infrastructure du point de vue cybersécurité

Le prestataire devra examiner et mettre à jour les politiques et procédures de sécurité, l'architecture de
sécurité existante, les processus d'évaluation de vulnérabilité et de tests d'intrusion, la sécurité réseau
(pare-feu, IDS/IPS, segmentation, passerelle web et messagerie, proxy, DLP, gestion des correctifs, AV,
SIEM), et formuler des recommandations pour l'efficacité des contrôles de sécurité, avec une attention
particulière portée à la fraude et aux tentatives d'intrusion visant les systèmes de paiement.

**Livrables :** recommandations et modifications des politiques et procédures existantes ; rapport détaillé
avec plan d'action et mécanisme de reporting (tableau de bord).

## 6. Préparation de la cybersecurity framework

- Préparation de la politique et des procédures de cybersécurité ;
- Préparation du plan de gestion de la cyber-crise dans le cadre de la politique de cybersécurité.

**Livrables :** politique et procédures de cybersécurité ; plan de gestion de la cyber-crise ; changements
apportés aux politiques/procédures existantes.

## 7. Mise en place du SOC

Mise en place et intégration d'un SOC (Security Operations Center), avec exploitation d'un SIEM et, dans
la mesure du possible, de mécanismes de détection assistée par intelligence artificielle (détection
d'anomalies comportementales, lutte anti-fraude).

**Livrables :** architecture du SOC ; planning préliminaire de réalisation ; plan de test global ; plan de
formation ; contrat de support ; démonstration sur plateforme de test.
