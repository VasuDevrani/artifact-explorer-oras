const reg = document.querySelector(".artifactInputForm #registry input");
const repo = document.querySelector(".artifactInputForm #repository input");
const tag = document.querySelector(".artifactInputForm #digestortag input");
const artifact = document.querySelector("#content_area");
const rows = document.querySelectorAll("#table_digest");

async function displayArtifactContents() {
  try {
    document
      .getElementById("content_area")
      .scrollIntoView({ behavior: "smooth" });

    // rsb.isManifestPrepared = false;
    rsb.isReferrersPrepared = false;
    alterRightSide("manifestBlock");
  } catch (error) {
    console.error(error);
  }
}

function onSubmit(currentPage) {
  if (!reg.value || !repo.value || !tag.value) return;
  if (currentPage === "home") {
    window.location.href = `/artifact?image=${reg.value}/${repo.value}${
      tag.value.includes("sha256:") ? "@" : ":"
    }${tag.value}`;
  } else if (currentPage === "artifact") {
    artifact.classList.remove("hide");
    artifact.classList.add("show");
    rsb.isManifestPrepared = false;
    const artifactUrl = `?image=${reg.value}/${repo.value}${
      tag.value.includes("sha256:") ? "@" : ":"
    }${tag.value}`;
    window.history.pushState(
      {
        page: currentPage,
        artifactUrl: artifactUrl,
      },
      "",
      artifactUrl
    );
    displayArtifactContents();
  }
}

// handlePasteOfArtifactReference
reg.addEventListener("paste", (event) => handlePastedString(event, "1"));
repo.addEventListener("paste", (event) => handlePastedString(event, "2"));
tag.addEventListener("paste", (event) => handlePastedString(event, "3"));

function handlePastedString(event, id) {
  const pastedText = event.clipboardData.getData("text/plain");
  const regex = /^(.+?)\/(.+?)(?::([^@]+))?(@(.+))?$/;
  const matches = pastedText.match(regex);

  if (matches) {
    const registry = matches[1] || "";
    const repository = matches[2] || "";
    let tagOrDigest = matches[3] || matches[5] || "";

    if (!matches[3] && !matches[5]) tagOrDigest = "latest";

    reg.value = registry;
    repo.value = repository;
    tag.value = tagOrDigest;
  } else {
    if (id === "1") reg.value = pastedText;
    else if (id === "2") repo.value = pastedText;
    else tag.value = pastedText;
  }
  isRepoRegChanged = true;
  hideRegistryDropdown();
  fetchTagList();
  event.preventDefault(); // Prevent the default paste behavior
}

// list dropdown javascript
const regList = [
  {
    name: "docker.io",
    image: "./static/images/registryImages/image1.svg",
  },
  {
    name: "gcr.io",
    image: "./static/images/registryImages/image2.svg",
  },
  {
    name: "zot.io",
    image: "./static/images/registryImages/image4.svg",
  },
  {
    name: "ghcr.io",
    image: "./static/images/registryImages/image6.svg",
  },
  {
    name: "mcr.microsoft.com",
    image: "./static/images/registryImages/image7.png",
  },
];
const regDropdown = document.querySelector(
  ".artifactInputForm .registryDropdown"
);
function hideRegistryDropdown() {
  regDropdown.classList.remove("show");
  regDropdown.classList.add("hide");
}
function showRegList() {
  regDropdown.classList.remove("hide");
  regDropdown.classList.add("show");
  let listItems = "";
  regList.map(
    (item) =>
      (listItems += `<div data-name="${item.name}" class="items">
      <img src="${item.image}" />
      <p>${item.name}</p>
    </div>`)
  );
  regDropdown.innerHTML = listItems;
  document
    .querySelectorAll(".artifactInputForm .registryDropdown .items")
    ?.forEach((regElement) =>
      regElement.addEventListener("click", () => {
        reg.value = regElement.getAttribute("data-name");
        hideRegistryDropdown();
      })
    );
}
// ends

