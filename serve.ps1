# =====================================================================
# Tiny static file server for local testing of the Wessal Contacts app.
#
#   powershell -ExecutionPolicy Bypass -File serve.ps1 -Port 8080 -Root .\public
#
# Uses .NET HttpListener so it works without Python, Node or PHP.
# =====================================================================
param(
  [int]$Port = 8080,
  [string]$Root = ".\public"
)

$ErrorActionPreference = 'Stop'
$rootPath = (Resolve-Path $Root).Path
$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Host "Serving $rootPath at $prefix  (Ctrl+C to stop)"

$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".svg"  = "image/svg+xml"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
  ".ico"  = "image/x-icon"
  ".csv"  = "text/csv; charset=utf-8"
  ".woff2"= "font/woff2"
  ".map"  = "application/json"
}

while ($listener.IsListening) {
  try {
    $context = $listener.GetContext()
    $req = $context.Request
    $res = $context.Response

    $rel = $req.Url.AbsolutePath.TrimStart('/')
    if ([string]::IsNullOrEmpty($rel)) { $rel = "index.html" }
    $full = Join-Path $rootPath ($rel -replace '/', '\')

    # Stay inside the served root.
    if (-not $full.StartsWith($rootPath, [System.StringComparison]::OrdinalIgnoreCase)) {
      $res.StatusCode = 403
      $res.Close()
      continue
    }

    if (Test-Path -Path $full -PathType Container) {
      $full = Join-Path $full "index.html"
    }

    if (Test-Path -Path $full -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($full).ToLower()
      $type = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { "application/octet-stream" }
      $bytes = [System.IO.File]::ReadAllBytes($full)
      $res.ContentType = $type
      $res.ContentLength64 = $bytes.Length
      # Never cache during local development, so edits show up immediately.
      $res.Headers.Add("Cache-Control", "no-store, no-cache, must-revalidate")
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $res.StatusCode = 404
      $body = [System.Text.Encoding]::UTF8.GetBytes("Not found: $rel")
      $res.ContentType = "text/plain; charset=utf-8"
      $res.ContentLength64 = $body.Length
      $res.OutputStream.Write($body, 0, $body.Length)
    }
    $res.Close()
  } catch {
    Write-Host "Error: $_"
  }
}
