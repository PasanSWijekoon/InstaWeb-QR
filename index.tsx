/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI, Chat } from "@google/genai";

function showLoader(message = 'Processing image...') {
  const loader = document.getElementById('loader');
  const loaderText = loader?.querySelector('p');
  if (loader) loader.classList.remove('hidden');
  if (loaderText) loaderText.textContent = message;
}

function hideLoader() {
  const loader = document.getElementById('loader');
  if (loader) loader.classList.add('hidden');
}

function disableGenerateButton() {
  const btn = document.getElementById('generate-btn') as HTMLButtonElement | null;
  if (btn) btn.disabled = true;
}
function enableGenerateButton() {
  const btn = document.getElementById('generate-btn') as HTMLButtonElement | null;
  if (btn) btn.disabled = false;
}

// State variables
let uploadedImage: { mimeType: string; data: string } | null = null;
let currentHtml: string | null = null;
let chat: Chat | null = null;

// DOM Elements
const dropZone = document.getElementById("drop-zone") as HTMLLabelElement;
const imageUpload = document.getElementById("image-upload") as HTMLInputElement;
const imagePreview = document.getElementById(
  "image-preview"
) as HTMLImageElement;
const uploadPrompt = document.getElementById("upload-prompt") as HTMLDivElement;
const logoUrlPrompt = document.getElementById(
  "logo-url-prompt"
) as HTMLInputElement;
const generateBtn = document.getElementById(
  "generate-btn"
) as HTMLButtonElement;
const editSection = document.getElementById("edit-section") as HTMLDivElement;
const editPrompt = document.getElementById("edit-prompt") as HTMLInputElement;
const refineBtn = document.getElementById("refine-btn") as HTMLButtonElement;
const previewFrame = document.getElementById(
  "preview-frame"
) as HTMLIFrameElement;
const loader = document.getElementById("loader") as HTMLDivElement;
const publishSection = document.getElementById(
  "publish-section"
) as HTMLDivElement;
const actionsFooter = document.getElementById(
  "actions-footer"
) as HTMLDivElement;
const downloadBtn = document.getElementById(
  "download-btn"
) as HTMLButtonElement;
const publishBtn = document.getElementById("publish-btn") as HTMLButtonElement;
const repoNameInput = document.getElementById("repo-name") as HTMLInputElement;
const repoDescriptionInput = document.getElementById(
  "repo-description"
) as HTMLInputElement;
const publishResult = document.getElementById(
  "publish-result"
) as HTMLDivElement;
const repoLink = document.getElementById("repo-link") as HTMLAnchorElement;
const liveSiteLink = document.getElementById(
  "live-site-link"
) as HTMLAnchorElement;
const qrCodeImg = document.getElementById("qr-code-img") as HTMLImageElement;
const downloadQrBtn = document.getElementById(
  "download-qr-btn"
) as HTMLButtonElement;
const toastContainer = document.getElementById(
  "toast-container"
) as HTMLDivElement;

// Helper functions
const showLoader = (message: string) => {
  loader.querySelector("p")!.textContent = message;
  loader.classList.remove("hidden");
};
const hideLoader = () => loader.classList.add("hidden");

const fileToBase64 = (
  file: File
): Promise<{ mimeType: string; data: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // result is "data:mime/type;base64,..."
      const parts = result.split(",");
      const mimeType = parts[0].split(":")[1].split(";")[0];
      const data = parts[1];
      resolve({ mimeType, data });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const updatePreview = (html: string) => {
  currentHtml = html;
  previewFrame.srcdoc = html;
  editSection.classList.remove("hidden");
  publishSection.classList.remove("hidden");
  actionsFooter.classList.remove("hidden");
};

const parseHtmlFromResponse = (responseText: string): string => {
  const match = responseText.match(/```html\n([\s\S]*?)\n```/);
  if (match) {
    return match[1].trim();
  }
  // Fallback if the model doesn't use markdown or uses a different format
  if (responseText.trim().startsWith("<!DOCTYPE html>")) {
    return responseText.trim();
  }
  return responseText;
};

const showToast = (
  message: string,
  type: "error" | "info" = "error",
  duration: number = 3000
) => {
  const toast = document.createElement("div");
  toast.classList.add("toast", type);
  toast.innerText = message;
  toastContainer.appendChild(toast);

  // Trigger slide-in animation
  setTimeout(() => {
    toast.classList.add("show");
  }, 100);

  // Remove after duration
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 300); // Wait for transition to finish
  }, duration);
};

