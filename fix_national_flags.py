import json
import requests
from time import sleep

headers = {'User-Agent': 'Federico Silvestri/0.1/silvestri.federico.14@gmail.com'}

def get_real_url(filename):
    """
    Resolve the real Wikimedia Commons upload URL for a given filename.
    Special:FilePath redirects to the actual file URL.
    """
    special_url = f"https://commons.wikimedia.org/wiki/Special:FilePath/{filename}"
    try:
        r = requests.get(special_url, headers=headers, allow_redirects=True, timeout=10)
        if r.ok and 'upload.wikimedia.org' in r.url:
            return r.url
    except Exception as e:
        print(f"  ERROR fetching {filename}: {e}")
    return None

def extract_filename_from_thumb(url):
    """
    Extract the real filename from a thumb URL like:
    https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Flag_of_Angola.svg/320px-Flag_of_Angola.svg
    Returns 'Flag_of_Angola.svg'
    """
    parts = url.rstrip('/').split('/')
    # Find the part ending in .svg that is NOT the thumbnail (no 'px-' in it)
    for part in parts:
        if part.endswith('.svg') and 'px-' not in part:
            return part
    return None

def is_fake_url(url):
    return 'thumb/a/a7/' in url or 'thumb/a/a8/' in url

with open('flags_complete.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

total = 0
fixed = 0
failed = []

for continent_name, continent in data['continents'].items():
    for country_name, country in continent.items():
        if 'national' not in country:
            continue
        national = country['national']
        link = national.get('link_flag', '')

        if not is_fake_url(link):
            continue  # already valid

        total += 1
        filename = extract_filename_from_thumb(link)
        if not filename:
            print(f"[SKIP] Could not extract filename from: {link}")
            failed.append(country_name)
            continue

        print(f"[{country_name}] Resolving: {filename}")
        real_url = get_real_url(filename)

        if real_url:
            national['link_flag'] = real_url
            print(f"  -> {real_url}")
            fixed += 1
        else:
            print(f"  -> FAILED (keeping original)")
            failed.append(country_name)

        sleep(0.15)  # be polite to Wikimedia

print(f"\nDone: {fixed}/{total} national flags fixed")
if failed:
    print(f"Failed ({len(failed)}): {', '.join(failed)}")

with open('flags_complete.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Saved to flags_complete.json")
