# Complete Guide: Launching Pre-Registration on Google Play Store
### 7 Hills Pooja Store — Official Android App

This guide walks you step-by-step through setting up **Pre-Registration** on the Google Play Store so devotees across Hyderabad and India can discover the app, pre-register, and have it automatically install on launch day.

---

## 📁 Pre-Generated Assets in Your Folder

All required graphics, legal compliance pages, and copy documents are already prepared in `c:\Users\G ASHLESH\OneDrive\Desktop\7HillsPoojaStore`:

| Asset | File Name | Play Store Requirement |
| :--- | :--- | :--- |
| **App Icon** | `playstore-icon-512.png` | 512 x 512 px PNG (32-bit color) |
| **Feature Graphic** | `playstore-feature-graphic.png` | 1024 x 500 px PNG (Landscape banner) |
| **Screenshot 1 (Home)** | `playstore-screenshot-1-home.png` | 412 x 892 px Mobile Phone Screenshot |
| **Screenshot 2 (Catalog)** | `playstore-screenshot-2-categories.png` | 412 x 892 px Mobile Phone Screenshot |
| **Screenshot 3 (Cart)** | `playstore-screenshot-3-cart.png` | 412 x 892 px Mobile Phone Screenshot |
| **Screenshot 4 (Checkout)** | `playstore-screenshot-4-checkout.png` | 412 x 892 px Mobile Phone Screenshot |
| **Store Listing Copy** | `playstore-copy.md` | Pre-written Title, Short & Full Description |
| **Privacy Policy** | `privacy.html` | Mandatory live URL for Play Store |
| **Terms of Service** | `terms.html` | Mandatory terms explaining 100% online prepaid |

---

## 🚀 Step 1: Create the App in Google Play Console

1. Log into your [Google Play Console](https://play.google.com/console).
2. On the **All apps** page, click the blue **Create app** button (top right).
3. Fill in the basic details:
   - **App name**: `7 Hills Pooja Store`
   - **Default language**: `English (India) - en-IN`
   - **App or game**: Select **App**
   - **Free or paid**: Select **Free**
4. Check the two policy declarations:
   - Developer Program Policies
   - US export laws
5. Click **Create app**.

---

## 📝 Step 2: Set Up Store Listing & Visual Assets

In the left menu, navigate to **Grow > Store presence > Main store listing**:

1. **Listing details** (Open `playstore-copy.md` to copy-paste):
   - **App name**: `7 Hills Pooja Store`
   - **Short description**: `Order Sacred Pooja Samagri, Idols & Ritual Articles with Express Delivery.`
   - **Full description**: Copy the full text from `playstore-copy.md`.
2. **Graphics & Icons**:
   - **App icon**: Upload `playstore-icon-512.png`.
   - **Feature graphic**: Upload `playstore-feature-graphic.png`.
3. **Phone Screenshots**:
   - Drag and drop the 4 generated screenshots:
     - `playstore-screenshot-1-home.png`
     - `playstore-screenshot-2-categories.png`
     - `playstore-screenshot-3-cart.png`
     - `playstore-screenshot-4-checkout.png`
4. Click **Save** at the bottom right.

---

## 🔒 Step 3: Complete App Content Questionnaires

In the left menu, scroll down to **Policy and programs > App content**:

1. **Privacy Policy**:
   - Paste: `https://<your-domain>/privacy.html`
   - Click Save.
2. **Ads**:
   - Select: **"No, my app does not contain ads"**
   - Click Save.
3. **App Access**:
   - Select: **"All functionality is available without special access"**
   - Click Save.
4. **Content Rating**:
   - Click **Start questionnaire**.
   - Email: Your business email (e.g. `support@7hillspoojastore.com`).
   - Category: Select **Consumer / Shopping / All Other App Types**.
   - Violence, Sexual Content, Offensive Language, Controlled Substances: Answer **"No"** to all.
   - Click **Save** -> **Next** -> **Submit** (Your app will be rated **PEGI 3 / Everyone**).
5. **Target Audience and Content**:
   - Target age: Check **18 and over**.
   - Appeal to children: Select **"No"**.
   - Click Save.
6. **Data Safety**:
   - Use the pre-filled answers from Section 4 of `playstore-copy.md`:
     - Does your app collect data? **Yes**.
     - Is data encrypted in transit? **Yes** (256-bit SSL).
     - Data collected: **Name, Phone number, Delivery address** (Purpose: App functionality / Order delivery fulfillment).
     - Is data shared with third parties? **No**.

---

## 📦 Step 4: Generate Your Signed Android App Bundle (`.aab`)

You can generate the `.aab` in 30 seconds using **PWABuilder** (recommended) or locally using Bubblewrap:

### Recommended: PWABuilder (Fastest, zero Android SDK setup)
1. Open [https://www.pwabuilder.com](https://www.pwabuilder.com).
2. Enter your live HTTPS store domain and click **Start**.
3. Click **Package for Stores** -> Select **Google Play (Android)**.
4. Under Options:
   - **Package ID**: `com.sevenhills.poojastore`
   - **App Name**: `7 Hills Pooja Store`
   - **Short Name**: `7 Hills Pooja`
5. Click **Generate Package** and download the ZIP file.
6. Extract the ZIP: You will find `app-release-bundle.aab` and your release keystore!

---

## ⭐ Step 5: Configure & Launch Pre-Registration

1. In Google Play Console, go to **Release > Pre-registration** in the left menu.
2. Click **Start pre-registration** (or **Select countries and regions**).
3. **Select Countries**:
   - Choose **India** (or add other countries if you wish to allow NRI devotees to pre-register).
   - Click **Save**.
4. **Enable Automatic Install**:
   - Toggle **"Turn on automatic install"** to **ON**.
   - *Why?* When users click "Pre-register", their phones will automatically download and install the app the moment you release it publicly!
5. **Upload the App Bundle**:
   - Upload the generated `app-release-bundle.aab`.
6. (Optional) **Pre-Registration Reward**:
   - You can offer a launch perk, such as coupon code **`DIVINE10`** (10% off launch order).
7. Review your pre-registration release and click **Save**.
8. Go to **Publishing overview** and click **Send changes for review**.

---

## ⏳ What Happens Next?

- **Google Review Timeline**: Google takes approximately **24 to 48 hours** to review the initial store listing and compliance policies.
- **Going Live**: Once approved, your store listing status will change to **"Pre-registration"**.
- **Devotee Experience**: Devotees who visit your Play Store link will see your screenshots, read your store description, and see a large green **"Pre-register"** button!
- **On Official Launch Day**: Whenever you are ready to open the app for full use, simply go to Play Console and click **Turn off pre-registration & Publish to Production**. The app will automatically install on all pre-registered devices!
