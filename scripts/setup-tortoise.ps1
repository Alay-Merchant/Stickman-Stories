[CmdletBinding()]
param(
  [string]$InstallRoot = (Join-Path $env:LOCALAPPDATA "WhiteboardStudio\tortoise"),
  [string]$Python = "python"
)

$ErrorActionPreference = "Stop"
$venvPath = Join-Path $InstallRoot ".venv"
$venvPython = Join-Path $venvPath "Scripts\python.exe"
$venvPackages = Join-Path $venvPath "Lib\site-packages"
$modelsPath = Join-Path $InstallRoot "models"
$voicesPath = Join-Path $InstallRoot "voices"
$tortoiseCommit = "8a2563ecabe93c4fb626f876dd0c52c966edef2f"

function Invoke-Native {
  param([string]$FilePath, [string[]]$Arguments)
  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) { throw "Command failed ($LASTEXITCODE): $FilePath $($Arguments -join ' ')" }
}

Invoke-Native $Python @("--version")

New-Item -ItemType Directory -Force -Path $InstallRoot, $modelsPath, $voicesPath | Out-Null
if (-not (Test-Path -LiteralPath $venvPython)) {
  Invoke-Native $Python @("-m", "venv", $venvPath)
}

# The Python 3.10 bundled venv may contain an old pip that cannot use the
# Windows certificate store. Bootstrap a current pip from the system Python,
# then keep every download certificate-validated with truststore.
Invoke-Native $Python @("-m", "pip", "--use-feature=truststore", "install", "--upgrade", "--target", $venvPackages, "pip==26.1.2")
Invoke-Native $venvPython @("-m", "pip", "--use-feature=truststore", "install", "--upgrade", "pip", "setuptools==80.9.0", "wheel")
Invoke-Native $venvPython @("-m", "pip", "--use-feature=truststore", "install", "torch==2.3.1+cu121", "torchvision==0.18.1+cu121", "torchaudio==2.3.1+cu121", "--index-url", "https://download.pytorch.org/whl/cu121")
Invoke-Native $venvPython @("-m", "pip", "--use-feature=truststore", "install", "tqdm", "rotary_embedding_torch==0.2.7", "transformers==4.31.0", "tokenizers==0.13.3", "inflect", "progressbar", "einops==0.4.1", "unidecode", "scipy==1.13.1", "librosa==0.9.1", "numba", "llvmlite", "appdirs", "threadpoolctl", "psutil", "sounddevice", "hjson", "huggingface_hub", "python-certifi-win32")
Invoke-Native $venvPython @("-m", "pip", "--use-feature=truststore", "install", "--force-reinstall", "--no-deps", "git+https://github.com/neonbjb/tortoise-tts.git@$tortoiseCommit")
Invoke-Native $venvPython @("-c", "import torch, tortoise; assert torch.cuda.is_available(), 'CUDA GPU was not detected'; print('Tortoise ready on ' + torch.cuda.get_device_name(0))")

Write-Host ""
Write-Host "Tortoise is ready. Add these private values to .env:"
Write-Host "TTS_PROVIDER=tortoise"
Write-Host "TORTOISE_PYTHON=$venvPython"
Write-Host "TORTOISE_MODELS_DIR=$modelsPath"
Write-Host "TORTOISE_VOICE=random"
Write-Host "TORTOISE_DOWNLOAD_TIMEOUT=600"
Write-Host "# Put consented reference clips in $voicesPath\your_voice and set TORTOISE_VOICE=your_voice"