// enable keyboard interaction in dropdown
let activeRegItemIndex = -1;
let activeTagItemIndex = -1;
let activeRepoItemIndex = -1;

function resetItemIndex() {
  activeRegItemIndex = -1;
  activeTagItemIndex = -1;
  activeRepoItemIndex = -1;
}

function setActiveItem(dropdown, index, selector) {
  const items = dropdown.querySelectorAll(selector);
  items.forEach((item, i) => {
    item.classList.toggle("active", i === index);
  });

  // Set the value based on the active index
  const activeItem = dropdown.querySelector(".active");
  switch (selector) {
    case ".items":
      reg.value = activeItem?.textContent?.trim();
      break;
    case ".tagListItem":
      tag.value = activeItem?.textContent?.trim();
      break;
    case ".repoListItem":
      repo.value = activeItem?.textContent?.trim();
      break;
    default:
      break;
  }
}

// function to handle the scrolling behavior for a specific dropdown
function handleDropdownScroll(
  dropdown,
  event,
  itemsSelector,
  activeIndex,
  setActiveIndex
) {
  if (dropdown.classList.contains("show")) {
    const items = dropdown.querySelectorAll(itemsSelector);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      activeIndex = (activeIndex + 1) % items.length;
      setActiveIndex(activeIndex);
      scrollToSelectedItem(dropdown, activeIndex, itemsSelector);
      setActiveItem(dropdown, activeIndex, itemsSelector);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      activeIndex = (activeIndex - 1 + items.length) % items.length;
      setActiveIndex(activeIndex);
      scrollToSelectedItem(dropdown, activeIndex, itemsSelector);
      setActiveItem(dropdown, activeIndex, itemsSelector);
    } else if (event.key === "Enter") {
      event.preventDefault();
      setActiveItem(dropdown, activeIndex, itemsSelector);
    }
  }
}

function scrollToSelectedItem(dropdown, index, selector) {
  const items = dropdown.querySelectorAll(selector);
  if (index >= 0 && index < items.length) {
    items[index].scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }
}

document.addEventListener("keydown", (event) => {
  handleDropdownScroll(
    regDropdown,
    event,
    ".items",
    activeRegItemIndex,
    (index) => {
      activeRegItemIndex = index;
    }
  );
  handleDropdownScroll(
    tagListDropdown,
    event,
    ".tagListItem",
    activeTagItemIndex,
    (index) => {
      activeTagItemIndex = index;
    }
  );
  handleDropdownScroll(
    repoDropdown,
    event,
    ".repoListItem",
    activeRepoItemIndex,
    (index) => {
      activeRepoItemIndex = index;
    }
  );
});

// list javascript
const tagListDropdown = document.querySelector(
  ".artifactInputForm .tagListDropdown"
);
const repoDropdown = document.querySelector(".artifactInputForm .repoDropdown");

let tagList = [];
let repoList = [];
let isRepoRegChanged = false;

function fetchTagList() {
  return new Promise((resolve, reject) => {
    tagListDropdown.innerHTML =
      '<div class="skeletonLoader"></div> <div class="skeletonLoader"></div><div class="skeletonLoader"></div>';
    const URL = `/api/tags?registry=${reg.value}/&name=${repo.value}`;
    fetch(URL)
      .then((res) => res.json())
      .then((data) => {
        tagList = data;
        updateTagList();
        resolve();
      })
      .catch((err) => {
        tagListDropdown.innerHTML = `
          <div class="error">
            <img src="./static/images/crossIcon.svg"/>
            <div>Failed to fetch tags</div>
          </div>
        `;
        reject(err);
      });
  });
}

