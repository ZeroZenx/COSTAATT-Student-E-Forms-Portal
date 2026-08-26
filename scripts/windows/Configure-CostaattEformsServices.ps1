[CmdletBinding()]
param(
  [string]$AppRoot = "C:\Student E-Forms\COSTAATT-Student-E-Forms-Portal",
  [string]$NssmPath = "C:\Student E-Forms\nssm\nssm-2.24\win64\nssm.exe",
  [string]$LogRoot = "C:\Student E-Forms\logs"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $AppRoot)) { throw "Application root does not exist: $AppRoot" }
if (-not (Test-Path -LiteralPath $NssmPath)) { throw "NSSM executable does not exist: $NssmPath" }
New-Item -ItemType Directory -Path $LogRoot -Force | Out-Null

function Invoke-Nssm {
  param([string]$Service, [string[]]$Arguments)
  & $NssmPath set $Service @Arguments
  if ($LASTEXITCODE -ne 0) { throw "NSSM configuration failed for $Service ($($Arguments -join ' '))." }
}

$appService = "costaatt-eforms"
$proxyService = "costaatt-eforms-https-proxy"
$nodeNpm = "C:\Program Files\nodejs\npm.cmd"

Invoke-Nssm $appService @("Application", $nodeNpm)
Invoke-Nssm $appService @("AppDirectory", $AppRoot)
Invoke-Nssm $appService @("AppParameters", "run start -- -H 127.0.0.1 -p 5001")
Invoke-Nssm $appService @("AppStdout", (Join-Path $LogRoot "costaatt-eforms.out.log"))
Invoke-Nssm $appService @("AppStderr", (Join-Path $LogRoot "costaatt-eforms.err.log"))
Invoke-Nssm $appService @("AppRotateFiles", "1")
Invoke-Nssm $appService @("AppRotateOnline", "1")
Invoke-Nssm $appService @("AppRotateBytes", "10485760")
Invoke-Nssm $appService @("AppExit", "Default", "Restart")
Invoke-Nssm $appService @("AppRestartDelay", "5000")
Invoke-Nssm $appService @("AppEnvironmentExtra", "NODE_ENV=production", "PORTAL_BASE_URL=https://eforms.costaatt.edu.tt", "SAML_ENABLED=true", "SAML_PUBLIC_BASE_URL=https://eforms.costaatt.edu.tt", "SAML_SP_ENTITY_ID=https://eforms.costaatt.edu.tt/api/saml/metadata", "SAML_ACS_URL=https://eforms.costaatt.edu.tt/api/saml/acs", "SAML_LOGOUT_URL=https://eforms.costaatt.edu.tt/api/saml/logout", "SAML_IDP_METADATA_URL=https://sso.quicklaunch.io/admin/open/api/metadata?tenantDomain=costaatt.edu.tt", "SAML_NAMEID_FORMAT=urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress", "SAML_REQUIRE_SIGNED_ASSERTIONS=true", "SAML_SIGN_AUTHN_REQUESTS=false", "SAML_ACCEPTED_CLOCK_SKEW_MS=0", "SAML_MAX_ASSERTION_AGE_MS=300000", "SAML_REQUEST_TTL_MS=300000", "SAML_TRUSTED_APPLICATION_ROLES=false", "ALLOW_MOCK_SSO=false")

Invoke-Nssm $proxyService @("Application", "C:\Program Files\nodejs\node.exe")
Invoke-Nssm $proxyService @("AppDirectory", $AppRoot)
Invoke-Nssm $proxyService @("AppParameters", "scripts\\https-proxy.mjs")
Invoke-Nssm $proxyService @("AppStdout", (Join-Path $LogRoot "https-proxy.out.log"))
Invoke-Nssm $proxyService @("AppStderr", (Join-Path $LogRoot "https-proxy.err.log"))
Invoke-Nssm $proxyService @("AppRotateFiles", "1")
Invoke-Nssm $proxyService @("AppRotateOnline", "1")
Invoke-Nssm $proxyService @("AppRotateBytes", "10485760")
Invoke-Nssm $proxyService @("AppExit", "Default", "Restart")
Invoke-Nssm $proxyService @("AppRestartDelay", "5000")
Invoke-Nssm $proxyService @("AppEnvironmentExtra", "HTTPS_PROXY_HOST=0.0.0.0", "HTTPS_PROXY_PORT=443", "HTTPS_PROXY_HTTP_PORT=80", "HTTPS_PROXY_TARGET_HOST=127.0.0.1", "HTTPS_PROXY_TARGET_PORT=5001", "SSL_CERT_PATH=C:\Student E-Forms\SSL Private Key\eforms.costaatt.edu.tt\831f8f7a1833747d.pem", "SSL_KEY_PATH=C:\Student E-Forms\SSL Private Key\eforms.costaatt.edu.tt.key", "SSL_CA_PATH=C:\Student E-Forms\SSL Private Key\eforms.costaatt.edu.tt\gd_bundle_dv-r1-g2.crt.pem")

Write-Output "Configured $appService for Next.js production on 127.0.0.1:5001."
Write-Output "Configured $proxyService for HTTPS 443 and HTTP-to-HTTPS redirect on port 80."
Write-Output "Existing service accounts were not changed; review them separately for least-privilege compliance."
