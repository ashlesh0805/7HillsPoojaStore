import os
import json
import subprocess
import re
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PRODUCTS_JSON_PATH = r"c:\Users\G ASHLESH\OneDrive\Desktop\7HillsPoojaStore\products.json"
DATA_JS_PATH = r"c:\Users\G ASHLESH\OneDrive\Desktop\7HillsPoojaStore\data.js"
STOCK_IMAGES_DIR = r"c:\Users\G ASHLESH\OneDrive\Desktop\7HILLS WEBSITE FOR STOCK ITEMS"

# 1. Load current verified Samsung products (133 items)
with open(PRODUCTS_JSON_PATH, 'r', encoding='utf-8') as f:
    samsung_products = json.load(f)

print(f"Loaded {len(samsung_products)} verified Samsung products.")

# 2. Load e7d2fde products (original 213 products)
raw_e7d2 = subprocess.check_output(['git', 'show', 'e7d2fde:products.json']).decode('utf-8')
e7d2_products = json.loads(raw_e7d2)
print(f"Loaded {len(e7d2_products)} original products from e7d2fde.")

# Comprehensive English to Telugu dictionary for authentic pooja store terms
TELUGU_DICT = {
    # Deity Names
    "Ganesha": "వినాయకుడు",
    "Ganesh": "గణపతి",
    "Lakshmi": "మహాలక్ష్మి",
    "Laxmi": "లక్ష్మి",
    "Venkateshwara": "వేంకటేశ్వర స్వామి",
    "Balaji": "శ్రీ బాలాజీ",
    "Shiva": "పరమశివుడు",
    "Siva": "శివుడు",
    "Hanuman": "ఆంజనేయ స్వామి",
    "Anjaneya": "హనుమంతుడు",
    "Radha Krishna": "రాధా కృష్ణులు",
    "Krishna": "శ్రీకృష్ణుడు",
    "Rama": "శ్రీరాముడు",
    "Durga": "దుర్గాదేవి",
    "Saraswati": "సరస్వతీ దేవి",
    "Murugan": "సుబ్రహ్మణ్య స్వామి",
    "Kartikeya": "కార్తికేయ",
    "Nandi": "పవిత్ర నంది",
    "Nataraja": "నటరాజ స్వామి",
    "Sai Baba": "షిర్డీ సాయిబాబా",
    "Buddha": "గౌతమ బుద్ధుడు",
    "Laughing Buddha": "లాఫింగ్ బుద్ధ",
    "Kubera": "కుబేరుడు",
    "Kuber": "కుబేర",
    "Surya": "సూర్య భగవానుడు",
    "Navagraha": "నవగ్రహాలు",

    # Materials
    "Brass": "ఇత్తడి",
    "Copper": "రాగి",
    "Silver": "వెండి",
    "Gold": "బంగారు",
    "Golden": "స్వర్ణ",
    "Clay": "మట్టి",
    "Terracotta": "టెర్రకోట",
    "Wooden": "చెక్క",
    "Wood": "కలప",
    "Teak": "టేకు",
    "Crystal": "స్ఫటిక",
    "Quartz": "క్వార్ట్జ్",
    "Borosilicate Glass": "బోరోసిలికేట్ గ్లాస్",
    "Velvet": "వెల్వెట్",
    "Silk": "పట్టు",
    "Cotton": "నూలు",

    # Objects / Items
    "Idol": "విగ్రహం",
    "Murti": "మూర్తి",
    "Statue": "ప్రతిమ",
    "Diya": "దీపం",
    "Diyas": "దీపాలు",
    "Deepam": "దీపం",
    "Lamp": "దీపం",
    "Lamps": "దీపాలు",
    "Lantern": "లాంతరు",
    "Akhand Diya": "అఖండ దీపం",
    "Kuthu Vilakku": "కుత్తు విలక్కు దీపం",
    "Hanging Lamp": "వేలాడే దీపం",
    "Hanging Diya": "వేలాడే దీపం",
    "Aarti": "హారతి",
    "Harathi": "హారతి",
    "Plate": "పళ్ళెం",
    "Thali": "పూజా తాంబూలం",
    "Panchapatra": "పంచపాత్ర",
    "Udharini": "ఉద్ధరిణి",
    "Kalash": "కలశం",
    "Lota": "చెంబు / లోటా",
    "Bell": "గంట",
    "Ghanta": "పూజా గంట",
    "Shankh": "శంఖం",
    "Conch": "శంఖం",
    "Stand": "స్టాండ్ / స్టాండు",
    "Holder": "స్టాండు",
    "Mandir": "మందిరం",
    "Temple": "పూజా మందిరం",
    "Frame": "ఫోటో ఫ్రేమ్",
    "Photo Frame": "దివ్య ఫోటో ఫ్రేమ్",
    "Mala": "మాల",
    "Japa Mala": "జపమాల",
    "Rudraksha": "రుద్రాక్ష",
    "Tulsi": "తులసి",
    "Sandalwood": "చందనం",
    "Chandan": "గంధం",
    "Garland": "దండ",
    "Garlands": "పూలదండలు",
    "Toran": "తోరణం",
    "Door Hanging": "తలుపు తోరణం",
    "Coin": "నాణెం",
    "Coins": "నాణాలు",
    "Medallion": "లాకెట్",
    "Pendant": "లాకెట్",
    "Trishul": "త్రిశూలం",
    "Namam": "తిరుపతి నామం",
    "Eyes": "నేత్రాలు",
    "Nethram": "దివ్య నేత్రం",
    "Asan": "ఆసనం",
    "Mat": "చాప / ఆసనం",
    "Wicks": "వత్తులు",
    "Camphor": "కర్పూరం",
    "Dhoop": "ధూపం",
    "Agarbatti": "అగరుబత్తులు",
    "Incense": "అగరుబత్తులు",
    "Sindur": "సిందూరం",
    "Kumkum": "కుంకుమ",
    "Turmeric": "పసుపు",
    "Ghee": "నెయ్యి",
    "Oil": "నూనె",
    "Kund": "కుండం",
    "Havan Kund": "హోమ కుండం",
    "Yantra": "యంత్రం",
    "Kit": "కిట్",
    "Pooja Kit": "పూజా కిట్",
    "Pooja Set": "పూజా సెట్",
    "Chains": "గొలుసులు",
    "Chain": "గొలుసు",
    "Flower Basket": "పూల బుట్ట",
    "Marigold": "బంతిపూల",
    "Jasmine": "మల్లెపూల",
    "Rose": "గులాబీ"
}