function updateTagList() {
  const filterList = tagList.filter((item) => item.includes(tag.value || ""));
  if (!filterList.length) {
    tagListDropdown.innerHTML = `
    <div class="info">
      <img src="./static/images/infoIcon.svg"/>
      <div>No match found</div>
    </div>
    `;
    return;
  }
  let html = "";
  filterList.map((item) => (html += `<p class="tagListItem">${item}</p>`));

  tagListDropdown.innerHTML = html;
  isRepoRegChanged = false;
  document
    .querySelectorAll(".artifactInputForm .tagListDropdown p")
    ?.forEach((tagElement) =>
      tagElement.addEventListener("click", () => {
        tag.value = tagElement.innerHTML;
        tagListDropdown.classList.remove("show");
        tagListDropdown.classList.add("hide");
        updateTagList();
      })
    );
  resetItemIndex();
}

function fetchRepoList() {
  if (reg.value !== "mcr.microsoft.com") return;
  return new Promise((resolve, reject) => {
    repoDropdown.innerHTML =
      '<div class="skeletonLoader"></div> <div class="skeletonLoader"></div><div class="skeletonLoader"></div>';
    const URL = `/api/repos?registry=${reg.value}`;
    fetch(URL)
      .then((res) => res.json())
      .then((data) => {
        repoList = data;
        updateRepoList();
        resolve();
      })
      .catch((err) => {
        repoDropdown.innerHTML = `
          <div class="error">
            <img src="./static/images/crossIcon.svg"/>
            <div>Failed to fetch repositories</div>
          </div>
        `;
        reject(err);
      });
  });
}

function updateRepoList() {
  if (reg.value !== "mcr.microsoft.com") return;

  const filterList = repoList.filter((item) => item.includes(repo.value || ""));
  if (!filterList.length) {
    repoDropdown.innerHTML = `
    <div class="info">
      <img src="./static/images/infoIcon.svg"/>
      <div>No match found</div>
    </div>
    `;
    return;
  }
  let html = "";
  filterList.map((item) => (html += `<p class="repoListItem">${item}</p>`));

  repoDropdown.innerHTML = html;
  document
    .querySelectorAll(".artifactInputForm .repoDropdown p")
    ?.forEach((repoElement) =>
      repoElement.addEventListener("click", () => {
        repo.value = repoElement.innerHTML;
        repoDropdown.classList.remove("show");
        repoDropdown.classList.add("hide");
        updateRepoList();
      })
    );
  resetItemIndex();
}

function listTags() {
  if (!repo.value || !reg.value) return;
  tagListDropdown.classList.remove("hide");
  tagListDropdown.classList.add("show");
  if (!tagList.length || isRepoRegChanged) {
    fetchTagList();
  } else {
    updateTagList();
  }
}

function listRepos() {
  if (!reg.value || reg.value !== "mcr.microsoft.com") return;
  repoDropdown.classList.remove("hide");
  repoDropdown.classList.add("show");
  if (!repoList.length) {
    fetchRepoList();
  } else {
    updateRepoList();
  }
}

repo.addEventListener("change", () => (isRepoRegChanged = true));
reg.addEventListener("change", () => (isRepoRegChanged = true));
// ends

// copyText
document.addEventListener("click", (event) => {
  const icon = event.target;

  if (icon.id === "copyIcon") {
    icon.src = "./static/images/tickIcon.svg";
    const dataValue = icon.dataset.value;

    const tempTextArea = document.createElement("textarea");
    tempTextArea.value = dataValue;
    tempTextArea.style.position = "fixed";
    tempTextArea.style.opacity = 0;
    document.body.appendChild(tempTextArea);

    tempTextArea.select();
    tempTextArea.setSelectionRange(0, 99999);
    document.execCommand("copy");

    document.body.removeChild(tempTextArea);
    setTimeout(() => {
      icon.src = "./static/images/copyIcon.svg";
    }, 500);
  }
});
// ends