// Main logic
try {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Event Listeners
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    if (e.dataTransfer?.files?.length) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  imageUpload.addEventListener("change", (e) => {
    const target = e.target as HTMLInputElement;
    if (target.files?.length) {
      handleFile(target.files[0]);
    }
  });

  generateBtn.addEventListener("click", async () => {
    if (!uploadedImage) {
      showToast("Please upload an image first.");
      return;
    }

    showLoader("Weaving your website...");
    generateBtn.disabled = true;

    try {
      const logoUrl = logoUrlPrompt.value.trim();
      let prompt =
        "You are an expert web developer. Create a single-page responsive HTML file with inline CSS based on the content and layout of this image. The HTML should be self-contained in a single file. Do not include any external scripts or stylesheets. Ensure the generated code is clean, modern, and accessible. Extract any text from the image and use it in the HTML.";
      if (logoUrl) {
        prompt += ` If the image contains a logo, use this URL for the logo's src attribute: ${logoUrl}.`;
      }
      prompt +=
        " Respond ONLY with the HTML code inside a single markdown code block.";

      const textPart = { text: prompt };
      const imagePart = {
        inlineData: {
          mimeType: uploadedImage.mimeType,
          data: uploadedImage.data,
        },
      };

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [textPart, imagePart] },
      });

      const html = parseHtmlFromResponse(response.text);
      updatePreview(html);

      // Initialize chat for refinements
      chat = ai.chats.create({
        model: "gemini-2.5-flash",
        history: [
          {
            role: "user",
            parts: [textPart, imagePart],
          },
          {
            role: "model",
            parts: [{ text: `\`\`\`html\n${html}\n\`\`\`` }],
          },
        ],
      });
    } catch (error) {
      console.error(error);
      showToast(
        "Failed to generate website. Please check the console for details."
      );
    } finally {
      hideLoader();
      generateBtn.disabled = false;
    }
  });

  refineBtn.addEventListener("click", async () => {
    const prompt = editPrompt.value.trim();
    if (!prompt) {
      showToast("Please enter a refinement prompt.");
      return;
    }
    if (!chat) {
      showToast("Please generate a website first.");
      return;
    }

    showLoader("Refining your design...");
    refineBtn.disabled = true;
    editPrompt.disabled = true;

    try {
      const fullPrompt = `You are an expert web developer. The user wants to modify the existing HTML code. Apply this change: "${prompt}". Return the complete, updated HTML code. Respond ONLY with the HTML code inside a single markdown code block.`;

      const response = await chat.sendMessage({ message: fullPrompt });

      const html = parseHtmlFromResponse(response.text);
      updatePreview(html);
      editPrompt.value = ""; // Clear input
    } catch (error) {
      console.error(error);
      showToast(
        "Failed to refine website. Please check the console for details."
      );
    } finally {
      hideLoader();
      refineBtn.disabled = false;
      editPrompt.disabled = false;
    }
  });

  editPrompt.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      refineBtn.click();
    }
  });

  downloadBtn.addEventListener("click", () => {
    if (!currentHtml) {
      showToast("No website to download.");
      return;
    }
    const blob = new Blob([currentHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "index.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  publishBtn.addEventListener("click", async () => {
    const repo = repoNameInput.value.trim();
    const description =
      repoDescriptionInput.value.trim() || "Website generated by InstaWeb QR";
    const token = process.env.GITHUB_TOKEN;

    if (!repo) {
      showToast("Please provide a name for the new repository.");
      return;
    }
    if (!currentHtml) {
      showToast("No website content to publish.");
      return;
    }
    if (!token) {
      publishResult.innerHTML = `
                <h3 style="color: #E53935;">Error Publishing</h3>
                <p>GitHub Personal Access Token is not configured. Please set GITHUB_TOKEN in your .env.local file.</p>
            `;
      publishResult.classList.remove("hidden");
      return;
    }

    showLoader("Publishing to GitHub...");
    publishBtn.disabled = true;
    downloadBtn.disabled = true;

    try {
      // 1. Get User Info
      showLoader("Authenticating...");
      const userResponse = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!userResponse.ok)
        throw new Error(
          `GitHub authentication failed: ${await userResponse.text()}`
        );
      const userData = await userResponse.json();
      const owner = userData.login;

      // 2. Create Repository
      showLoader("Creating repository...");
      const repoResponse = await fetch("https://api.github.com/user/repos", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: repo, description }),
      });
      if (repoResponse.status !== 201)
        throw new Error(
          `Failed to create repository: ${await repoResponse.text()}`
        );
      const repoData = await repoResponse.json();
      const repoUrl = repoData.html_url;
      const actualRepoName = repoData.name; // Use the exact name returned by the API

      // 3. Commit file using the Contents API
      showLoader("Uploading file...");
      const mainBranch = repoData.default_branch;

      await fetch(
        `https://api.github.com/repos/${owner}/${actualRepoName}/contents/index.html`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: "Initial commit: Add index.html",
            content: btoa(unescape(encodeURIComponent(currentHtml))), // Base64 encode the content
            branch: mainBranch,
          }),
        }
      );

      // 4. Enable GitHub Pages
      showLoader("Enabling GitHub Pages...");
      const pagesResponse = await fetch(
        `https://api.github.com/repos/${owner}/${actualRepoName}/pages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.switcheroo-preview+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ source: { branch: mainBranch, path: "/" } }),
        }
      );
      if (!pagesResponse.ok)
        throw new Error(
          `Failed to enable GitHub Pages: ${await pagesResponse.text()}`
        );
      const pagesData = await pagesResponse.json();
      const liveUrl = pagesData.html_url;

      // 5. Show results with polling
      showLoader("Almost there...");
      repoLink.href = repoUrl;
      liveSiteLink.href = liveUrl;
      qrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
        liveUrl
      )}`;

      const liveSiteLinkContainer = liveSiteLink.parentElement!;
      const statusIndicator = document.createElement("span");
      statusIndicator.style.marginLeft = "10px";
      liveSiteLinkContainer.appendChild(statusIndicator);

      let attempts = 0;
      const maxAttempts = 30;

      const checkStatus = async () => {
        if (attempts >= maxAttempts) {
          statusIndicator.textContent = "Deployment timed out.";
          statusIndicator.style.color = "#FFC107";
          hideLoader();
          return;
        }
        try {
          const response = await fetch(liveUrl, {
            method: "HEAD",
            mode: "no-cors",
          });
          statusIndicator.textContent = "Live!";
          statusIndicator.style.color = "#4CAF50";
          hideLoader();
          publishResult.classList.remove("hidden");
        } catch (error) {
          attempts++;
          statusIndicator.textContent = `Deploying... (attempt ${attempts})`;
          setTimeout(checkStatus, 10000);
        }
      };
      hideLoader();
      publishResult.classList.remove("hidden");
      setTimeout(checkStatus, 5000);
    } catch (error) {
      publishResult.innerHTML = `
                <h3 style="color: #E53935;">Error Publishing</h3>
                <p>${(error as Error).message}</p>
            `;
      publishResult.classList.remove("hidden");
    } finally {
      hideLoader();
      publishBtn.disabled = false;
      downloadBtn.disabled = false;
    }
  });

  downloadQrBtn.addEventListener("click", async () => {
    if (!qrCodeImg.src) return;
    try {
      const response = await fetch(qrCodeImg.src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "website-qr-code.png";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download QR code", error);
      showToast("Could not download the QR code.");
    }
  });

  // File handling function
  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Please upload an image file.");
      return;
    }

    try {
      uploadedImage = await fileToBase64(file);
      imagePreview.src = `data:${uploadedImage.mimeType};base64,${uploadedImage.data}`;
      imagePreview.classList.remove("hidden");
      uploadPrompt.classList.add("hidden");
      generateBtn.disabled = false;
    } catch (error) {
      console.error("Error reading file:", error);
      showToast("Failed to read the image file.");
    }
  };
} catch (error) {
  document.body.innerHTML = `<div style="color: red; padding: 20px; font-family: sans-serif;">
        <h2>Error Initializing Application</h2>
        <p>Could not initialize the Gemini AI client. Please ensure your API key is set correctly in the environment variables.</p>
        <pre style="white-space: pre-wrap; word-break: break-all;">${
          (error as Error).message
        }</pre>
    </div>`;
  console.error(error);
}
document.addEventListener('DOMContentLoaded', () => {
  const genBtn = document.getElementById('generate-btn') as HTMLButtonElement | null;
  const previewFrame = document.getElementById('preview-frame') as HTMLIFrameElement | null;
  const loader = document.getElementById('loader');

  function startUIProcessing() {
    if (genBtn) genBtn.disabled = true;
    if (loader) loader.classList.remove('hidden');
  }
  function stopUIProcessing() {
    if (genBtn) genBtn.disabled = false;
    if (loader) loader.classList.add('hidden');
  }

  if (genBtn) {
    genBtn.addEventListener('click', () => {
      startUIProcessing();

      const hideOnIframe = () => {
        stopUIProcessing();
        if (previewFrame) previewFrame.removeEventListener('load', hideOnIframe);
      };

      if (previewFrame) {
        previewFrame.addEventListener('load', hideOnIframe);
      }

      // fallback safety
      setTimeout(() => {
        stopUIProcessing();
      }, 15000);
    });
  }
});
