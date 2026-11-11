# Abstract

KHS Bank is a mid-size French bank with a head office in Paris and a secondary site in Lyon. Its
information system has grown through successive, uncoordinated choices: Windows 8 workstations, an
unsupported Exchange 2013 mail server, a single core switch and a single VPN link between the two sites.
This leaves the bank exposed to service outages and to the compliance risks that weigh on the financial
sector under ACPR, PSD2, PCI-DSS and GDPR requirements.

MOM-TECH, a consultancy specialising in cybersecurity, cloud and artificial intelligence, was engaged to
audit the existing infrastructure, design a resilient target architecture and lead its deployment without
interrupting banking services, following the ITIL v4 framework. The audit identified fourteen
high-severity findings, mainly the lack of redundancy, the absence of a security operations centre and
the poor protection of sensitive banking documents.

The proposed architecture removes every single point of failure in the network and virtualisation
layers, introduces multi-factor authentication on a unified Microsoft 365 identity platform and relies on
Microsoft Sentinel as an AI-assisted security operations centre. A secure document management system,
developed by MOM-TECH, lets staff write, validate, sign and archive documents in one tool, with access
rules enforced by the database and an immutable audit trail. Backups follow a 3-2-1-1 policy with an
immutable cloud copy. The network design was validated on a Cisco Packet Tracer model.

Migration proceeds in seven stages of progressive coexistence and ends with a full acceptance campaign,
keeping payment services available throughout the project. The target infrastructure meets the
objectives of the specification within the allocated budget, and a continuous improvement plan keeps it
aligned with emerging threats.
