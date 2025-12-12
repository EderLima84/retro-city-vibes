# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/98a8930a-f9a4-4de8-8900-f07cd41ef53a

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/98a8930a-f9a4-4de8-8900-f07cd41ef53a) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

### Deploy via Lovable

Simply open [Lovable](https://lovable.dev/projects/98a8930a-f9a4-4de8-8900-f07cd41ef53a) and click on Share -> Publish.

### Deploy to Netlify

This project is configured for deployment on Netlify with proper MIME types and SPA routing support.

#### Prerequisites

- Node.js & npm installed
- Netlify account (free tier works)
- Git repository connected to Netlify

#### Deployment Steps

1. **Build the project locally to verify**
   ```sh
   npm run build
   ```

2. **Validate the build before deploying**
   ```sh
   npm run validate-build
   ```
   This script checks:
   - Build directory exists and is complete
   - All HTML references point to existing files
   - Critical assets (favicon, logos) are present
   - Public assets are copied correctly

3. **Deploy to Netlify**

   **Option A: Automatic deployment (recommended)**
   - Connect your Git repository to Netlify
   - Netlify will automatically build and deploy on every push
   - Build settings are configured in `netlify.toml`

   **Option B: Manual deployment via CLI**
   ```sh
   # Install Netlify CLI
   npm install -g netlify-cli

   # Login to Netlify
   netlify login

   # Deploy
   netlify deploy --prod
   ```

4. **Verify deployment**
   - Check that JavaScript files load without MIME type errors
   - Test SPA routing by refreshing on different routes
   - Verify all images and assets load correctly
   - Check browser console for any errors

#### Configuration Files

The project includes Netlify-specific configuration:

- **`netlify.toml`** - Build settings, redirects for SPA routing, and HTTP headers
- **`public/_headers`** - Additional header rules for proper MIME types

These files ensure:
- JavaScript modules are served with correct `application/javascript` MIME type
- SPA routing works (all routes return `index.html`)
- Static assets have proper cache headers
- Security headers are applied

#### Pre-Deploy Validation Commands

Run these commands before deploying to catch issues early:

```sh
# Build the project
npm run build

# Validate build integrity
npm run validate-build

# Preview locally (simulates production)
npm run preview

# Run all tests
npm test
```

#### Troubleshooting Common Issues

**Problem: JavaScript MIME type errors in browser console**
```
Refused to execute script from '...' because its MIME type ('text/plain') is not executable
```
**Solution:**
- Verify `public/_headers` file exists and is copied to `dist/`
- Check `netlify.toml` has correct header configuration
- Clear browser cache and Netlify CDN cache
- Redeploy the site

**Problem: 404 errors when refreshing on routes**
```
Page not found when accessing /profile or other routes directly
```
**Solution:**
- Verify `netlify.toml` contains the SPA redirect rule:
  ```toml
  [[redirects]]
    from = "/*"
    to = "/index.html"
    status = 200
  ```
- Ensure the file is in the project root
- Redeploy the site

**Problem: Missing images or assets (404 errors)**
```
Failed to load resource: the server responded with a status of 404
```
**Solution:**
- Run `npm run validate-build` to identify missing files
- Check that files exist in `public/` directory
- Verify file names match exactly (case-sensitive)
- Ensure `public/` files are being copied to `dist/` during build
- Check the build output for warnings

**Problem: Build fails on Netlify but works locally**
```
Build script returned non-zero exit code
```
**Solution:**
- Check Node.js version matches between local and Netlify
- Verify all dependencies are in `package.json` (not just devDependencies)
- Check Netlify build logs for specific error messages
- Ensure environment variables are set in Netlify dashboard if needed

**Problem: Cached old version after deployment**
```
Changes not appearing after deployment
```
**Solution:**
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Clear Netlify CDN cache in dashboard
- Check that `index.html` has no cache headers
- Verify build hash changed in JavaScript filenames

**Problem: Validation script fails**
```
npm run validate-build reports missing files
```
**Solution:**
- Run `npm run build` first to generate the dist directory
- Check that referenced files exist in `public/` directory
- Review the validation output for specific missing files
- Update file references in code if files were renamed/moved

#### Performance Tips

- Assets with hashed filenames (JS, CSS) use aggressive caching (`immutable`)
- `index.html` is not cached to ensure updates are immediate
- Netlify automatically applies gzip/brotli compression
- Images are served with long cache headers

#### Monitoring Deployment

After deployment, monitor:
- Netlify deploy logs for build warnings/errors
- Browser console for runtime errors
- Network tab for failed resource loads
- Lighthouse scores for performance metrics

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

For Netlify deployments, you can also configure custom domains directly in the Netlify dashboard under Domain Settings.