// Sidebar Javascript
const sidebarItems = document.querySelectorAll(
  "#content_area .main .leftSideBar ul li"
);
const blobSidebarItem = document.querySelector("#blobSidebarItem");
const manifestSidebarItem = document.querySelector("#manifestSidebarItem");
const layersSidebarItem = document.querySelector("#layersSidebarItem");

sidebarItems.forEach((item) => {
  item.addEventListener("click", () => {
    sidebarItems.forEach((item) => item.classList.remove("active"));
    item.classList.add("active");
  });
});

function alterRightSide(contentId) {
  const contentBlocks = document.querySelectorAll(
    "#content_area .main .rightContent .contentBlock"
  );
  const selectedContent = document.querySelector(
    `#content_area .main .rightContent #${contentId}`
  );

  for (let i = 0; i < contentBlocks.length; i++) {
    contentBlocks[i].classList.remove("active");
  }
  selectedContent.classList.add("active");
  if (contentId === "manifestBlock" && !rsb.isManifestPrepared) {
    rsb.prepareManifestBlock();
  }
  if (contentId === "referrerBlock" && !rsb.isReferrersPrepared) {
    if (!reg.value || !repo.value || !tag.value) return;
    rsb.prepareReferrersBlock();
  }
}
// ends

// referrer Tree
const lightArr = ["lightgreen", "lightblue", "lightorange"];
function generateTree(treeData, ct) {
  if(!treeData.length) return "";
  let html = "";
  treeData.forEach((node, ind) => {
    const children = generateTree(node.nodes, ct + 1);
    html += `
      <li>
        <details open ${ct === 0 ? "class='pl-0'" : ""}>
          <summary ${children === "" ? "class='no-marker'" : ""}> 
          <div class="summary-content ${lightArr[ct % 3]}">
          <div>
          <div class="icon">
            <img src="./static/images/githubColor.svg">
          </div>
              <div class="text">
              <p>${
                node.ref.artifactType
                  ? node.ref.artifactType
                  : node.ref.mediaType
              }</p>
              <p>
              <a href="/artifact?image=${reg.value}/${repo.value}@${
      node.ref.digest
    }" target="_blank">${node.ref.digest}</a></p>
            </div>
            </div>
          </div>
          </summary> 
          ${children}
        </details>
      </li>
    `;
  });
  return `<ul ${ct === 0 ? "class='pl-0'" : ""}>${html}</ul>`;
}
// ends

// right side javascript
function switchView(contentId, elementId, headClass) {
  const contentHeads = document.querySelectorAll(`#${elementId} .header .view`);
  const selectedHead = document.querySelector(
    `#${elementId} .header .${headClass}`
  );
  const contentBlocks = document.querySelectorAll(`#${elementId} .view-item`);
  const selectedContent = document.querySelector(`#${elementId} #${contentId}`);
  for (let i = 0; i < contentBlocks.length; i++) {
    contentBlocks[i].classList.remove("active");
  }
  for (let i = 0; i < contentHeads.length; i++) {
    contentHeads[i].classList.remove("active");
  }
  selectedContent.classList.add("active");
  selectedHead.classList.add("active");
}

function downloadManifest() {
  const dwnBtn = document.querySelector("#manifestDownload");

  dwnBtn.textContent = "loading...";
  const jsonString = JSON.stringify(ar.Manifest, null, 2);

  const blob = new Blob([jsonString], { type: "application/json" });
  const downloadLink = document.createElement("a");
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = "manifests.json";

  document.body.appendChild(downloadLink);
  downloadLink.click();

  document.body.removeChild(downloadLink);
  dwnBtn.textContent = "DOWNLOAD";
}

function redirectByDigest(URL) {
  window.open(URL, "_blank");
}

