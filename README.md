# InstaWeb QR


<p align="center">
  <img src="/public/favicon.png" alt="InstaWeb QR Logo" width="120"/>
</p>

<p align="center">
  <b>Image to instant website. Generate, publish, and share with a QR code.</b>
</p>

<div align="center">
  <img src="https://visitor-badge.laobi.icu/badge?page_id=PasanSWijekoon.InstaWeb-QR" alt="visitors"/>
  <a href="https://github.com/PasanSWijekoon/InstaWeb-QR/stargazers">
    <img src="https://img.shields.io/github/stars/PasanSWijekoon/InstaWeb-QR?style=social" alt="GitHub Repo stars"/>
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/github/license/PasanSWijekoon/InstaWeb-QR" alt="GitHub Code License"/>
  </a>
  <a href="https://github.com/PasanSWijekoon/InstaWeb-QR/commits/master">
    <img src="https://img.shields.io/github/last-commit/PasanSWijekoon/InstaWeb-QR" alt="GitHub last commit"/>
  </a>
  <a href="https://github.com/PasanSWijekoon/InstaWeb-QR/pulls">
    <img src="https://img.shields.io/badge/PRs-welcome-blue" alt="GitHub pull request"/>
  </a>
  <a href="CONTRIBUTING.md">
    <img src="https://img.shields.io/badge/Contributions-Welcome-brightgreen.svg" alt="Contributions Welcome"/>
  </a>
</div>




Ever wanted to link your physical business card, flyer, or poster to a live website? InstaWeb QR makes it happen. Upload an image of your current business card, flyer, or even a simple sketch, and this tool uses AI to generate a matching single-page website. You can refine the site with text prompts, then publish it with one click. The final output is a live URL and a high-quality, printable QR code, ready to be added to your next batch of business cards or flyers, bridging the gap between your physical and digital presence.

## Features

- **AI-Powered Website Generation:** Uses the Gemini API to generate HTML and CSS from a single image.
- **Iterative AI Refinement:** Modify and improve your generated website using natural language prompts.
- **One-Click GitHub Publishing:** Automatically creates a GitHub repository and deploys your site to GitHub Pages.
- **Instant Sharing:** Generates a QR code for your live website, making it easy to share.
- **No Frameworks:** Built with vanilla TypeScript for a lightweight and fast experience.

## How It Works

1.  **Upload an Image:** Drag and drop or select an image of a website design or mockup.
2.  **Generate:** The AI analyzes the image and generates the initial HTML and CSS code.
3.  **Refine (Optional):** Use text prompts to ask the AI for changes (e.g., "Change the background color to dark blue").
4.  **Publish:** Provide a name for a new repository. The app will create the repo, upload the site, and enable GitHub Pages.
5.  **Share:** Your live site URL and a QR code will be displayed, ready for you to share.

## Tech Stack

- **Frontend:** TypeScript
- **AI:** Google Gemini API (`@google/genai`)
- **Bundler:** Vite
- **Deployment:** GitHub Pages via GitHub REST API

## Local Development

### Prerequisites

- [Node.js](https://nodejs.org/)
- A [GitHub Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) with `repo` scope.
- A [Google AI Gemini API Key](https://ai.google.dev/gemini-api/docs/api-key).

### Setup

1.  **Clone the repository (or download the files).**

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a file named `.env.local` in the root of the project and add the following, replacing the placeholder values:
    ```
    # Your Google AI Gemini API Key
    GEMINI_API_KEY=your_gemini_api_key

    # Your GitHub Personal Access Token
    GITHUB_TOKEN=your_github_personal_access_token
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.