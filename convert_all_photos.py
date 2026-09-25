import os
import time
import shutil
import pillow_heif
from PIL import Image, ImageOps
from concurrent.futures import ProcessPoolExecutor, as_completed

SRC_DIR = r"C:\Users\G ASHLESH\OneDrive\Desktop\7 HILLS POOJA STOCK IMAGES\Pooja store"
OUT_DIR_LOCAL = r"C:\Users\G ASHLESH\OneDrive\Desktop\7 HILLS POOJA STOCK IMAGES\Pooja store\converted_jpg"
OUT_DIR_APP = r"c:\Users\G ASHLESH\OneDrive\Desktop\7HillsPoojaStore\uploads\pooja_store_photos"
OUT_DIR_STOCK = r"C:\Users\G ASHLESH\OneDrive\Desktop\7HILLS WEBSITE FOR STOCK ITEMS\pooja_store_photos"

def process_file(filename):
    src_path = os.path.join(SRC_DIR, filename)
    base_name = os.path.splitext(filename)[0]
    out_filename = base_name + ".jpg"
    
    out_local = os.path.join(OUT_DIR_LOCAL, out_filename)
    out_app = os.path.join(OUT_DIR_APP, out_filename)
    out_stock = os.path.join(OUT_DIR_STOCK, out_filename)

    # If already converted and valid size, skip
    if os.path.exists(out_app) and os.path.getsize(out_app) > 10000:
        return out_filename, "SKIPPED", os.path.getsize(out_app)

    try:
        if filename.lower().endswith(".heic"):
            heif_file = pillow_heif.read_heif(src_path)
            img = Image.frombytes(heif_file.mode, heif_file.size, heif_file.data, "raw")
        else:
            img = Image.open(src_path)

        # Fix orientation from Samsung camera
        img = ImageOps.exif_transpose(img)

        # Convert to RGB if needed
        if img.mode != "RGB":
            img = img.convert("RGB")

        # Resize to max 1600px HD
        img.thumbnail((1600, 1600), Image.Resampling.LANCZOS)

        # Save to local converted dir
        img.save(out_local, "JPEG", quality=88, optimize=True)

        # Copy to app uploads and stock dir
        shutil.copy2(out_local, out_app)
        shutil.copy2(out_local, out_stock)

        return out_filename, "SUCCESS", os.path.getsize(out_local)
    except Exception as e:
        return out_filename, f"ERROR: {str(e)}", 0

def main():
    os.makedirs(OUT_DIR_LOCAL, exist_ok=True)
    os.makedirs(OUT_DIR_APP, exist_ok=True)
    os.makedirs(OUT_DIR_STOCK, exist_ok=True)

    files = [f for f in sorted(os.listdir(SRC_DIR)) if f.lower().endswith(('.heic', '.jpg', '.jpeg'))]
    total = len(files)
    print(f"Found {total} photos to convert from Samsung stock photos...")

    start_time = time.time()
    workers = min(12, os.cpu_count() or 4)
    print(f"Using {workers} CPU workers...")

    success_count = 0
    error_count = 0

    with ProcessPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(process_file, f): f for f in files}
        for i, future in enumerate(as_completed(futures), 1):
            out_name, status, size = future.result()
            if "ERROR" in status:
                error_count += 1
                print(f"[{i}/{total}] {out_name}: {status}")
            else:
                success_count += 1
                if i % 25 == 0 or i == total:
                    elapsed = time.time() - start_time
                    print(f"[{i}/{total}] Converted {success_count} photos... ({elapsed:.1f}s)")

    total_time = time.time() - start_time
    print(f"\nFinished! Converted {success_count} / {total} photos in {total_time:.1f}s. Errors: {error_count}")

if __name__ == "__main__":
    main()
