from pydoc import classname
from time import sleep
from xml.etree.ElementTree import indent

from PIL import Image
from io import BytesIO
import requests
from PIL.ImageFile import ImageFile
from bs4 import BeautifulSoup
headers = {'User-Agent': 'Federico Silvestri/0.1/silvestri.federico.14@gmail.com'}
from pathlib import Path
import json


def pixelate(image_in: ImageFile, pixel_size: int):
        image_in = image_in.resize(
            (image_in.size[0] // pixel_size, image_in.size[1] // pixel_size),
            Image.Resampling.NEAREST
        )
        image_in = image_in.resize(
            (image_in.size[0] * pixel_size, image_in.size[1] * pixel_size),
            Image.Resampling.NEAREST
        )
        return image_in

def generate(continent: str, country_name: str, file_name: str, image: Image):
    #generates widths 32 - 64 - 128
    Path(f"./out/{continent}/{country_name}").mkdir(parents=True, exist_ok=True)

    heights = [64]
    images = [image.resize((height * image.size[0] // image.size[1], height), Image.Resampling.NEAREST) for height in  heights]

    for (n, image) in enumerate(images):
        image.save(f"./out/{continent}/{country_name}/{file_name}.png")


def get_image(url: str, continent: str, country_name: str, div: str):
    try:
        result = requests.get(url, headers=headers)
        img = Image.open(BytesIO(result.content))
        # result = pixelate(img, 10)
        generate(continent, country_name, div, img)
        print( f"GENERATED {country_name}-{div}")
    except Exception as e:
        print(e)
        pass
json_file = dict()
def collect_info(continent_name: str, country_name: str, region_name: str, link_flag:str, description: str | None):

    if json_file.get("continents") is None:
        json_file['continents'] = dict()
    if json_file['continents'].get(continent_name) is None:
        json_file['continents'][continent_name] = dict()
    if json_file['continents'][continent_name].get(country_name) is None:
        json_file['continents'][continent_name][country_name] = dict(subdivisions=[])

    json_file['continents'][continent_name][country_name]["subdivisions"].append(
        dict(name=region_name, link_flag=link_flag, description=description))





pages = [
    # {
    #     "url": "https://en.wikipedia.org/wiki/List_of_country_subdivision_flags_in_Europe",
    #     "continent": 'europe'
    # },
    # {
    #     "url": "https://en.wikipedia.org/wiki/List_of_country_subdivision_flags_in_Asia",
    #     "continent": 'asia'
    # },
    # {
    #     "url": "https://en.wikipedia.org/wiki/List_of_country_subdivision_flags_in_North_America",
    #     "continent": "north america"
    # },
    {
        "url": "https://en.wikipedia.org/wiki/List_of_country_subdivision_flags_in_Oceania",
        "continent": "oceania"
    },
    # {
    #     "url": "https://en.wikipedia.org/wiki/List_of_country_subdivision_flags_in_South_America",
    #     "continent": "south america"
    # },
    # {
    #     "url": "https://en.wikipedia.org/wiki/Draft:List_of_country_subdivision_flags_in_Africa",
    #     "continent": "africa"
    # }
]

def get_continent(URL_: str, continent: str):
    res = requests.get(URL_, headers=headers).text
    soup = BeautifulSoup(res, 'lxml')
    for (idx, table) in enumerate(soup.find_all('table', {"class": "wikitable"})):
        country = table.findPreviousSibling('div','mw-heading3')
        name = country.find('h3').text
        print('COUNTRY: ', country.find('h3').text)
        for (index, row) in enumerate(table.find_all('tr')):
            if index != 0:
                content = row.find_all('td')
                flag = content[0]
                if name in ['Czechia', 'Slovakia']:
                    sub_name = content[1].text
                else:
                    try:
                        sub_name = content[2].text.replace('Flag of ', '')
                    except:
                        continue

                desc = ""
                try:
                    desc = content[4].text.strip()
                except:
                    pass
                try: desc = content[3].text.strip()
                except:
                    pass
                try:
                    src = flag.find('a')['href']
                except:
                    continue
                if '.gif' not in src:
                    page_ = requests.get(f"https://commons.wikimedia.org{src}", headers=headers)
                    page_content = BeautifulSoup(page_.text, 'lxml')
                    png = page_content.select_one(".mw-thumbnail-link")
                    svg = {"href": ""}
                    if png is not None:
                        print(png['href'])
                        svg =  page_content.select_one(".fullImageLink").find('a')
                        get_image(png['href'], continent, name, sub_name)
                    else:
                        try:
                            png = page_content.select_one(".fullImageLink").find('a')
                            svg = png
                            print('fullimage link', png['href'])
                            get_image(png['href'], continent, name, sub_name)
                        except:
                            pass
                    collect_info(continent, name, sub_name, svg['href'], desc)


# for page in pages:
#     get_continent(page['url'], page['continent'])
#
# with open('africa.json', 'a+') as fp:
#     json.dump(json_file, fp, indent=4)

def write_text(data: str, path: str):
    with open(path, 'w') as file:
        file.write(data)

with open('africa.json', 'r') as file:
    parsed = json.load(file)

    for continent_name, continent in parsed['continents'].items():
        print('_'*10)
        print('_' * 10)
        print (continent_name)
        for country_name, country in continent.items():
            print('_' * 30)
            print(country_name)
            Path(f"./out/{continent_name}/{country_name}").mkdir(parents=True, exist_ok=True)
            count = 0
            for sub in country['subdivisions']:
                count+=1
                svg = requests.get(sub['link_flag'], headers=headers).text
                name = sub['name']
                if name == "":
                    name = f"country_name-{count}"
                write_text(svg, f"./out/{continent_name}/{country_name}/{name}.svg")
        #     print (country['subdivisions'])
        #     # for sub in country['subdivisions']:
        #     #     print (sub)