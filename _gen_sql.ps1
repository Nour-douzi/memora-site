$products = Get-Content -Raw -Encoding UTF8 "_products.json" | ConvertFrom-Json
function Esc([string]$s) {
  if ($null -eq $s) { return "" }
  return $s.Replace("'", "''")
}
$lines = @()
foreach ($p in $products) {
  $avail = if ($p.available) { "true" } else { "false" }
  $cat = if ([string]::IsNullOrEmpty($p.category)) { "NULL" } else { "'$(Esc $p.category)'" }
  $price = ([decimal]$p.price).ToString("0.00", [cultureinfo]::InvariantCulture)
  $lines += "  ('$(Esc $p.name)', '$(Esc $p.description)', $price, '$(Esc $p.image)', $cat, '$(Esc $p.product_group)', $avail)"
}
$body = $lines -join ",`r`n"
[System.IO.File]::WriteAllText((Join-Path (Get-Location) "_inserts.sql"), $body, [System.Text.UTF8Encoding]::new($false))
Write-Host "rows $($lines.Count)"
