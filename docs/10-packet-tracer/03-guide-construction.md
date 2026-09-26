# Guide de construction pas-à-pas

## 1. Placer les équipements

Dans Packet Tracer, les catégories d'équipements se trouvent dans la barre en bas à gauche :

1. **Routeurs** (icône routeur) → glisser 3× **Router 2911** : `ISP-RTR`, `RTR-PARIS`, `RTR-LYON`.
2. **Pare-feu / sécurité** → glisser 2× **ASA 5505** : `FW-PARIS`, `FW-LYON`.
3. **Switches** → glisser :
   - 3× **Multilayer Switch 3560-24PS** : `CORE-PARIS-SW1`, `CORE-PARIS-SW2`, `CORE-LYON-SW`
   - 2× **Switch 2960-24TT** : `ACC-PARIS-SW`, `ACC-LYON-SW`
4. **Sans fil** → glisser 1× **AccessPoint-PT** : `AP-PARIS` (le Wi-Fi n'est démontré qu'à Paris).
5. **Fin de chaîne (End Devices)** → glisser les 2 serveurs (**Server-PT**), les 4 PC (**PC-PT**), 1
   **Laptop-PT** et 1 **IP Phone** — cf. [inventaire complet](01-topologie-et-cablage.md#1-inventaire-des-équipements)
   (20 équipements au total).

Renommez chaque appareil (clic sur son nom sous l'icône) exactement comme dans l'inventaire : les noms
sont repris tels quels dans les fichiers de configuration.

## 2. Câbler

Suivez le [plan de câblage](01-topologie-et-cablage.md#2-plan-de-câblage) dans l'ordre indiqué, en
utilisant le câble **« Automatique »** (l'icône éclair dans la palette de câbles) : Packet Tracer choisit
alors automatiquement croisé/droit selon les deux extrémités.

> Pour le laptop : ajoutez d'abord un **module sans fil** (WMP300N) via l'onglet **Physical → éteindre
> l'appareil → glisser le module → rallumer**, avant de le relier en Wi-Fi à `AP-PARIS`.

## 3. Configurer, dans cet ordre

L'ordre compte : chaque étape dépend de la précédente pour être testable.

1. **ISP-RTR** (copier [`configs/ISP-RTR.txt`](configs/ISP-RTR.txt) dans sa console).
2. **RTR-PARIS** puis **RTR-LYON** ([`RTR-PARIS.txt`](configs/RTR-PARIS.txt), [`RTR-LYON.txt`](configs/RTR-LYON.txt)) —
   testez `ping 203.0.113.1` depuis chaque routeur avant de continuer.
3. **FW-PARIS** puis **FW-LYON** ([`FW-PARIS.txt`](configs/FW-PARIS.txt), [`FW-LYON.txt`](configs/FW-LYON.txt)).
4. **CORE-PARIS-SW1**, **CORE-PARIS-SW2**, **CORE-LYON-SW** (cœurs en premier, avant l'accès,
   car ce sont eux qui portent les VLAN et le routage inter-VLAN).
5. **ACC-PARIS-SW**, puis **ACC-LYON-SW**.
6. Configurez les **serveurs** (cf. [04](04-configuration-serveurs-et-postes.md)), puis les **PC en IP
   statique**, puis laissez le PC/laptop/téléphone en **DHCP** démarrer normalement.
7. Configurez la **borne Wi-Fi** et connectez le laptop en Wi-Fi.

## 4. Copier-coller une configuration dans Packet Tracer

1. Cliquer sur l'équipement → onglet **CLI**.
2. Appuyer sur Entrée pour obtenir l'invite, taper `enable` si l'appareil vient d'être allumé.
3. Coller le contenu du fichier `.txt` correspondant (clic droit → Coller, ou `Ctrl+Maj+V` selon l'OS).
4. Vérifier qu'aucune ligne n'affiche `% Invalid input` — si c'est le cas, il manque probablement un
   `exit` avant la ligne suivante (mode de configuration mal refermé).

## 5. Sauvegarder

Une fois l'ensemble opérationnel, enregistrez le projet (`Fichier → Enregistrer sous`) au format
`.pkt`, par exemple `KHSBank-MOMTECH-Maquette.pkt`, et passez au [plan de test](05-plan-de-test.md).
