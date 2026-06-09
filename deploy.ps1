[CmdletBinding()]
param(
    [string]$VpsUser,
    [string]$VpsHost,
    [string]$VpsPath,
    [string]$SshKey,
    [switch]$SetupServer,
    [switch]$SkipServerSetup,
    [switch]$ResetConfig,
    [switch]$NoSaveConfig,
    [switch]$Yes
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ConfigFile = Join-Path $ProjectRoot ".deploy-config.ps1.json"
$DefaultVpsUser = "opc"
$DefaultVpsPath = "/var/www/booker"

function Write-Info {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Yellow
}

function Fail {
    param([string]$Message)
    throw $Message
}

function Read-WithDefault {
    param(
        [string]$Prompt,
        [string]$DefaultValue
    )

    if ([string]::IsNullOrWhiteSpace($DefaultValue)) {
        $value = Read-Host $Prompt
    } else {
        $value = Read-Host "$Prompt [$DefaultValue]"
    }

    if ([string]::IsNullOrWhiteSpace($value)) {
        return $DefaultValue
    }

    return $value.Trim()
}

function Confirm-YesNo {
    param(
        [string]$Prompt,
        [bool]$DefaultYes = $true
    )

    if ($Yes) {
        return $true
    }

    $suffix = if ($DefaultYes) { "Y/n" } else { "y/N" }
    $answer = Read-Host "$Prompt ($suffix)"

    if ([string]::IsNullOrWhiteSpace($answer)) {
        return $DefaultYes
    }

    return $answer -match "^[Yy]"
}

function Assert-Command {
    param([string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        Fail "Required command '$Name' was not found. Install or enable it first."
    }
}

function Write-Utf8NoBomFile {
    param(
        [string]$Path,
        [string]$Content
    )

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

function Expand-EnvVariables {
    param([string]$Value)

    $expanded = [Environment]::ExpandEnvironmentVariables($Value)

    $expanded = [regex]::Replace($expanded, '\$\{env:([A-Za-z_][A-Za-z0-9_]*)\}', {
        param($Match)
        $envValue = [Environment]::GetEnvironmentVariable($Match.Groups[1].Value)
        if ($null -eq $envValue) {
            return $Match.Value
        }
        return $envValue
    })

    $expanded = [regex]::Replace($expanded, '\$env:([A-Za-z_][A-Za-z0-9_]*)', {
        param($Match)
        $envValue = [Environment]::GetEnvironmentVariable($Match.Groups[1].Value)
        if ($null -eq $envValue) {
            return $Match.Value
        }
        return $envValue
    })

    return $expanded
}

function Resolve-SshKeyPath {
    param([string]$Path)

    if ([string]::IsNullOrWhiteSpace($Path)) {
        return ""
    }

    $resolved = $Path.Trim()

    if (
        ($resolved.StartsWith('"') -and $resolved.EndsWith('"')) -or
        ($resolved.StartsWith("'") -and $resolved.EndsWith("'"))
    ) {
        $resolved = $resolved.Substring(1, $resolved.Length - 2)
    }

    $resolved = Expand-EnvVariables $resolved

    if ($resolved -eq "~") {
        $resolved = $HOME
    } elseif ($resolved.StartsWith("~/") -or $resolved.StartsWith("~\")) {
        $resolved = Join-Path $HOME $resolved.Substring(2)
    }

    try {
        $resolved = [System.IO.Path]::GetFullPath($resolved)
    } catch {
        Fail "SSH private key path is invalid: $Path"
    }

    if (-not (Test-Path -LiteralPath $resolved -PathType Leaf)) {
        Fail "SSH private key file was not found: $resolved"
    }

    return $resolved
}

function Quote-Bash {
    param([string]$Value)
    return "'" + $Value.Replace("'", "'""'""'") + "'"
}

function Assert-SafeRemotePath {
    param([string]$Path)

    $blocked = @("/", "/root", "/home", "/var", "/var/www", "/tmp", "/usr", "/etc")

    if ([string]::IsNullOrWhiteSpace($Path)) {
        Fail "Remote deploy path cannot be empty."
    }

    if (-not $Path.StartsWith("/")) {
        Fail "Remote deploy path must be absolute, for example /var/www/booker."
    }

    if ($blocked -contains $Path.TrimEnd("/")) {
        Fail "Remote deploy path '$Path' is too broad. Use a dedicated directory such as /var/www/booker."
    }
}

function Invoke-RemoteScript {
    param(
        [string[]]$SshArgs,
        [string]$RemoteTarget,
        [string]$Script
    )

    $Script | & ssh @SshArgs $RemoteTarget "bash -s"
    if ($LASTEXITCODE -ne 0) {
        Fail "Remote command failed."
    }
}

function Load-Config {
    if (-not (Test-Path $ConfigFile)) {
        return $null
    }

    try {
        return Get-Content $ConfigFile -Raw | ConvertFrom-Json
    } catch {
        Write-Warn "Saved config is invalid; ignoring it."
        return $null
    }
}

function Save-Config {
    param(
        [string]$User,
        [string]$HostName,
        [string]$Path,
        [string]$KeyPath,
        [bool]$Setup
    )

    if ($NoSaveConfig) {
        return
    }

    $config = [ordered]@{
        VpsUser = $User
        VpsHost = $HostName
        VpsPath = $Path
        SshKey = $KeyPath
        SetupServer = $Setup
    }

    $config | ConvertTo-Json | Set-Content -Path $ConfigFile -Encoding UTF8
    Write-Ok "Saved config to $ConfigFile"
}

Write-Host "=================================="
Write-Host "  Booker PowerShell Deploy"
Write-Host "=================================="
Write-Host ""

Set-Location $ProjectRoot

if (-not (Test-Path (Join-Path $ProjectRoot "index.html"))) {
    Fail "index.html was not found. Run this script from the Booker project root."
}

Assert-Command "ssh"
Assert-Command "scp"
Assert-Command "tar"

if ($ResetConfig -and (Test-Path $ConfigFile)) {
    Remove-Item -LiteralPath $ConfigFile -Force
    Write-Warn "Removed saved config: $ConfigFile"
}

$saved = Load-Config

if (-not $VpsUser) {
    $VpsUser = if ($saved -and $saved.VpsUser) { $saved.VpsUser } else { $DefaultVpsUser }
    Write-Warn "Oracle Linux images usually use user 'opc'. Ubuntu images usually use user 'ubuntu'. Avoid root unless you configured it."
    $VpsUser = Read-WithDefault "VPS user" $VpsUser
}

if (-not $VpsHost) {
    $savedHost = if ($saved -and $saved.VpsHost) { $saved.VpsHost } else { "" }
    $VpsHost = Read-WithDefault "VPS public IP or host" $savedHost
}

if ([string]::IsNullOrWhiteSpace($VpsHost)) {
    Fail "VPS host cannot be empty."
}

if (-not $SshKey) {
    $savedKey = if ($saved -and $saved.SshKey) { $saved.SshKey } else { "" }
    $SshKey = Read-WithDefault "SSH private key path" $savedKey
}

if (-not [string]::IsNullOrWhiteSpace($SshKey)) {
    $SshKey = Resolve-SshKeyPath $SshKey
}

if (-not $VpsPath) {
    $VpsPath = if ($saved -and $saved.VpsPath) { $saved.VpsPath } else { $DefaultVpsPath }
    $VpsPath = Read-WithDefault "Remote deploy path" $VpsPath
}

Assert-SafeRemotePath $VpsPath

if ($SetupServer -and $SkipServerSetup) {
    Fail "Use only one of -SetupServer or -SkipServerSetup."
}

$shouldSetupServer = $false
if ($SetupServer) {
    $shouldSetupServer = $true
} elseif ($SkipServerSetup) {
    $shouldSetupServer = $false
} elseif ($saved -and $null -ne $saved.SetupServer) {
    $shouldSetupServer = [bool]$saved.SetupServer
    if (-not $Yes) {
        $shouldSetupServer = Confirm-YesNo "Initialize/update Nginx on VPS" $shouldSetupServer
    }
} else {
    $shouldSetupServer = Confirm-YesNo "Initialize/update Nginx on VPS" $true
}

$remoteTarget = "$VpsUser@$VpsHost"
$sshArgs = @()
if (-not [string]::IsNullOrWhiteSpace($SshKey)) {
    $sshArgs += @("-i", $SshKey, "-o", "IdentitiesOnly=yes")
}

Write-Host ""
Write-Warn "Deploy target:"
Write-Host "  Remote: $remoteTarget"
Write-Host "  Path:   $VpsPath"
Write-Host "  SSH key: $(if ($SshKey) { $SshKey } else { '(default ssh agent/config)' })"
Write-Host "  Setup:  $shouldSetupServer"
Write-Host ""

if (-not (Confirm-YesNo "Continue deployment" $false)) {
    Write-Warn "Deployment cancelled."
    exit 1
}

Write-Info "Testing SSH connection..."
& ssh @sshArgs -o "ConnectTimeout=10" $remoteTarget "echo SSH_OK"
if ($LASTEXITCODE -ne 0) {
    Fail "SSH connection failed. Check VPS username, public IP, and private key path."
}
Write-Ok "SSH connection OK."

Save-Config -User $VpsUser -HostName $VpsHost -Path $VpsPath -KeyPath $SshKey -Setup $shouldSetupServer

$remotePathQ = Quote-Bash $VpsPath
$remoteArchive = "/tmp/booker-deploy-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds()).tar.gz"
$remoteArchiveQ = Quote-Bash $remoteArchive
$archive = Join-Path $env:TEMP "booker-deploy-$([guid]::NewGuid().ToString('N')).tar.gz"

try {
    if ($shouldSetupServer) {
        Write-Info "[1/4] Preparing Nginx on VPS..."
        $setupScript = @"
set -e
DEPLOY_PATH=$remotePathQ

if [ "`$(id -u)" -eq 0 ]; then
  SUDO=""
else
  if ! command -v sudo >/dev/null 2>&1; then
    echo "This user is not root and sudo is not installed."
    exit 1
  fi
  SUDO="sudo"
fi

if ! command -v nginx >/dev/null 2>&1; then
  if command -v apt-get >/dev/null 2>&1; then
    `$SUDO apt-get update
    `$SUDO apt-get install -y nginx
  elif command -v dnf >/dev/null 2>&1; then
    `$SUDO dnf install -y nginx
  elif command -v yum >/dev/null 2>&1; then
    `$SUDO yum install -y nginx
  else
    echo "Unsupported Linux package manager. Install nginx manually, then rerun with -SkipServerSetup."
    exit 1
  fi
fi

`$SUDO mkdir -p "`$DEPLOY_PATH"

if id www-data >/dev/null 2>&1; then
  WEB_USER="www-data"
elif id nginx >/dev/null 2>&1; then
  WEB_USER="nginx"
else
  WEB_USER="`$(id -un)"
fi

if [ -d /etc/nginx/sites-available ]; then
  `$SUDO tee /etc/nginx/sites-available/booker >/dev/null <<EOF
server {
    listen 80;
    server_name _;

    root $VpsPath;
    index index.html;

    location / {
        try_files \$uri \$uri/ /404.html;
    }

    error_page 404 /404.html;

    location ~* \.(css|js|png|jpg|jpeg|webp|svg|ico)$ {
        expires 7d;
        add_header Cache-Control "public";
    }
}
EOF
  `$SUDO mkdir -p /etc/nginx/sites-enabled
  `$SUDO ln -sf /etc/nginx/sites-available/booker /etc/nginx/sites-enabled/booker
  `$SUDO rm -f /etc/nginx/sites-enabled/default
else
  `$SUDO tee /etc/nginx/conf.d/booker.conf >/dev/null <<EOF
server {
    listen 80;
    server_name _;

    root $VpsPath;
    index index.html;

    location / {
        try_files \$uri \$uri/ /404.html;
    }

    error_page 404 /404.html;

    location ~* \.(css|js|png|jpg|jpeg|webp|svg|ico)$ {
        expires 7d;
        add_header Cache-Control "public";
    }
}
EOF
fi

`$SUDO chown -R "`$WEB_USER:`$WEB_USER" "`$DEPLOY_PATH" || true
`$SUDO nginx -t
`$SUDO systemctl enable nginx >/dev/null 2>&1 || true
`$SUDO systemctl reload nginx >/dev/null 2>&1 || `$SUDO service nginx reload
"@
        Invoke-RemoteScript -SshArgs $sshArgs -RemoteTarget $remoteTarget -Script $setupScript
        Write-Ok "Nginx is ready."
    } else {
        Write-Info "[1/4] Skipping Nginx setup."
    }

    Write-Info "[2/4] Creating local archive..."
    & tar `
        --exclude=".git" `
        --exclude=".deploy-config" `
        --exclude=".deploy-config.ps1.json" `
        --exclude="node_modules" `
        --exclude="*.sh" `
        --exclude="*.ps1" `
        --exclude="*.log" `
        --exclude="*.tmp" `
        -czf $archive -C $ProjectRoot .

    if ($LASTEXITCODE -ne 0) {
        Fail "Failed to create deployment archive."
    }
    Write-Ok "Archive created: $archive"

    Write-Info "[3/4] Uploading archive..."
    & scp @sshArgs $archive "${remoteTarget}:$remoteArchive"
    if ($LASTEXITCODE -ne 0) {
        Fail "Upload failed."
    }
    Write-Ok "Archive uploaded."

    Write-Info "[4/4] Publishing files on VPS..."

    $remotePublishScript = "/tmp/booker-publish-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds()).sh"
    $localPublishScript = Join-Path $env:TEMP "booker-publish-$([guid]::NewGuid().ToString('N')).sh"

    $publishScript = @'
set -e

DEPLOY_PATH="$1"
ARCHIVE_PATH="$2"

case "$DEPLOY_PATH" in
  ""|"/"|"/root"|"/home"|"/var"|"/var/www"|"/tmp"|"/usr"|"/etc")
    echo "Unsafe deploy path: $DEPLOY_PATH"
    exit 1
    ;;
esac

if [ "$(id -u)" -eq 0 ]; then
  SUDO=""
else
  if ! command -v sudo >/dev/null 2>&1; then
    echo "This user is not root and sudo is not installed."
    exit 1
  fi
  SUDO="sudo"
fi

if id www-data >/dev/null 2>&1; then
  WEB_USER="www-data"
elif id nginx >/dev/null 2>&1; then
  WEB_USER="nginx"
else
  WEB_USER="$(id -un)"
fi

$SUDO mkdir -p "$DEPLOY_PATH"
$SUDO find "$DEPLOY_PATH" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
$SUDO tar -xzf "$ARCHIVE_PATH" -C "$DEPLOY_PATH"
$SUDO chown -R "$WEB_USER:$WEB_USER" "$DEPLOY_PATH" || true
rm -f "$ARCHIVE_PATH"

if command -v nginx >/dev/null 2>&1; then
  $SUDO nginx -t
  $SUDO systemctl reload nginx >/dev/null 2>&1 || $SUDO service nginx reload || true
fi
'@

    try {
        Write-Utf8NoBomFile -Path $localPublishScript -Content $publishScript

        & scp @sshArgs $localPublishScript "${remoteTarget}:$remotePublishScript"
        if ($LASTEXITCODE -ne 0) {
            Fail "Failed to upload remote publish script."
        }

        $remoteRunCommand = "chmod +x $(Quote-Bash $remotePublishScript) && bash $(Quote-Bash $remotePublishScript) $(Quote-Bash $VpsPath) $(Quote-Bash $remoteArchive); status=`$?; rm -f $(Quote-Bash $remotePublishScript); exit `$status"
        & ssh @sshArgs $remoteTarget $remoteRunCommand
        if ($LASTEXITCODE -ne 0) {
            Fail "Remote publish script failed."
        }
    } finally {
        if (Test-Path $localPublishScript) {
            Remove-Item -LiteralPath $localPublishScript -Force
        }
    }

    Write-Ok "Deployment completed."

    Write-Host ""
    Write-Ok "Visit: http://$VpsHost/"
    Write-Warn "If deployment succeeds but the page does not open, check Oracle Cloud Security List / VCN / NSG inbound rule for TCP 80."
} finally {
    if (Test-Path $archive) {
        Remove-Item -LiteralPath $archive -Force
    }
}
