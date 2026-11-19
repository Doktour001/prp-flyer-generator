# PRP Supporter Studio — Flyer Generator

A responsive, browser-only PRP campaign flyer creator with an editorial portrait-led 1080 × 1350 design, designed for GitHub Pages. The flyer is rendered on a 1080 × 1350 HTML canvas and downloaded as a PNG. Supporter photos are read locally in the browser and are not sent to a server.

## Files

- `index.html` — page structure
- `style.css` — responsive interface
- `script.js` — canvas artwork, photo upload, zoom, drag-to-pan and PNG export
- `assets/governor.jpg` — supplied governorship candidate photo
- `assets/deputy.jpg` — supplied deputy governorship candidate photo
- `assets/prp-logo.png` — supplied PRP flag/logo image

## Preview locally

Open `index.html` in a modern browser. If your browser restricts local file access, run a simple local web server from this folder, for example:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Publish on GitHub Pages

1. Create a **public** GitHub repository.
2. Upload the contents of this folder, keeping the `assets` folder structure intact.
3. In the repository, open **Settings → Pages**.
4. Under Build and deployment, choose **Deploy from a branch**.
5. Select the `main` branch and `/ (root)`, then save.
6. Wait for GitHub Pages to publish and open the URL shown in the Pages settings.

## Replace or add assets

- Replace `assets/governor.jpg` with the final governor portrait, keeping the exact filename.
- Replace `assets/deputy.jpg` with the final deputy portrait, keeping the exact filename.
- The supplied `assets/prp-logo.png` is already included. Replace it only if you have a higher-resolution official file.
- Keep the files in the `assets` folder. Filenames are case-sensitive on GitHub Pages.

## Notes

- The canvas export is 1080 × 1350 pixels. This is suitable for social sharing and many digital uses; it is not a guarantee of professional large-format print quality.
- Use original high-resolution photos for best output. The canvas cannot add detail that is not present in a source photo.
- The candidate portraits included here are the two images supplied in the conversation. They remain static and are not animated.
- The campaign date, candidate names, party branding and election details are displayed as supplied in the project brief. Verify all details before public distribution.


## Flyer artwork redesign

The flyer artwork has been redesigned with a portrait-led editorial layout:
- Large featured portrait for Sen. Shehu Buba Umar.
- Dedicated supporter photo and live uppercase name panel.
- PRP endorsement/date panel using the supplied PRP logo.
- Separate profile section for Hon. Tijjani Muhammed Aliyu.
- High-contrast red closing banner and creator credit.

The supporter photo upload, zoom slider, drag-to-position (mouse/touch), and PNG export remain client-side.


## Mobile download note

The download button now includes a fallback for Android in-app browsers that block
automatic file downloads. If the PNG does not download automatically, tap the
"tap here to open your flyer" link shown below the button. When the PNG opens,
use the browser menu's Download/Save option, or press and hold the image and
choose a save option.