def translate_title_to_telugu(eng_title):
    # Check for direct phrase mappings
    phrase_maps = {
        "Brass Ganesha Pendant/Idol": "ఇత్తడి వినాయకుడి లాకెట్ / విగ్రహం",
        "Silver Circular Coin/Medallion with Lakshmi Ganesha": "వెండి లక్ష్మీ గణపతి నాణెం",
        "Silver Leaf-shaped Coin/Pendant": "వెండి ఆకు ఆకారపు లాకెట్ / నాణెం",
        "Silver Round Coin/Pendant": "వెండి గుండ్రని నాణెం / లాకెట్",
        "Silver V-shaped Namam Marks (Pair)": "వెండి తిరుపతి నామాలు (జంట)",
        "Silver V-shaped Namam Marks (Set of 3)": "వెండి తిరుపతి నామాలు (3 సెట్)",
        "Silver Idol Eyes (Nethram)": "వెండి దేవుడి నేత్రాలు (నేత్రం)",
        "Silver Idol Eyes and Moustache Set": "వెండి దేవుడి నేత్రాలు మరియు మీసాల సెట్",
        "Silver Pooja Decoration Pins": "వెండి పూజా అలంకరణ పిన్నులు",
        "Pooja Kit Box (Combo)": "సమగ్ర పూజా సామాగ్రి కిట్ బాక్స్",
        "Silver Surya (Sun) Coins": "వెండి సూర్య భగవానుడి నాణాలు",
        "Silver Trishul (Trident) on Rod": "వెండి త్రిశూలం దండం",
        "Golden Rectangular Deity Coins": "స్వర్ణ పూత దేవుడి నాణాలు",
        "Brass Nataraja (Dancing Shiva) Idol": "ఇత్తడి నటరాజ స్వామి విగ్రహం",
        "Brass Laughing Buddha": "ఇత్తడి లాఫింగ్ బుద్ధ విగ్రహం",
        "Golden Pig Figurine (Feng Shui)": "ఫెంగ్ షుయ్ లక్కీ పిగ్ ప్రతిమ",
        "Five-Face Brass Diya": "పంచముఖి ఇత్తడి దీపం",
        "Seven-Face Brass Diya": "సప్తముఖి ఇత్తడి దీపం",
        "Brass Deepams and Lamps Collection": "ఇత్తడి దీపాలు మరియు దీప స్తంభాలు",
        "Brass Diya with Prabhavali Backplate": "ప్రభావళితో కూడిన ఇత్తడి దీపం",
        "Brass Deepam Stand": "ఇత్తడి దీప స్తంభం / స్టాండ్",
        "Brass Five-Petal Floral Diya": "ఐదు రేకుల పుష్ప ఇత్తడి దీపం",
        "Brass Prabha Diya (Flower Design)": "పుష్ప ప్రభావళి ఇత్తడి దీపం",
        "Brass Hanging Lamp Chains (Set)": "ఇత్తడి వేలాడే దీపం గొలుసుల సెట్",
        "Brass Hanging Lamp Chain": "ఇత్తడి వేలాడే దీపం గొలుసు",
        "Brass Diyas and Oil Lamps Shelf": "సాంప్రదాయ ఇత్తడి దీపాల సముదాయం",
        "Black Stone-Finish Shiva Family Idol": "కృష్ణ శిలా ఫినిష్ శివ కుటుంబం విగ్రహం",
        "Brass Shankh (Conch) with Stand": "ఇత్తడి శంఖం మరియు స్టాండు",
        "Brass Square Lantern / Akhand Diya": "ఇత్తడి చతురస్ర ఆకార అఖండ దీపం",
        "Brass Pancha Aarti Lamp with Handle": "చేతి పిడి గల ఇత్తడి పంచ హారతి",
        "Brass Idols and Decorative Items Shelf": "ఇత్తడి దేవతా మూర్తులు మరియు అలంకరణ వస్తువులు",
        "Brass Lakshmi Ganesha Idol": "ఇత్తడి లక్ష్మీ గణపతి విగ్రహం",
        "Brass Lakshmi Ganesha Idol Set": "ఇత్తడి లక్ష్మీ గణపతి దివ్య విగ్రహాల జంట",
        "Brass Nandi Idol": "ఇత్తడి పవిత్ర నంది విగ్రహం",
        "Assorted Brands of Puja Lamp Oil (Castor/Gingelly)": "ఆముదం మరియు నువ్వుల పూజా నూనెలు",
        "Artificial Orange Marigold Garland": "నారింజ రంగు బంతిపూల దండ",
        "Artificial Pink Rose and Marigold Garland": "గులాబీ మరియు బంతిపూల మాల",
        "Artificial Pink and Yellow Garland": "గులాబీ మరియు పసుపు రంగు పూలమాల",
        "Artificial Red and Pink Flower Garlands": "ఎరుపు మరియు గులాబీ రంగు పూలదండలు",
        "Artificial Yellow & Pink Floral Garland": "పసుపు మరియు గులాబీ రంగు పూలమాల",
        "Artificial Yellow Marigold & White Jasmine Garland": "బంతిపూలు మరియు మల్లెల కృత్రిమ మాల",
        "Artificial Yellow Marigold Garland": "పసుపు బంతిపూల తోరణ మాల",
        "Artificial Yellow Marigold Garland (Single)": "పసుపు బంతిపూల పూలమాల",
        "Artificial Yellow Marigold Garlands": "పసుపు బంతిపూల మాలల సెట్",
        "Artificial Yellow and Green Marigold Garlands": "పసుపు మరియు ఆకుపచ్చ బంతిపూల మాలలు",
        "Artificial White Jasmine and Marigold Strings": "కృత్రిమ మల్లెపూలు మరియు బంతిపూల తోరణాలు",
        "Puja Liquids and Rose Water Store Shelf": "పవిత్ర పన్నీరు మరియు పూజా ద్రవ్యాలు",
        "Puja Essentials and Oil Bottled Items": "పూజా సామాగ్రి మరియు దీపారాధన నూనెలు",
        "Black Spray Nozzle Cap": "స్ప్రే నాజిల్ క్యాప్ (నలుపు)",
        "Transparent Spray Nozzle Cap": "ట్రాన్స్పరెంట్ స్ప్రే నాజిల్ క్యాప్"
    }

    if eng_title in phrase_maps:
        return phrase_maps[eng_title]

    # Heuristic translation based on keywords
    words = eng_title.split()
    telugu_parts = []
    
    # Try multi-word chunks
    i = 0
    while i < len(words):
        matched = False
        for l in range(3, 0, -1):
            if i + l <= len(words):
                chunk = " ".join(words[i:i+l])
                clean_chunk = re.sub(r'[\(\),]', '', chunk).strip()
                if clean_chunk in TELUGU_DICT:
                    telugu_parts.append(TELUGU_DICT[clean_chunk])
                    i += l
                    matched = True
                    break
        if not matched:
            w_clean = re.sub(r'[\(\),]', '', words[i]).strip()
            if w_clean in TELUGU_DICT:
                telugu_parts.append(TELUGU_DICT[w_clean])
            elif w_clean.lower() in ["and", "with", "of", "for", "in", "on", "the", "a", "an"]:
                pass
            else:
                telugu_parts.append(w_clean)
            i += 1

    result = " ".join(telugu_parts)
    return result if result.strip() else "పవిత్ర పూజా వస్తువు"

