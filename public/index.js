// Aliases for frequently used functions
const $ = document.querySelector.bind(document);
const createEl = document.createElement.bind(document);
const removeEl = (element) => element.remove();
const addClass = (element, className) => element.classList.add(className);
const removeClass = (element, className) => element.classList.remove(className);
const setStyle = (element, property, value) => {
  if (element) {
    element.style[property] = value;
  }
};
const setText = (element, text) => {
  if (element) {
    element.textContent = text;
  }
};
const setHTML = (element, html) => {
  if (element) {
    element.textContent = html;
  }
};
const addEvent = (element, event, handler) =>
  element.addEventListener(event, handler);
const formatDate = (date) => new Date(date).toLocaleString();

// DOM Elements
const elements = {
  uploadInput: $("#hidden-upload"),
  adminPasswordInput: $("#admin-password"),
  passwordInput: $("#password"),
  errorDiv: $("#error-div"),
  errorTitle: $("#error-title"),
  errorMessage: $("#error-message"),
  dropzone: $("#dropzone"),
  textnode: $("#textnode"),
  uploadResponseContainer: $("#upload-response-container"),
  filesResponseContainer: $("#files-response-container"),
  displayFilesButton: $("#display-files"),
  uploadProgressContainer: $("#upload-progress-container"),
  progressList: $(".progress-list"),
  shortUrlButton: $("#short-url-button"),
  shortUrlInput: $("#short-url"),
  fullUrlInput: $("#full-url"),
};

// Constants
const API = {
  BASE_URL: window.location.origin,
  ENDPOINTS: {
    UPLOAD: "/api/upload",
    LIST: "/api/list",
    SHORT_URL: "/api/shorten",
  },
};

// Error handling
function showError(title, message) {
  setStyle(elements.errorDiv, "display", title ? "block" : "none");
  elements.errorDiv.hidden = false;
  if (title) {
    setText(elements.errorTitle, title);
    if (message) setText(elements.errorMessage, message);
  }
}

function formatUrl(url, short = false, deletionUrl = false) {
  return `${API.BASE_URL}/${short && !deletionUrl ? "u/" : ""}${deletionUrl ? `api/delete-${short ? "url/" : "file/"}` : ""}${url.split("/").pop()}`;
}

// File handling
function appendFile(containerId, file, short = false) {
  const container = $(`#${containerId}`);
  const item = createEl("div");
  addClass(item, "item");

  const content = createEl("div");
  addClass(content, "content");

  const link = createEl("a");
  link.href = formatUrl(file.url || file.name, short);
  link.textContent = short
    ? formatUrl(file.url || file.name, short)
    : file.name;
  link.target = "_blank";

  const sub = createEl("div");
  addClass(sub, "sub");
  sub.textContent = `${file.size ? file.size + " " : ""}${file.views !== undefined ? `${file.views} views ` : ""}(${formatDate(file.date)})`;

  content.appendChild(link);
  content.appendChild(sub);
  item.appendChild(content);

  const rightContent = createEl("div");
  addClass(rightContent, "right");
  addClass(rightContent, "floated");
  addClass(rightContent, "content");

  const copyButton = createEl("button");
  addClass(copyButton, "button");
  addClass(copyButton, "inverted");
  copyButton.textContent = "Copy URL";
  copyButton.onclick = () =>
    navigator.clipboard.writeText(formatUrl(file.url || file.name, short));

  rightContent.appendChild(copyButton);

  if (file.deletionUrl) {
    const deleteButton = createEl("button");
    addClass(copyButton, "button");
    addClass(copyButton, "inverted");
    deleteButton.textContent = "Copy Deletion URL";
    deleteButton.onclick = () =>
      navigator.clipboard.writeText(formatUrl(file.deletionUrl, short, true));
    rightContent.appendChild(deleteButton);
  }

  item.appendChild(rightContent);
  container.insertBefore(item, container.firstChild);
}

// API calls
function createProgressElement(file) {
  const progressItem = createEl("div");
  addClass(progressItem, "progress-item");

  const fileInfo = createEl("div");
  addClass(fileInfo, "file-info");

  const fileName = createEl("div");
  addClass(fileName, "file-name");
  fileName.textContent = file.name;

  const fileSize = createEl("div");
  addClass(fileSize, "file-size");
  fileSize.textContent = formatSize(file.size);

  fileInfo.appendChild(fileName);
  fileInfo.appendChild(fileSize);

  const progressBar = createEl("div");
  addClass(progressBar, "progress-bar");

  const progressFill = createEl("div");
  addClass(progressFill, "progress-fill");

  progressBar.appendChild(progressFill);

  const progressText = createEl("div");
  addClass(progressText, "progress-text");
  progressText.textContent = "0%";

  progressItem.appendChild(fileInfo);
  progressItem.appendChild(progressBar);
  progressItem.appendChild(progressText);

  return progressItem;
}

