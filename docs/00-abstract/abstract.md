# Abstract

KHS Bank, a mid-size French banking group with a head office in Paris and a secondary site in Lyon,  
operates a system of information built on fragmented, ageing technology across network, systems and security.  
Windows 8 workstations, an unsupported Exchange 2013 mail server, a single core switch and a lone  
VPN link leave the bank exposed to service outages and to the compliance risks that weigh on the  
financial sector under ACPR, DSP2, PCI-DSS and GDPR requirements.  
MOM-TECH, a consultancy specialised in artificial intelligence, cloud and cybersecurity, was engaged  
to audit the existing infrastructure, design a resilient target architecture and lead its deployment  
without any interruption of banking services, in strict accordance with the ITIL v4 framework.  
The audit exposed fourteen high-severity findings, concentrated on the absence of redundancy, of a  
security operations centre, and of adequate protection for sensitive banking documents.  
The proposed architecture removes every single point of failure identified in the network and  
virtualisation layers, introduces multi-factor authentication and a unified Microsoft 365 identity  
platform, and deploys Microsoft Sentinel as an AI-driven security operations centre.  
A dedicated secure document management solution protects sensitive files through classification,  
encryption and an immutable audit trail, addressing both regulatory and confidentiality requirements.  
Backups now follow a 3-2-1-1 policy with an immutable cloud copy, closing the gap left by the  
previous single storage array and untested tape backups kept on the same site as production.  
Migration proceeds through progressive coexistence across seven stages, validated by a full test and  
acceptance campaign, keeping the bank's payment services continuously available throughout the project.  
The resulting infrastructure meets every objective of the initial specification within the allocated budget,  
while a continuous improvement plan keeps KHS Bank ahead of emerging cybersecurity and AI-driven threats.