# 3. Process the 212 original stock products from e7d2
processed_stock_products = []
for p in e7d2_products:
    if p["id"] == "matti_pramidalu":
        continue # Already in verified samsung catalog

    # Preserve original price
    price = p.get("price", 299)
    mrp = p.get("mrp", int(round(price * 1.3 / 10) * 10))
    discount = p.get("discount", max(10, int(round((1 - price / mrp) * 100))))
    
    eng_name = p.get("original_title") or p.get("title", "Sacred Pooja Item")
    # Clean any previous slashes
    if "/" in eng_name:
        eng_name = eng_name.split("/")[0].strip()

    telugu_name = translate_title_to_telugu(eng_name)
    bilingual_title = f"{eng_name} / {telugu_name}"

    cat = p.get("category", "Pooja Samagri & Essentials")
    cat_id = p.get("categoryId", "pooja-samagri")
    cat_icon = p.get("categoryIcon", "samagri")

    # Images
    imgs = p.get("images", [])
    if not imgs and p.get("image"):
        imgs = [p["image"]]
    if not imgs:
        imgs = ["image-coming-soon.svg"]

    # Descriptions
    desc = p.get("description", "")
    if not desc or len(desc) < 30:
        desc = f"Handcrafted authentic {eng_name} curated exclusively by 7 Hills Pooja Store, LB Nagar, Hyderabad. Ideal for divine home worship, temple rituals, and bringing spiritual auspiciousness and harmony."

    specs = p.get("specifications") or {
        "Material": "Pure Devotional Grade (Authentic Selection)",
        "Quality": "Temple Grade Certified",
        "Country of Origin": "India (Handcrafted Local Artisan)",
        "Store Location": "Beside Prasannanjaneya Swamy Temple, LB Nagar, Hyderabad",
        "Care Instructions": "Keep in clean, dry mandir space; clean with soft dry cloth."
    }

    ritual = p.get("ritualUsage") or "Place with devotion facing East or North on altar. Chant relevant sacred stotram during morning/evening deeparadhana for auspicious positive energy."

    # Give clean unique stock ID
    stock_id = f"stock_{p['id']}"

    stock_prod_obj = {
        "id": stock_id,
        "title": bilingual_title,
        "english_title": eng_name,
        "telugu_title": telugu_name,
        "original_title": eng_name,
        "image": imgs[0],
        "images": imgs,
        "category": cat,
        "categoryId": cat_id,
        "categoryIcon": cat_icon,
        "price": price,
        "mrp": mrp,
        "discount": discount,
        "rating": p.get("rating", 4.8),
        "reviewCount": p.get("reviewCount", 45),
        "inStock": p.get("inStock", True),
        "stockQty": p.get("stockQty", 25),
        "badge": p.get("badge") or ("Handcrafted" if "Idol" in eng_name or "Diya" in eng_name else "Authentic"),
        "description": desc,
        "specifications": specs,
        "ritualUsage": ritual
    }
    processed_stock_products.append(stock_prod_obj)