function upload(file, password) {
  const xhr = new XMLHttpRequest();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("password", password);

  const progressItem = createProgressElement(file);
  const progressFill = progressItem.querySelector(".progress-fill");
  const progressText = progressItem.querySelector(".progress-text");
  elements.progressList.insertBefore(
    progressItem,
    elements.progressList.firstChild
  );
  elements.uploadProgressContainer.hidden = false;

  addEvent(xhr.upload, "progress", (event) => {
    if (event.lengthComputable) {
      const percentComplete = (event.loaded / event.total) * 100;
      setStyle(progressFill, "width", `${percentComplete}%`);
      setText(progressText, `${Math.round(percentComplete)}%`);
    }
  });

  addEvent(xhr, "load", () => {
    showError();

    if (xhr.status === 200) {
      const data = JSON.parse(xhr.responseText);
      appendFile("upload-response-container", data);
      elements.uploadResponseContainer.hidden = false;
      removeEl(progressItem);
      if (elements.progressList.children.length === 0) {
        elements.uploadProgressContainer.hidden = true;
      }
    } else if (xhr.status === 401) {
      showError("Unauthorized", "The password you entered was invalid.");
      removeEl(progressItem);
      if (elements.progressList.children.length === 0) {
        elements.uploadProgressContainer.hidden = true;
      }
    } else {
      const data = JSON.parse(xhr.responseText);
      showError(`Error ${xhr.status}`, data.error || "Unknown Error");
      removeEl(progressItem);
      if (elements.progressList.children.length === 0) {
        elements.uploadProgressContainer.hidden = true;
      }
    }
  });

  addEvent(xhr, "error", () => {
    showError("Upload Error", "Failed to upload file");
    removeEl(progressItem);
    if (elements.progressList.children.length === 0) {
      elements.uploadProgressContainer.hidden = true;
    }
  });

  xhr.open("POST", API.ENDPOINTS.UPLOAD);
  xhr.setRequestHeader("x-file-name", encodeURIComponent(file.name));
  xhr.send(formData);
}

// Helper function for formatting file size
function formatSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

async function getFiles() {
  const password = elements.adminPasswordInput.value || "invalid";
  setHTML(elements.filesResponseContainer, "");

  try {
    const response = await fetch(`${API.ENDPOINTS.LIST}`, {
      headers: {
        "x-admin-password": password,
      },
    });
    showError();

    if (response.status === 200) {
      const list = await response.json();
      if (Array.isArray(list.files)) {
        list.files
          .sort((a, b) => a.date - b.date)
          .forEach((file) => appendFile("files-response-container", file));
      }
    } else if (response.status === 401) {
      showError("Unauthorized", "The admin password you entered was invalid.");
    } else {
      showError(
        `Error ${response.status}`,
        "An error occurred while trying to get the files."
      );
    }
  } catch {
    showError("Fetch Error", "Failed to fetch files");
  }
}

// Upload handling
function handleUpload() {
  const files = elements.uploadInput.files;
  const password = elements.passwordInput.value;

  Array.from(files).forEach((file) => upload(file, password));
  elements.uploadInput.value = "";
}

async function handleShortUrl() {
  const shortUrl = elements.shortUrlInput.value;
  const fullUrl = elements.fullUrlInput.value;
  const password = elements.passwordInput.value;
  const formData = new FormData();
  if (shortUrl) formData.append("short", shortUrl);
  formData.append("url", fullUrl);
  formData.append("password", password);
  const res = await fetch(API.BASE_URL + API.ENDPOINTS.SHORT_URL, {
    method: "POST",
    body: formData,
  });
  if (res.status !== 200) {
    showError("Failed to shorten URL", JSON.stringify(await res.json()));
    return;
  }
  const data = await res.json();
  appendFile("short-url-container", data, true);
}

// Drag and drop handling
let lastTarget = null;

function isFile(e) {
  return e.dataTransfer.types.includes("Files");
}

function showDropzone() {
  addClass(elements.dropzone, "visible");
  setStyle(elements.textnode, "fontSize", "48px");
}

function hideDropzone() {
  removeClass(elements.dropzone, "visible");
  setStyle(elements.textnode, "fontSize", "42px");
}

// Event Listeners
addEvent(window, "dragenter", (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (isFile(e)) {
    lastTarget = e.target;
    showDropzone();
  }
});

addEvent(window, "dragleave", (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (e.target === lastTarget || e.target === document) {
    hideDropzone();
  }
});

addEvent(window, "dragover", (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (isFile(e)) {
    showDropzone();
  }
});

addEvent(window, "drop", (e) => {
  e.preventDefault();
  e.stopPropagation();
  hideDropzone();

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    elements.uploadInput.files = files;
    handleUpload();
  }
});

addEvent(elements.uploadInput, "change", handleUpload);
addEvent(elements.displayFilesButton, "click", getFiles);
addEvent(elements.shortUrlButton, "click", handleShortUrl);
// ShareX config download
function dlcfg() {
  const p = elements.passwordInput.value;
  if (!p)
    return alert(
      "Please enter the upload password before downloading the ShareX config."
    );
  const a = createEl("a");
  const b = new Blob(
    [
      JSON.stringify({
        Version: "13.7.0",
        Name: `bun-file-server [${API.BASE_URL}]`,
        DestinationType: "ImageUploader, FileUploader",
        RequestMethod: "POST",
        RequestURL: `${API.BASE_URL}/upload`,
        Body: "MultipartFormData",
        Arguments: { password: p },
        FileFormName: "file",
        URL: "$json:url$",
        DeletionURL: "$json:deletionUrl$",
        ErrorMessage: "$json:error$",
      }),
    ],
    { type: "text/plain" }
  );
  a.href = URL.createObjectURL(b);
  a.download = "bun-file-server.sxcu";
  a.click();
}
