import json
import re
from pathlib import Path

html = Path("produits.html").read_text(encoding="utf-8")
cards = re.findall(r'<article class="card product-card"([^>]*)>(.*?)</article>', html, re.S)
products = []
for attrs, body in cards:
    cat = re.search(r'data-category="([^"]*)"', attrs)
    grp = re.search(r'data-group="([^"]*)"', attrs)
    img = re.search(r'src="([^"]+)"', body)
    name = re.search(r"<h3>(.*?)</h3>", body)
    desc = re.search(r"<p>(.*?)</p>", body)
    price_txt = re.search(r'class="price-real">(.*?)</div>', body)
    pt = price_txt.group(1) if price_txt else ""
    nums = [int(x.replace(" ", "").replace("\u00a0", "")) for x in re.findall(r"[0-9][0-9\s\u00a0]*", pt)]
    if "devis" in pt.lower() or not nums:
        available = False
        price = 0
    else:
        available = True
        price = nums[0] if len(nums) == 1 else round((nums[0] + nums[-1]) / 2, 2)
    products.append(
        {
            "name": name.group(1) if name else "",
            "description": desc.group(1) if desc else "",
            "image": img.group(1) if img else "",
            "category": cat.group(1) if cat else "",
            "product_group": grp.group(1) if grp else "",
            "price": price,
            "available": available,
        }
    )
print("count", len(products))
Path("_products.json").write_text(json.dumps(products, ensure_ascii=False, indent=2), encoding="utf-8")