print(f"Prepared {len(processed_stock_products)} stock products with bilingual titles.")

# 4. Merge Samsung products (133) + Stock products (212)
full_catalog = list(samsung_products) + processed_stock_products
print(f"Total merged catalog size: {len(full_catalog)} products.")

# 5. Connect circular relatedIds for all products
for i, p in enumerate(full_catalog):
    rel1 = full_catalog[(i + 1) % len(full_catalog)]["id"]
    rel2 = full_catalog[(i + 2) % len(full_catalog)]["id"]
    rel3 = full_catalog[(i + 3) % len(full_catalog)]["id"]
    rel4 = full_catalog[(i + 4) % len(full_catalog)]["id"]
    p["relatedIds"] = [rel1, rel2, rel3, rel4]

# 6. Save to products.json
with open(PRODUCTS_JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(full_catalog, f, indent=2, ensure_ascii=False)
print(f"Saved {len(full_catalog)} products to {PRODUCTS_JSON_PATH}.")

# 7. Update window.PRODUCTS in data.js
with open(DATA_JS_PATH, "r", encoding="utf-8") as f:
    data_js_content = f.read()

idx_store_info = data_js_content.find("window.STORE_INFO")
if idx_store_info != -1:
    new_products_js = "window.PRODUCTS = " + json.dumps(full_catalog, indent=2, ensure_ascii=False) + ";\n\n"
    rest_of_data_js = data_js_content[idx_store_info:]
    with open(DATA_JS_PATH, "w", encoding="utf-8") as f:
        f.write(new_products_js + rest_of_data_js)
    print(f"Successfully updated window.PRODUCTS in {DATA_JS_PATH}.")
else:
    print("WARNING: Could not find window.STORE_INFO in data.js!")
