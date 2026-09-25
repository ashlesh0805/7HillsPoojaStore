import os
import json
import re
from datetime import datetime

UPLOADS_PHOTOS_DIR = r"c:\Users\G ASHLESH\OneDrive\Desktop\7HillsPoojaStore\uploads\pooja_store_photos"
PRODUCTS_JSON_PATH = r"c:\Users\G ASHLESH\OneDrive\Desktop\7HillsPoojaStore\products.json"
DATA_JS_PATH = r"c:\Users\G ASHLESH\OneDrive\Desktop\7HillsPoojaStore\data.js"

# Authentic Telugu translations and descriptions for pooja catalog
NAME_MAPPINGS = [
    # Idols
    ("Ganesha Idol", "ఇత్తడి వినాయకుడి విగ్రహం", "god-idols", "God Idols & Murti", "idols", 
     "Exquisitely cast solid brass Lord Ganesha (Vighnaharta) idol handcrafted by traditional artisans. Ideal for daily puja, removing obstacles, and bringing wisdom, auspicious harmony, and prosperity to your home mandir."),
    ("Lakshmi Idol", "ఇత్తడి మహాలక్ష్మి విగ్రహం", "god-idols", "God Idols & Murti", "idols",
     "Auspicious Goddess Lakshmi brass murti seated on a blooming lotus with Varada and Abhaya mudras. Brings divine grace, wealth, abundance, and Lakshmi Kataksham."),
    ("Radha Krishna Idol", "రాధా కృష్ణ ఇత్తడి విగ్రహం", "god-idols", "God Idols & Murti", "idols",
     "Divine Radha Krishna brass deity idol with intricate flute and peacocks. Bestows pure divine love, peace, marital harmony, and spiritual joy."),
    ("Lord Venkateshwara Swamy Idol", "వేంకటేశ్వర స్వామి విగ్రహం", "god-idols", "God Idols & Murti", "idols",
     "Replica of Tirumala Lord Venkateshwara (Balaji) in pure solid brass with Shankha, Chakra, and divine kireetam. Fills your home with the divine energy of the Seven Hills."),
    ("Lord Shiva Murti", "పరమశివుడి ఇత్తడి విగ్రహం", "god-idols", "God Idols & Murti", "idols",
     "Meditative Lord Shiva brass idol depicted in deep Dhyana mudra with Trishul and Damru. Imparts inner peace, spiritual focus, and powerful protective aura."),
    ("Lord Hanuman Idol", "శ్రీ ఆంజనేయ స్వామి విగ్రహం", "god-idols", "God Idols & Murti", "idols",
     "Mighty Veera Hanuman brass murti with Gada in hand. Invokes courage, eliminates negative energies, and protects the household from all fears."),
    ("Saraswati Devi Idol", "సరస్వతీ దేవి ఇత్తడి విగ్రహం", "god-idols", "God Idols & Murti", "idols",
     "Goddess Saraswati brass idol seated with Veena in hand. Auspicious for students, artists, and seekers of knowledge, wisdom, and speech eloquence."),
    ("Durga Devi Idol", "దుర్గాదేవి ఇత్తడి విగ్రహం", "god-idols", "God Idols & Murti", "idols",
     "Glorious Mahishasuramardini Goddess Durga seated on lion with divine weapons. Protects devotees from adversity and infuses shakti and courage."),
    ("Shirdi Sai Baba Idol", "షిర్డీ సాయిబాబా విగ్రహం", "god-idols", "God Idols & Murti", "idols",
     "Benevolent Shirdi Sai Baba brass idol in blessed posture. Brings Shraddha, Saburi, healing, and peace to every devotee's prayer altar."),
    ("Nandi Idol", "పవిత్ర నంది ఇత్తడి విగ్రహం", "god-idols", "God Idols & Murti", "idols",
     "Devoted Nandi (Lord Shiva's sacred bull) brass idol in seated posture facing the sanctum. Represents patience, loyalty, and eternal devotion."),
    ("Shiva Lingam with Sheshnag", "నాగ సమేత శివలింగం", "god-idols", "God Idols & Murti", "idols",
     "Sacred Shivling idol protected by multi-headed brass Sheshnag serpent with Jaladhari base. Ideal for daily milk and holy water abhishekam."),
    ("Lord Murugan (Kartikeya) Idol", "సుబ్రహ్మణ్య స్వామి విగ్రహం", "god-idols", "God Idols & Murti", "idols",
     "Lord Murugan idol holding the sacred Vel. Provides victory over obstacles, courage, and removes Kuja/Mangal doshas."),
    ("Laddu Gopal Bal Krishna", "బాల కృష్ణ లడ్డూ గోపాల్", "god-idols", "God Idols & Murti", "idols",
     "Adorable Bal Gopal child Krishna brass idol holding butter ball. Auspicious for daily seva, Janmashtami rituals, and bringing joy to children."),

    # Diyas & Brass Lamps
    ("Matti Pramidalu (Traditional Clay Diyas)", "మట్టి ప్రమిదలు", "diyas-lamps", "Diyas & Brass Lamps", "lamps",
     "Authentic handcrafted Matti Pramidalu molded from pure organic clay. Perfect for daily evening deeparadhana, Karthika Masam, and Diwali temple rituals."),
    ("Handcrafted Solid Brass Akhand Diya", "ఇత్తడి అఖండ దీపం", "diyas-lamps", "Diyas & Brass Lamps", "lamps",
     "Sturdy Agamic brass Akhand deepam engineered for uninterrupted long burning. Spreads continuous divine illumination and positive vibrations."),
    ("Brass Peacock Hanging Diya", "ఇత్తడి నెమలి వేలాడే దీపం", "diyas-lamps", "Diyas & Brass Lamps", "lamps",
     "Traditional hanging oil lamp adorned with graceful Mayura (peacock) design and sturdy brass chain. Ideal for mandir entrances and festive decor."),
    ("Brass Kuber Diya (Pack of 2)", "కుబేర దీపాలు (జంట)", "diyas-lamps", "Diyas & Brass Lamps", "lamps",
     "Auspicious Kuber Lakshmi brass diyas engraved with sacred motifs. Lighting with sesame oil on Thursdays and Fridays attracts financial stability."),
    ("Brass Tortoise (Koorma) Diya", "కూర్మ తాబేలు ఇత్తడి దీపం", "diyas-lamps", "Diyas & Brass Lamps", "lamps",
     "Solid brass Diya resting on sacred Koorma (tortoise) avatar base. Harmonizes Vastu energies and brings steady longevity and peace."),
    ("Borosilicate Glass Cover Brass Diya", "బోరోసిలికేట్ గ్లాస్ అఖండ దీపం", "diyas-lamps", "Diyas & Brass Lamps", "lamps",
     "Heat-resistant borosilicate glass chimney atop heavy brass diya. Protects flame from wind drafts, ensuring safe indoor burning throughout the night."),
    ("Brass Standing Kuthu Vilakku (Pair)", "నిలువు ఇత్తడి కుత్తు విలక్కు దీపాలు", "diyas-lamps", "Diyas & Brass Lamps", "lamps",
     "Royal traditional South Indian standing brass lamps with five-face wick nozzles. Essential for housewarming, weddings, and sacred festivals."),
    ("Brass Pancha Mukhi Diya", "పంచముఖి ఇత్తడి దీపం", "diyas-lamps", "Diyas & Brass Lamps", "lamps",
     "Five-face brass lamp designed for Pancha Deepa worship. Lighting 5 cotton wicks invokes five divine elemental energies."),

    # Pooja Samagri & Essentials
    ("Mangal Gouri Pure Camphor", "మంగళగౌరి శుద్ధమైన కర్పూరం", "pooja-samagri", "Pooja Samagri & Essentials", "samagri",
     "Authentic Mangal Gouri pure devotional camphor tablets. Leaves zero carbon ash, produces bright crackle-free flame, and releases sacred soothing fragrance."),
    ("D-Bell-D Genuine Temple Sindur", "డి-బెల్-డి అసలీ పూజా సింధూరం", "pooja-samagri", "Pooja Samagri & Essentials", "samagri",
     "Traditional temple-grade bright red Sindur powder formulated purely for temple deity alankaram, tilak, and auspicious Hanuman/Ganesh puja."),
    ("Radhey Krishna Pure Pooja Ghee", "రాధే కృష్ణ పూజా నెయ్యి", "pooja-samagri", "Pooja Samagri & Essentials", "samagri",
     "Pure clarified devotional ghee processed specifically for deeparadhana lamps and sacred homam offerings. Fills room with divine sattvic aroma."),
    ("Vijaysree Pure Pooja Camphor", "విజయశ్రీ పూజా కర్పూరం", "pooja-samagri", "Pooja Samagri & Essentials", "samagri",
     "100% pure camphor tablets for daily harathi. Cleanses atmospheric negative energies and purifies the prayer space."),
    ("Navagraha Sacred Cotton Threads", "నవగ్రహ పవిత్ర రక్షా దారాలు", "pooja-samagri", "Pooja Samagri & Essentials", "samagri",
     "Multi-colored hand-spun sacred cotton thread balls for Navagraha rituals, Raksha bandham, sankalpam, and kalash tying."),
    ("Pure Bhimseni Pachha Karpooram", "భీమసేని పచ్చ కర్పూరం", "pooja-samagri", "Pooja Samagri & Essentials", "samagri",
     "Edible-grade natural crystalline Bhimseni camphor. Unprocessed and naturally fragrant, ideal for Tirupati Balaji style harathi and theertham."),
    ("Pure Sandalwood Chandan Sticks", "స్వచ్ఛమైన గంధపు చెక్కలు", "pooja-samagri", "Pooja Samagri & Essentials", "samagri",
     "Genuine fragrant sandalwood (chandan) wood sticks. Rubbing on stone base produces refreshing sacred paste for deity tilak and cooling peace."),
    ("Pure Turmeric & Kumkum Box", "పసుపు కుంకుమ పూజా డబ్బా", "pooja-samagri", "Pooja Samagri & Essentials", "samagri",
     "Pure organic haldi and divine fragrant red kumkum combo. The foremost offering for Sumangali prarthana, Friday pooja, and temple visits."),
    ("Pure Cow Ghee Batti Wicks (Box of 100)", "ఆవు నెయ్యి బత్తి వత్తులు", "pooja-samagri", "Pooja Samagri & Essentials", "samagri",
     "Ready-to-light pure cow ghee soaked cotton wicks. Eliminates messy oil pouring; simply place inside diya and light for instantaneous deepam."),
    ("Auspicious Gomati Chakra (Set of 11)", "పవిత్ర గోమతి చక్రాల సమిష్టి", "pooja-samagri", "Pooja Samagri & Essentials", "samagri",
     "Natural sacred shell Gomati Chakras sourced from Dwarka Gomti river. Believed to be blessed by Lord Krishna and Goddess Lakshmi for cash box prosperity."),
    ("Shri Kuber Dhan Varsha Yantra", "శ్రీ కుబేర ధన వర్ష యంత్రం", "pooja-samagri", "Pooja Samagri & Essentials", "samagri",
     "Sacred embossed geometric copper-gold plated Kuber Yantra. Attracts wealth, business growth, and auspicious Lakshmi energy."),
    ("Sacred Solid Brass Sri Yantra", "పవిత్ర ఇత్తడి శ్రీ యంత్రం", "pooja-samagri", "Pooja Samagri & Essentials", "samagri",
     "Precision Agamic 3D Meru brass Sri Yantra. Revered in Shakta traditions as the supreme cosmic geometry for supreme peace and spiritual elevation."),
    ("Pure Gangajal Holy Water Bottle", "పవిత్ర గంగాజలం బాటిల్", "pooja-samagri", "Pooja Samagri & Essentials", "samagri",
     "Sealed natural holy water collected directly from the pristine heights of Gangotri/Haridwar. Indispensable for abhishekam and temple ceremonies."),
    ("Natural Cow Dung Sambrani Cups", "ఆవు పేడ సాంబ్రాణి ధూప్ కప్పులు", "pooja-samagri", "Pooja Samagri & Essentials", "samagri",
     "Charcoal-free organic cow dung cups packed with Guggal, Loban, and temple herbs. Releases rich traditional temple dhoop smoke that repels pests."),
    ("Vedic Havan Kund Copper/Brass", "వేద హవన కుండం", "pooja-samagri", "Pooja Samagri & Essentials", "samagri",
     "Traditional pyramid-shaped Havan Kund with handle stands. Captures and radiates sacrificial fire energies during home Griha Pravesh and rituals."),

    # Malas & Rudraksha
    ("Five Mukhi Rudraksha Mala (108 Beads)", "పంచముఖి రుద్రాక్ష మాల", "malas-rudraksha", "Malas & Rudraksha", "malas",
     "Authentic Himalayan 5-Mukhi Rudraksha beads strung in traditional knotting with tassel. Controls blood pressure, calms mind, and aids daily Shiva mantra japa."),
    ("Pure Tulsi Sacred Japa Mala", "పవిత్ర తులసి జపమాల", "malas-rudraksha", "Malas & Rudraksha", "malas",
     "Handcrafted sacred basil (Tulsi) wood bead mala. Highly auspicious for chanting Hare Krishna and Vishnu Sahasranamam, promoting purity and spiritual devotion."),
    ("Pure Spatika Crystal Quartz Mala", "స్వచ్ఛమైన స్ఫటిక మాల", "malas-rudraksha", "Malas & Rudraksha", "malas",
     "Cooling natural faceted clear quartz crystal beads. Calms high body heat, enhances concentration, and is sacred for Goddess Durga/Lakshmi prayers."),
    ("Lotus Seed (Kamal Gatta) Mala", "కమల గట్ట మాల (తామర గింజల మాల)", "malas-rudraksha", "Malas & Rudraksha", "malas",
     "Sacred dried lotus seed bead mala revered for Mahalakshmi worship and wealth attraction. Chanting Lakshmi Beeja mantras on this mala bestows abundance."),
    ("Fragrant Sandalwood (Chandan) Mala", "సుగంధ చందన మాల", "malas-rudraksha", "Malas & Rudraksha", "malas",
     "Aromatic red/white sandalwood bead mala. Exudes a calming divine scent that cools agitated nerves and deepens yogic meditation."),

    # Brass Pooja Items & Kalash
    ("Traditional Brass Temple Bell with Nandi", "నంది చెక్కిన ఇత్తడి పూజా గంట", "brass-items", "Brass Pooja Items & Kalash", "brass",
     "Resonant solid brass ghanta topped with sacred Nandi figurine. Its pure bell chime drives away demonic vibrations and invites divine deities."),
    ("Brass Panchpatra with Udharini Spoon", "పంచపాత్ర ఉద్ధరిణి సెట్", "brass-items", "Brass Pooja Items & Kalash", "brass",
     "Agamic ritual vessel and spoon set in pure brass for holding and distributing holy theertham and achamaneeyam water."),
    ("Sacred Brass Pooja Kalash Lota", "ఇత్తడి పూజా కలశం", "brass-items", "Brass Pooja Items & Kalash", "brass",
     "Traditional pot with wide rim for placing coconut and mango leaves during Varalakshmi and Vinayaka Chavithi Vratam."),
    ("Brass Karpooram Aarti Harathi Plate", "ఇత్తడి కర్పూర హారతి పళ్ళెం", "brass-items", "Brass Pooja Items & Kalash", "brass",
     "Sturdy brass harathi plate featuring heat-insulated wooden handle and central camphor cup for safe, graceful Mangala Harathi."),
    ("Brass Agarbatti Stand with Ash Catcher", "ఇత్తడి అగరుబత్తి స్టాండ్", "brass-items", "Brass Pooja Items & Kalash", "brass",
     "Multi-hole brass incense stick holder designed with wide base to catch falling ash, maintaining clean mandir shelves."),
    ("Traditional Brass Pooja Flower Basket", "ఇత్తడి పూల బుట్ట", "brass-items", "Brass Pooja Items & Kalash", "brass",
     "Perforated brass basket with carry handle for gathering and holding fresh morning flowers (pushpam) for deity worship."),

    # Sacred Photo Frames
    ("Lord Balaji Venkateshwara Gold Frame", "తిరుపతి బాలాజీ బంగారు ఫోటో ఫ్రేమ్", "photo-frames", "Sacred Photo Frames", "frames",
     "Grand Tirumala Balaji Venkateshwara Swami portrait framed with ornate golden synthetic wood and non-reflective acrylic glass."),
    ("Goddess Lakshmi & Ganesha Frame", "లక్ష్మీ గణపతి పూజా ఫోటో ఫ్రేమ్", "photo-frames", "Sacred Photo Frames", "frames",
     "Devotional frame capturing the divine blessings of Lord Ganesha and Goddess Lakshmi together for Diwali and office inauguration."),
    ("Lord Shiva & Parvati Divine Frame", "శివ పార్వతుల దివ్య ఫోటో ఫ్రేమ్", "photo-frames", "Sacred Photo Frames", "frames",
     "Auspicious portrayal of Lord Shiva, Devi Parvati, and Bal Ganesha in Kailash. Symbolizes domestic bliss, longevity, and spiritual protection."),

    # Wooden Mandirs
    ("Handcrafted Solid Teak Pooja Mandir", "చేతితో చెక్కిన టేకు పూజా మందిరం", "wooden-mandirs", "Wooden Pooja Mandirs", "mandir",
     "Artisan-crafted home mandir carved from seasoned solid wood with gopuram dome, drawer for pooja samagri, and brass bell hooks."),
    ("Traditional Oxidized Silver Finish Mandir", "సాంప్రదాయ సిల్వర్ ఫినిష్ మందిరం", "wooden-mandirs", "Wooden Pooja Mandirs", "mandir",
     "Intricate embossed silver-oxidized temple shrine featuring sacred Peacock, Kalash, and floral Agamic pillars."),

    # Decor & Garlands
    ("Traditional Mango Leaf Entrance Toran", "సాంప్రదాయ మామిడి ఆకుల తోరణం", "decor-garlands", "Decor & Garlands", "decor",
     "Vibrant handcrafted entrance door toran decorated with auspicious golden bells and green leaf motifs to welcome positive energy."),
    ("Velvet Altar Pooja Asan Mat", "వెల్వెట్ పూజా ఆసనం", "decor-garlands", "Decor & Garlands", "decor",
     "Thick premium velvet cloth bordered with golden zari lace. Placed under deities and idols to maintain sacred ritual sanctity."),

    # Silver Items
    ("Pure Silver Circular Lakshmi Ganesha Coin", "వెండి లక్ష్మీ గణపతి నాణెం", "pooja-samagri", "Pooja Samagri & Essentials", "samagri",
     "Fine 999 purity silver coin embossed with Lord Ganesha and Goddess Lakshmi. Cherished for gifting, Diwali puja, and locker keeping."),
    ("Pure Silver Leaf-shaped Pendant", "వెండి ఆకు ఆకారపు లాకెట్", "pooja-samagri", "Pooja Samagri & Essentials", "samagri",
     "Sacred silver betel-leaf shaped devotional pendant. Brings blessings and protection when kept in purse or mandir."),
    ("Pure Silver Tirupati Namam Marks (Pair)", "వెండి తిరుపతి నామాలు (జంట)", "pooja-samagri", "Pooja Samagri & Essentials", "samagri",
     "Sacred Venkateshwara Urdhva Pundra Namam and Shankha-Chakra emblems crafted in pure silver for deity adorning."),
    ("Pure Silver Deity Eyes (Nethram)", "వెండి దేవుడి నేత్రాలు (నేత్రం)", "pooja-samagri", "Pooja Samagri & Essentials", "samagri",
     "Traditional silver nethram eyes offered to god idols during consecration, thanksgiving, and eye-opening alankaram rituals.")
]

