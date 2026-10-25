$html = Get-Content -Raw -Encoding UTF8 "produits.html"
$pattern = '(?s)<article class="card product-card"([^>]*)>(.*?)</article>'
$matches = [regex]::Matches($html, $pattern)
Write-Host "count $($matches.Count)"
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("[")
$i = 0
foreach ($m in $matches) {
  $attrs = $m.Groups[1].Value
  $body = $m.Groups[2].Value
  $cat = if ($attrs -match 'data-category="([^"]*)"') { $Matches[1] } else { "" }
  $grp = if ($attrs -match 'data-group="([^"]*)"') { $Matches[1] } else { "" }
  $img = if ($body -match 'src="([^"]+)"') { $Matches[1] } else { "" }
  $name = if ($body -match '<h3>(.*?)</h3>') { $Matches[1] } else { "" }
  $desc = if ($body -match '<p>(.*?)</p>') { $Matches[1] } else { "" }
  $pt = if ($body -match 'class="price-real">(.*?)</div>') { $Matches[1] } else { "" }
  $numMatches = [regex]::Matches($pt, '[0-9][0-9\s]*')
  $nums = @()
  foreach ($n in $numMatches) { $nums += [int]($n.Value -replace '\s','') }
  if ($pt -match 'devis' -or $nums.Count -eq 0) {
    $available = $false
    $price = 0
  } else {
    $available = $true
    $price = if ($nums.Count -eq 1) { $nums[0] } else { [math]::Round(($nums[0] + $nums[-1]) / 2, 2) }
  }
  $obj = [ordered]@{
    name = $name
    description = $desc
    image = $img
    category = $cat
    product_group = $grp
    price = $price
    available = $available
  }
  $json = ($obj | ConvertTo-Json -Compress)
  if ($i -gt 0) { [void]$sb.AppendLine(",") }
  [void]$sb.Append($json)
  $i++
}
[void]$sb.AppendLine()
[void]$sb.AppendLine("]")
[System.IO.File]::WriteAllText((Join-Path (Get-Location) "_products.json"), $sb.ToString(), [System.Text.UTF8Encoding]::new($false))
Write-Host "written"