function addHyperlinks() {
  const jsonContent = document.getElementById("manifestJson");
  const textNodes = jsonContent.childNodes;

  const regex = /"sha256:([a-f0-9]{64})"/g;
  const htmlContent = jsonContent.innerHTML;

  const updatedHtmlContent = htmlContent.replace(regex, (match) => {
    const mediaTypeSpan = getFollowingMediaType(textNodes, match);
    const mediaType = mediaTypeSpan
      ? mediaTypeSpan.textContent.trim().replace(/"/g, "")
      : "";
    const redirectURL = `/redirect?mediatype=${encodeURIComponent(
      mediaType
    )}&image=${reg.value}/${repo.value}@${match.replace(/"/g, "")}`;
    return `<span id="jsonDigest" onclick="redirectByDigest('${redirectURL}')">${match}</span>`;
  });
  jsonContent.innerHTML = updatedHtmlContent;
}

function getFollowingMediaType(nodes, textToFind) {
  let shouldFindMediaType = false;
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].textContent === textToFind) {
      shouldFindMediaType = true;
    } else if (shouldFindMediaType && nodes[i].className === "json-string") {
      return nodes[i];
    }
  }
  return null;
}

function blockTemplate(table, json, views) {
  return `
    <div id=${views.id}>
    <div class="header">
    <div class="ui tabular menu">
      ${
        json &&
        `<a class="item ${
          json && "active"
        } view bb" onclick='switchView("jsonV", "${views.id}","bb")'>
        JSON VIEW
      </a>`
      }
      <a class="item ${
        !json && "active"
      } view aa" onclick='switchView("table", "${views.id}", "aa")'>
        TABLE VIEW
      </a>
      ${
        views.id === "manifestTable"
          ? `<div class="item">
        <button onclick="downloadManifest()" id="manifestDownload">DOWNLOAD</button>
      </div>`
          : ""
      }
    </div>
    </div>
    ${json}
    ${table}
    </div>
  `;
}

function generateTable(tableData) {
  let records = "";
  const data = Array.isArray(tableData.data)
    ? tableData.data
    : [tableData.data];

  data.forEach((item) => {
    records += `
      <tr>
        <td colspan="4" id="mediaType">${item.mediaType}</td>
        <td>${item.size}</td>
        <td colspan="3" id="digest">
          <div id="digest">
            <a href="${tableData.isBlob ? "/blob?layer=" : "/artifact?image="}${
      reg.value
    }/${repo.value}@${item.digest}" target="_blank">
              ${item.digest}
            </a>
          </div>
          <img src="./static/images/copyIcon.svg" id="copyIcon" data-value="${
            item.digest
          }">
        </td>
      </tr>`;
  });

  const table = `
    <div id="table">
      <table class="ui fixed unstackable single line celled table">
        <thead>
          <tr>
            <th scope="col" colspan="4">Mediatype</th>
            <th scope="col">Size</th>
            <th scope="col" colspan="3">Digest</th>
          </tr>
        </thead>
        ${records}
      </table>
    </div>`;

  return table;
}

class RightSideBlock {
  contructor() {
    this.isManifestPrepared = false;
    this.isReferrersPrepared = false;
  }

  prepareMetaData() {
    let inp = document.querySelectorAll("#content_area .metaData .ui input");
    let copyIcons = document.querySelectorAll(
      "#content_area .metaData #copyIcon"
    );
    const fields = [
      { key: "Artifact", index: 0 },
      { key: "Digest", index: 1 },
      { key: "MediaType", index: 2 },
    ];

    fields.forEach((field) => {
      const value = ar[field.key] || "not available";
      inp[field.index].value = value;
      copyIcons[field.index].setAttribute("data-value", value);
    });
  }