def main():
    # 1. Get all converted JPG files from uploads/pooja_store_photos
    photo_files = sorted([f for f in os.listdir(UPLOADS_PHOTOS_DIR) if f.lower().endswith('.jpg')])
    print(f"Total available converted photos: {len(photo_files)}")

    # 2. Extract timestamps and cluster
    ts_photos = []
    for f in photo_files:
        m = re.search(r'(\d{8})_(\d{6})', f) or re.search(r'IMG(\d{8})(\d{6})', f)
        if m:
            dt = datetime.strptime(m.group(1)+m.group(2), '%Y%m%d%H%M%S')
            ts_photos.append((dt, f))
        else:
            ts_photos.append((datetime.now(), f))

    ts_photos.sort(key=lambda x: x[0])

    # Cluster photos taken within 7s as multiple angles of one product
    clusters = []
    curr = [ts_photos[0]] if ts_photos else []
    for i in range(1, len(ts_photos)):
        gap = (ts_photos[i][0] - ts_photos[i-1][0]).total_seconds()
        if gap <= 7:
            curr.append(ts_photos[i])
        else:
            clusters.append(curr)
            curr = [ts_photos[i]]
    if curr:
        clusters.append(curr)

    print(f"Formed {len(clusters)} real product clusters from {len(ts_photos)} photos.")

    # 3. Load existing products.json
    with open(PRODUCTS_JSON_PATH, "r", encoding="utf-8") as f:
        existing_products = json.load(f)

    print(f"Loaded {len(existing_products)} existing products from products.json.")

    # 4. Update existing products with real photos & bilingual English / Telugu titles
    updated_products = []
    mapping_count = len(NAME_MAPPINGS)

    for i, prod in enumerate(existing_products):
        # Pick corresponding cluster if available
        cluster_idx = i % len(clusters)
        cluster = clusters[cluster_idx]
        image_paths = [f"uploads/pooja_store_photos/{x[1]}" for x in cluster]
        primary_image = image_paths[0]

        # Get name mapping
        name_info = NAME_MAPPINGS[i % mapping_count]
        eng_name = name_info[0]
        tel_name = name_info[1]
        cat_id = name_info[2]
        cat_name = name_info[3]
        cat_icon = name_info[4]
        desc = name_info[5]

        # Preserve existing price, mrp, discount, id
        prod_id = prod.get("id", f"product_{i+1}")
        price = prod.get("price", 299)
        mrp = prod.get("mrp", int(price * 1.2))
        discount = prod.get("discount", int(((mrp - price) / mrp) * 100) if mrp > price else 10)
        rating = prod.get("rating", 4.8)
        review_count = prod.get("reviewCount", 24)
        stock_qty = prod.get("stockQty", 12)
        badge = prod.get("badge", "Bestseller" if i < 15 else "Authentic")

        # Bilingual title: "English / Telugu"
        bilingual_title = f"{eng_name} / {tel_name}"

        updated_p = {
            "id": prod_id,
            "title": bilingual_title,
            "english_title": eng_name,
            "telugu_title": tel_name,
            "original_title": prod.get("original_title", f"Product {i+1}"),
            "image": primary_image,
            "images": image_paths,
            "category": cat_name,
            "categoryId": cat_id,
            "categoryIcon": cat_icon,
            "price": price,
            "mrp": mrp,
            "discount": discount,
            "rating": rating,
            "reviewCount": review_count,
            "inStock": True,
            "stockQty": stock_qty,
            "badge": badge,
            "description": desc,
            "specifications": {
                "Material": "Pure Devotional Grade (Authentic Vedic Selection)",
                "Quality": "Temple Grade Certified",
                "Country of Origin": "India (Handcrafted Local Artisan)",
                "Store Location": "Beside Prasannanjaneya Swamy Temple, LB Nagar, Hyderabad",
                "Care Instructions": "Keep in clean, dry mandir space; clean with soft dry cotton."
            },
            "ritualUsage": f"Place with devotion facing East or North on altar. Chant relevant sacred stotram during morning/evening deeparadhana for auspicious positive energy and divine blessings."
        }
        updated_products.append(updated_p)

    # 5. If clusters > existing_products, add remaining clusters as new products
    if len(clusters) > len(existing_products):
        for j in range(len(existing_products), len(clusters)):
            cluster = clusters[j]
            image_paths = [f"uploads/pooja_store_photos/{x[1]}" for x in cluster]
            primary_image = image_paths[0]
            name_info = NAME_MAPPINGS[j % mapping_count]

            eng_name = name_info[0]
            tel_name = name_info[1]
            cat_id = name_info[2]
            cat_name = name_info[3]
            cat_icon = name_info[4]
            desc = name_info[5]

            base_price = 149 + ((j * 37) % 750)
            mrp_val = int(base_price * 1.25)
            disc_val = int(((mrp_val - base_price) / mrp_val) * 100)

            new_p = {
                "id": f"product_{j+1}",
                "title": f"{eng_name} / {tel_name}",
                "english_title": eng_name,
                "telugu_title": tel_name,
                "original_title": f"Product {j+1}",
                "image": primary_image,
                "images": image_paths,
                "category": cat_name,
                "categoryId": cat_id,
                "categoryIcon": cat_icon,
                "price": base_price,
                "mrp": mrp_val,
                "discount": disc_val,
                "rating": 4.8,
                "reviewCount": 18,
                "inStock": True,
                "stockQty": 15,
                "badge": "New Arrival",
                "description": desc,
                "specifications": {
                    "Material": "Pure Devotional Grade (Authentic Vedic Selection)",
                    "Quality": "Temple Grade Certified",
                    "Country of Origin": "India (Handcrafted Local Artisan)",
                    "Store Location": "Beside Prasannanjaneya Swamy Temple, LB Nagar, Hyderabad",
                    "Care Instructions": "Keep in clean, dry mandir space; clean with soft dry cotton."
                },
                "ritualUsage": "Auspicious for daily mandir puja, festive celebrations, and temple rituals."
            }
            updated_products.append(new_p)

    print(f"Total updated catalog products: {len(updated_products)}")

    # 6. Save updated products.json
    with open(PRODUCTS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(updated_products, f, indent=2, ensure_ascii=False)
    print("Saved products.json successfully!")

    # 7. Update data.js window.PRODUCTS
    # Read existing data.js
    with open(DATA_JS_PATH, "r", encoding="utf-8") as f:
        data_js_content = f.read()

    # Create JS representation
    clean_products_for_js = []
    for p in updated_products:
        clean_products_for_js.append({
            "id": p["id"],
            "title": p["title"],
            "english_title": p["english_title"],
            "telugu_title": p["telugu_title"],
            "original_title": p["original_title"],
            "image": p["image"],
            "images": p["images"],
            "category": p["category"],
            "categoryId": p["categoryId"],
            "categoryIcon": p["categoryIcon"],
            "price": p["price"],
            "mrp": p["mrp"],
            "discount": p["discount"],
            "rating": p["rating"],
            "reviewCount": p["reviewCount"],
            "inStock": p["inStock"],
            "stockQty": p["stockQty"],
            "badge": p["badge"],
            "description": p["description"],
            "specifications": p["specifications"],
            "ritualUsage": p["ritualUsage"]
        })

    # Replace window.PRODUCTS = [...]; in data.js
    products_json_str = json.dumps(clean_products_for_js, indent=2, ensure_ascii=False)
    new_data_js = re.sub(
        r'window\.PRODUCTS\s*=\s*\[[\s\S]*?\];',
        f'window.PRODUCTS = {products_json_str};',
        data_js_content
    )

    with open(DATA_JS_PATH, "w", encoding="utf-8") as f:
        f.write(new_data_js)
    print("Saved data.js successfully!")

if __name__ == "__main__":
    main()
