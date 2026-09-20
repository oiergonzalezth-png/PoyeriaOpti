param(
    [Parameter(Mandatory = $true)][string]$Owner,
    [Parameter(Mandatory = $true)][string]$Repo,
    [Parameter(Mandatory = $true)][string]$Tag,
    [Parameter(Mandatory = $true)][string]$Token
)

$ErrorActionPreference = "Stop"

$headers = @{
    Authorization = "token $Token"
    "User-Agent"  = "PoyeriaOpti-publish-script"
    Accept        = "application/vnd.github+json"
}

$releasesUrl = "https://api.github.com/repos/$Owner/$Repo/releases"

try {
    $releases = Invoke-RestMethod -Uri $releasesUrl -Headers $headers -Method Get
} catch {
    Write-Host "No se ha podido consultar las releases existentes en GitHub (se continua igualmente): $($_.Exception.Message)"
    exit 0
}

$plainVersion = $Tag.TrimStart('v')
$matches = $releases | Where-Object { $_.tag_name -eq $Tag -or $_.name -eq $Tag -or $_.name -eq $plainVersion }

if (-not $matches) {
    Write-Host "No hay releases previas para $Tag. Nada que limpiar."
    exit 0
}

$publishedMatches = $matches | Where-Object { $_.draft -ne $true }
if ($publishedMatches) {
    Write-Host ""
    Write-Host "*** Ya existe una release PUBLICADA (no borrador) para $Tag en GitHub. ***"
    Write-Host "Sube el numero de version en package.json antes de publicar de nuevo,"
    Write-Host "o borra esa release manualmente en GitHub si de verdad quieres reemplazarla."
    exit 1
}

$draftMatches = $matches | Where-Object { $_.draft -eq $true }
foreach ($release in $draftMatches) {
    Write-Host "Eliminando borrador duplicado existente: id=$($release.id), tag=$($release.tag_name), nombre=$($release.name)"
    $deleteUrl = "https://api.github.com/repos/$Owner/$Repo/releases/$($release.id)"
    Invoke-RestMethod -Uri $deleteUrl -Headers $headers -Method Delete | Out-Null
}

Write-Host "Limpieza completada ($($draftMatches.Count) borrador(es) eliminado(s))."
exit 0
