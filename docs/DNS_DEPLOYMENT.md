# Deployment & DNS Records for joalvergs.tech

## Recommended Subdomain
- **`kinesis.joalvergs.tech`** (Activity recognition IoT suite)

## DNS Records to Configure (at Name.com or your DNS registrar)

| Type | Host | Answer / Value | TTL | Note |
|---|---|---|---|---|
| **CNAME** | `kinesis` | `cname.vercel-dns.com.` | 300 | Directs web & API traffic to Vercel |
| **A** | `kinesis` | `76.76.21.21` | 300 | Alternative direct A-record for Vercel apex/subdomains |

## Vercel Deployment Instructions
```bash
# In the project root
vercel link
vercel --prod
```
Add the custom domain `kinesis.joalvergs.tech` in the Vercel Project Settings -> Domains.