  async prepareManifestBlock() {
    if (this.isManifestPrepared) return;
    const b1 = document.querySelector("#manifestBlock");
    const loader = document.querySelector(
      "#content_area .main .rightContent .loadingBlock"
    );
    b1.innerHTML = "";

    loader.classList.remove("spinner");
    loader.classList.add("loader");
    try {
      await ar.setContents({
        registry: `${reg.value}/`,
        repo: repo.value,
        tag: tag.value,
      });

      loader.classList.remove("loader");
      loader.classList.add("spinner");
      rsb.prepareMetaData();

      if (!ar.Manifest) {
        b1.innerHTML = `
        <div class="error">
          <img src="./static/images/crossIcon.svg"/>
          <div>Failed to fetch manifests</div>
        </div>`;
        rsb.isManifestPrepared = true;
      }

      const JSONview = `
        <div class="view-item active" id="jsonV">
          <pre id="manifestJson">
            ${prettyPrintJson.toHtml(ar.Manifest)}
          </pre>
        </div>
      `;

      const sections = [
        { title: "Manifests", data: ar.Manifests, isBlob: false },
        { title: "Layers", data: ar.Layers, isBlob: true },
        { title: "Config", data: ar.Configs, isBlob: true },
        {
          title: "Subject",
          data: ar.Subject.digest ? ar.Subject : null,
          isBlob: false,
        },
      ];

      let tableView = sections
        .filter((section) => section.data)
        .map(
          (section) => `
              <h1>${section.title}</h1>
              ${generateTable(section)}
          `
        )
        .join("");

      tableView = `<div class="view-item" id="table">${tableView}</div>`;

      b1.innerHTML += blockTemplate(tableView, JSONview, {
        id: "manifestTable",
      });

      const topBar = document.querySelectorAll(
        "#manifestTable .header .menu .view"
      );

      topBar?.forEach((item) => {
        item.addEventListener("click", () => {
          topBar?.forEach((item) => item.classList.remove("active"));
          item.classList.add("active");
        });
      });

      addHyperlinks();

      rsb.isManifestPrepared = true;
    } catch (err) {
      console.log(err);
      b1.innerHTML = `
        <div class="error">
          <img src="./static/images/crossIcon.svg"/>
          <div>Failed to fetch manifests</div>
        </div>`;
      rsb.isManifestPrepared = false;
    }
  }

  async prepareReferrersBlock() {
    if (this.isReferrersPrepared) return;

    const loader = document.querySelector(
      "#content_area .main .rightContent .loadingBlock"
    );
    const treeView = document.getElementById("referrerBlock");
    treeView.innerHTML = "";

    loader.classList.remove("spinner");
    loader.classList.add("loader");
    try {
      await ar.setReferrers({
        registry: reg.value,
        repo: repo.value,
        tag: tag.value,
      });
      loader.classList.remove("loader");
      loader.classList.add("spinner");

      if (!ar.Referrers.length) {
        treeView.innerHTML = `
        <div class="info">
          <img src="./static/images/infoIcon.svg"/>
          <div>No referrers available</div>
        </div>
        `;
        rsb.isReferrersPrepared = true;
        return;
      }
      const treeV = `
      <div id="treeV" class="view-item active">
        ${generateTree(ar.Referrers, 0)}
      </div>`;
      treeView.innerHTML = `
      <div id="referrers">
        <div class="header">
        <h1>Referrers</h1>
        <div class="ui tabular menu">
          <a class="item active view aa" onclick='switchView("treeV", "referrers", "aa")'>
            TREE VIEW
          </a>
        </div>
        </div>
        ${treeV}
      </div>
      `;
      var treeNodes = document.getElementsByClassName("tree-node");

      Array.from(treeNodes).forEach(function (node) {
        var content = node.querySelector(".tree-content");
        var children = node.querySelector(".tree-children");

        if (children) {
          content.addEventListener("click", function () {
            node.classList.toggle("collapsed");
            children.style.display = node.classList.contains("collapsed")
              ? "none"
              : "block";
          });
        }
      });
      rsb.isReferrersPrepared = true;
    } catch (err) {
      treeView.innerHTML = `
      <div class="error">
        <img src="./static/images/crossIcon.svg"/>
        <div>Failed to fetch referrers</div>
      </div>
      `;
      rsb.isReferrersPrepared = false;
    }
  }
}

let rsb = new RightSideBlock();
// ends

