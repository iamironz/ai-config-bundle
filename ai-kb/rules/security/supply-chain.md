# Supply Chain Security

## SBOM (Software Bill of Materials)
- Generate using CycloneDX or SPDX
- Integrate into CI/CD
- Required by some regulatory frameworks

## Dependency Scanning
- Scan for known CVEs in transitive dependencies
- Watch for typosquatting, dependency confusion
- Tools: Dependabot, Snyk, Anchore

## Build Integrity
- SLSA framework (levels 1-4) for provenance
- Sign build artifacts
- Verify artifact integrity before deployment