// artifact contents javascript
class Artifact {
  constructor() {
    this.Artifact = "";
    this.MediaType = "";
    this.Digest = "";
    this.Manifests = null;
    this.Configs = null;
    this.Layers = null;
    this.Subject = null;
    this.Referrers = null;
    this.Manifest = null;
  }

  async setContents(artifact) {
    try {
      const response = await fetch(
        `/api/artifact?registry=${artifact.registry}&name=${artifact.repo}&${
          tag.value.includes("sha256:") ? "digest" : "tag"
        }=${artifact.tag}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch manifest");
      }
      const data = await response.json();
      this.Artifact = data.Artifact;
      this.MediaType = data.MediaType;
      this.Configs = data.Configs;
      this.Manifests = data.Manifests;
      this.Layers = data.Layers;
      this.Digest = data.Digest;
      this.Subject = data.Subject;
      this.Manifest = data.Manifest;

      return null;
    } catch (err) {
      this.Artifact = "";
      this.MediaType = "";
      this.Digest = "";
      this.Manifests = null;
      this.Configs = null;
      this.Layers = null;
      this.Subject = null;
      this.Manifest = null;
      return err;
    }
  }

  async setReferrers(artifact) {
    try {
      const response = await fetch(
        `/api/referrers?registry=${artifact.registry}/&name=${artifact.repo}&${
          tag.value.includes("sha256:") ? "digest" : "tag"
        }=${artifact.tag}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch referrers");
      }

      const data = await response.json();
      this.Referrers = data;
      return null;
    } catch (err) {
      return err;
    }
  }
}

let ar = new Artifact();
// ends

// others
document.addEventListener("click", (event) => {
  const isOutsideTagList =
    tagListDropdown.contains(event.target) ||
    tag.contains(event.target) ||
    event.target.classList.contains("tagListItem");

  const isOutsideRegList =
    regDropdown.contains(event.target) ||
    reg.contains(event.target) ||
    event.target.classList.contains("regListItem");

  const isOutsideRepoList =
    repoDropdown.contains(event.target) ||
    repo.contains(event.target) ||
    event.target.classList.contains("repoListItem");

  if (!isOutsideRegList) {
    regDropdown.classList.remove("show");
    regDropdown.classList.add("hide");
  }
  if (!isOutsideTagList) {
    tagListDropdown.classList.remove("show");
    tagListDropdown.classList.add("hide");
  }
  if (!isOutsideRepoList) {
    repoDropdown.classList.remove("show");
    repoDropdown.classList.add("hide");
  }
});

function handleNavigation() {
  const pathname = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  const image = searchParams.get("image");

  if (pathname.includes("/artifact") && image) {
    const regex = /^(.+?)\/(.+?)(?::|@)(.+)$/;
    const matches = image.match(regex);

    reg.value = matches[1];
    repo.value = matches[2];
    tag.value = matches[3];

    artifact.classList.remove("hide");
    artifact.classList.add("show");

    rsb.isManifestPrepared = false;
    try {
      fetchTagList();
      displayArtifactContents();
    } catch (error) {
      console.error(error);
    }
  }
}

window.addEventListener("popstate", function (event) {
  handleNavigation();
});

document.addEventListener("DOMContentLoaded", async function () {
  const pathname = window.location.pathname;
  const image = new URLSearchParams(window.location.search).get("image");

  if (!pathname.substring(pathname.lastIndexOf("/") + 1) || !image) return;
  const regex = /^(.+?)\/(.+?)(?::|@)(.+)$/;
  const matches = image.match(regex);

  reg.value = `${matches[1]}`;
  repo.value = matches[2];
  tag.value = matches[3];

  artifact.classList.remove("hide");
  artifact.classList.add("show");

  rsb.isManifestPrepared = false;
  try {
    await fetchTagList();
    await displayArtifactContents();
  } catch (error) {
    console.error(error);
  }
});
// ends
