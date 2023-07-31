const reg = document.querySelector(".artifactInputForm #registry input");
const repo = document.querySelector(".artifactInputForm #repository input");
const tag = document.querySelector(".artifactInputForm #digestortag input");
const artifact = document.querySelector("#content_area");
const rows = document.querySelectorAll("#table_digest");

// function calls
async function displayArtifactContents() {
  try {
    document
      .getElementById("content_area")
      .scrollIntoView({ behavior: "smooth" });

    // rsb.isManifestPrepared = false;
    rsb.isReferrersPrepared = false;
    rsb.isBlobsPrepared = false;
    alterRightSide("manifestBlock");
  } catch (error) {
    console.error(error);
  }
}

function onSubmit(currentPage) {
  if (!reg.value || !repo.value || !tag.value) return;
  if (currentPage === "home") {
    window.location.href = `/artifact?image=${reg.value}/${repo.value}${
      !tagList || !tagList.includes(tag.value) ? "@" : ":"
    }${tag.value}`;
  } else if (currentPage === "artifact") {
    artifact.classList.remove("hide");
    artifact.classList.add("show");
    rsb.isManifestPrepared = false;
    const artifactUrl = `?image=${reg.value}/${repo.value}${
      (!tagList || !tagList.includes(tag.value)) && tag.value !== "latest"
        ? "@"
        : ":"
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
// ends

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
  updateRegList();
  fetchTagList();
  event.preventDefault(); // Prevent the default paste behavior
}

// registry list dropdown javascript
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
];
const regDropdown = document.querySelector(
  ".artifactInputForm .registryDropdown"
);

function showRegList() {
  regDropdown.classList.remove("hide");
  regDropdown.classList.add("show");
  updateRegList();
}

function updateRegList() {
  const filterList = regList.filter((item) =>
    item?.name.includes(reg.value || "")
  );
  if (!filterList.length) {
    regDropdown.innerHTML = `<div class="info">
    <img src="./static/images/infoIcon.svg"/>
    <div>No match found</div>
  </div>`;
    return;
  }
  let listItems = "";
  filterList.map(
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
        updateRegList();
      })
    );
}
// ends

// tag list javascript
const tagListDropdown = document.querySelector(
  ".artifactInputForm .tagListDropdown"
);

let tagList = [];
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
    rsb.prepareManifestsBlock();
  }
  if (contentId === "layersBlock" && !rsb.isManifestPrepared) {
    rsb.prepareManifestsBlock();
  }
  if (contentId === "referrerBlock" && !rsb.isReferrersPrepared) {
    if (!reg.value || !repo.value || !tag.value) return;
    rsb.prepareReferrersBlock();
  }
  if (contentId === "blobBlock" && !rsb.isBlobsPrepared) {
    rsb.prepareBlobsBlock();
  }
}
// ends

// referrer Tree
function generateTree(treeData) {
  let html = "";
  treeData.forEach((node) => {
    html += `
      <li>
        <details>
          <summary> <img src="./static/images/githubColor.svg"/>${
            node.ref.artifactType
          }</summary>
          <ul>
            <li id="digest"><a href="/artifact?image=${reg.value}/${
      repo.value
    }@${node.ref.digest}" target="_blank">${node.ref.digest}</a></li>
            ${node.nodes && generateTree(node.nodes)}
          </ul>
        </details>
      </li>
    `;
  });
  return html;
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
  const jsonString = JSON.stringify(
    {
      artifact: ar.Artifact,
      digest: ar.Digest,
      manifest: [...ar.Manifests],
    },
    null,
    2
  );

  const blob = new Blob([jsonString], { type: "application/json" });
  const downloadLink = document.createElement("a");
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = "manifests.json";

  document.body.appendChild(downloadLink);
  downloadLink.click();

  document.body.removeChild(downloadLink);
  dwnBtn.textContent = "DOWNLOAD";
}

function blockTemplate(title, table, json, views) {
  return `
    <div id=${views.id}>
    <div class="header">
    <h1>${title}</h1>
    <div class="ui tabular menu">
      <a class="item active view aa" onclick='switchView("table", "${
        views.id
      }", "aa")'>
        TABLE VIEW
      </a>
      ${
        json &&
        `<a class="item view bb" onclick='switchView("jsonV", "${views.id}","bb")'>
        JSON VIEW
      </a>`
      }
      ${
        views.id === "manifestTable"
          ? `<div class="item">
        <button onclick="downloadManifest()" id="manifestDownload">DOWNLOAD</button>
      </div>`
          : ""
      }
    </div>
    </div>
    ${table}
    ${json}
    </div>
  `;
}
class RightSideBlock {
  contructor() {
    this.isManifestPrepared = false;
    this.isReferrersPrepared = false;
    this.isBlobsPrepared = false;
  }

  prepareMetaData() {
    let inp = document.querySelectorAll("#content_area .metaData .ui input");
    let copyIcons = document.querySelectorAll(
      "#content_area .metaData #copyIcon"
    );
    inp[0].value = ar.Artifact ? ar.Artifact : "not available";
    copyIcons[0].setAttribute("data-value", ar.Artifact || "");
    inp[1].value = ar.Digest ? ar.Digest : "not available";
    copyIcons[1].setAttribute("data-value", ar.Digest || "");
    inp[2].value = ar.MediaType ? ar.MediaType : "not available";
    copyIcons[2].setAttribute("data-value", ar.MediaType || "");
  }

  async prepareManifestsBlock() {
    if (this.isManifestPrepared) return;
    const b1 = document.querySelector("#manifestBlock");
    const b2 = document.querySelector("#layersBlock");
    const loader = document.querySelector(
      "#content_area .main .rightContent .loadingBlock"
    );
    b1.innerHTML = "";
    b2.innerHTML = "";

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

      if (!ar.Manifests) {
        manifestSidebarItem.classList.remove("show");
        manifestSidebarItem.classList.add("hide");
        manifestSidebarItem.classList.remove("active");
        layersSidebarItem.classList.add("active");
      } else {
        manifestSidebarItem.classList.remove("hide");
        manifestSidebarItem.classList.add("show");
        manifestSidebarItem.classList.add("active");
      }
      if (!ar.Layers) {
        layersSidebarItem.classList.remove("show");
        layersSidebarItem.classList.add("hide");
      } else {
        layersSidebarItem.classList.remove("hide");
        layersSidebarItem.classList.add("show");
      }
      if (!ar.Subjects && !ar.Configs) {
        blobSidebarItem.classList.remove("show");
        blobSidebarItem.classList.add("hide");
      } else {
        blobSidebarItem.classList.remove("hide");
        blobSidebarItem.classList.add("show");
      }

      if (!ar.Manifests && !ar.Configs && !ar.Layers && !ar.Subjects) {
        manifestSidebarItem.classList.remove("hide");
        manifestSidebarItem.classList.add("show");
        manifestSidebarItem.classList.add("active");

        b1.innerHTML = `
        <div class="error">
          <img src="./static/images/crossIcon.svg"/>
          <div>Failed to fetch manifests</div>
        </div>`;
        rsb.isManifestPrepared = true;
      }

      if (ar.Manifests) {
        let records = "";
        ar.Manifests.forEach((item, ind) => {
          records += `
            <tr>
              <td colspan="2">${item.mediaType}</td>
              <td>${item.size}</td>
              <td colspan="3" id="digest">
              <div id="digest"> ${item.digest} </div>
              <img src="./static/images/copyIcon.svg" id="copyIcon" data-value="${item.digest}">
              </td>
              <td colspan="2">${item.platform?.architecture}</td>
              <td>${item.platform?.os}</td>
            </tr>`;
        });
        const table = `
          <div class="view-item active" id="table">
          <table class="ui fixed single line celled table">
          <thead>
          <tr>
            <th scope="col" colspan="2">Mediatype</th>
            <th scope="col">Size</th>
            <th scope="col" colspan="3">Digest</th>
            <th scope="col" colspan="2">Architecture</th>
            <th scope="col">os</th>
          </tr>
          </thead>
          ${records}
          </table>
          </div>`;

        const JSONview = `
          <div class="view-item" id="jsonV">
          <pre>
            ${prettyPrintJson.toHtml({ Manifests: ar.Manifests })}
          </pre>
          </div>
        `;
        b1.innerHTML += blockTemplate("Content Manifests", table, JSONview, {
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
        document
          .querySelectorAll("#manifestTable table #digest #digest")
          .forEach((digest) =>
            digest.addEventListener("click", async function (event) {
              event.preventDefault();
              const d = digest.textContent.trim();
              tag.value = d;
              const artifactUrl = `?image=${reg.value}/${repo.value}${
                !tagList || !tagList.includes(tag.value) ? "@" : ":"
              }${tag.value}`;
              window.history.pushState(
                {
                  page: "artifact",
                  artifactUrl: artifactUrl,
                },
                "",
                artifactUrl
              );
              if (event.target.classList.contains("handled")) {
                return;
              }
              event.target.classList.add("handled");
              rsb.isManifestPrepared = false;
              try {
                await fetchTagList();
                await displayArtifactContents();
              } catch (error) {
                console.error(error);
              }
            })
          );
      }

      if (ar.Layers) {
        let records = "";
        ar.Layers.forEach((item, ind) => {
          records += `
            <tr>
              <td colspan="2">${item.mediaType}</td>
              <td>${item.size}</td>
              <td colspan="4" id="digest">
              <div id="digest">
              <a href="/blob?layer=${reg.value}/${repo.value}@${item.digest}" target="_blank">
              ${item.digest}
              </a></div>
              <img src="./static/images/copyIcon.svg" id="copyIcon" data-value="${item.digest}">
              </td>
            </tr>`;
        });
        const table = `
          <div class="view-item active" id="table">
          <table class="ui fixed single line celled table">
          <thead>
          <tr>
            <th scope="col" colspan="2">Mediatype</th>
            <th scope="col">Size</th>
            <th scope="col" colspan="4">Digest</th>
          </tr>
          </thead>
          ${records}
          </table>
          </div>`;

        b2.innerHTML += blockTemplate("Layers", table, "", {
          id: "layersTable",
        });

        const topBar = document.querySelectorAll(
          "#layersTable .header .menu .view"
        );

        topBar?.forEach((item) => {
          item.addEventListener("click", () => {
            topBar?.forEach((item) => item.classList.remove("active"));
            item.classList.add("active");
          });
        });
      }
      rsb.isManifestPrepared = true;
      if (!ar.Manifests && ar.Layers) {
        alterRightSide("layersBlock");
      }
    } catch (err) {
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
        <ul>${generateTree(ar.Referrers)}</ul>
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

  async prepareBlobsBlock() {
    if (this.isBlobsPrepared) return;

    const loader = document.querySelector(
      "#content_area .main .rightContent .loadingBlock"
    );
    const blobView = document.getElementById("blobBlock");
    blobView.innerHTML = "";

    loader.classList.remove("spinner");
    loader.classList.add("loader");
    try {
      if (!ar.isManifestPrepared) {
        await ar.setContents({
          registry: `${reg.value}/`,
          repo: repo.value,
          tag: tag.value,
        });
      }
      if (!ar.isReferrersPrepared) {
        await ar.setReferrers({
          registry: reg.value,
          repo: repo.value,
          tag: tag.value,
        });
      }
      let blobs = {};
      if (ar.Configs) {
        let Configs = [];
        if (!Array.isArray(ar.Configs)) {
          Configs.push(ar.Configs);
        } else {
          Configs = ar.Configs;
        }

        Configs.forEach((item) => (blobs[item.mediaType] = [item]));
      }
      if (ar.Layers) {
        ar.Layers.forEach((item) => {
          if (blobs[item.mediaType]) {
            blobs[item.mediaType].push(item);
          } else {
            blobs[item.mediaType] = [item];
          }
        });
      }
      if (ar.Subjects) {
        ar.Subjects.forEach((item) => {
          if (blobs[item.mediaType]) {
            blobs[item.mediaType].push(item);
          } else {
            blobs[item.mediaType] = [item];
          }
        });
      }
      if (ar.Referrers) {
        ar.Referrers.forEach((item) => {
          if (blobs[item.ref.mediaType]) {
            blobs[item.ref.mediaType].push(item.ref);
          } else {
            blobs[item.ref.mediaType] = [item.ref];
          }
        });
      }

      loader.classList.remove("loader");
      loader.classList.add("spinner");

      if (!Object.keys(blobs).length) {
        blobView.innerHTML = `
        <div class="info">
          <img src="./static/images/infoIcon.svg"/>
          <div>No Blobs available</div>
        </div>
        `;
        rsb.isBlobsPrepared = true;
        return;
      }

      const keys = Object.keys(blobs);
      let html = "";
      keys.forEach((item, ind) => {
        let records = "";
        blobs[item].forEach((b) => {
          records += `
            <tr>
              <td colspan="2">${b.mediaType}</td>
              <td>${b.size}</td>
              <td colspan="4" id="digest">
              <div id="digest">
              <a href="/blob?layer=${reg.value}/${repo.value}@${b.digest}" target="_blank"> 
              ${b.digest} 
              </a></div>
              <img src="./static/images/copyIcon.svg" id="copyIcon" data-value="${b.digest}">
              </td>
            </tr>`;
        });
        const table = `
            <h2>${item}</h2>
            <table class="ui fixed single line celled table">
            <thead>
            <tr>
              <th scope="col" colspan="2">Mediatype</th>
              <th scope="col">Size</th>
              <th scope="col" colspan="4">Digest</th>
            </tr>
            </thead>
            ${records}
            </table>`;
        html += table;
      });

      html = `<div class="view-item active" id="table">${html}</div>`;

      // const JSONview = `
      //     <div class="view-item" id="jsonV">
      //     <pre>
      //       ${prettyPrintJson.toHtml({ Blobs: blobs })}
      //     </pre>
      //     </div>
      //   `;
      blobView.innerHTML += blockTemplate("Artifact Blobs", html, "", {
        id: "blobTable",
      });

      const topBar = document.querySelectorAll(
        "#blobTable .header .menu .view"
      );

      topBar?.forEach((item) => {
        item.addEventListener("click", () => {
          topBar?.forEach((item) => item.classList.remove("active"));
          item.classList.add("active");
        });
      });
      rsb.isBlobsPrepared = true;
    } catch (err) {
      blobView.innerHTML = `
      <div class="error">
        <img src="./static/images/crossIcon.svg"/>
        <div>Failed to fetch blobs</div>
      </div>
      `;
      rsb.isBlobsPrepared = false;
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
    this.Blobs = null;
    this.Subjects = null;
    this.Referrers = null;
  }

  async setContents(artifact) {
    try {
      const response = await fetch(
        `/api/artifact?registry=${artifact.registry}&name=${artifact.repo}&${
          (!tagList || !tagList.includes(artifact.tag)) &&
          tag.value !== "latest"
            ? "digest"
            : "tag"
        }=${artifact.tag}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch manifests");
      }
      const data = await response.json();
      this.Artifact = data.Artifact;
      this.MediaType = data.MediaType;
      this.Configs = data.Configs;
      this.Manifests = data.Manifests;
      this.Layers = data.Layers;
      this.Digest = data.Digest;
      this.Subjects = data.Subjects;

      return null;
    } catch (err) {
      this.Artifact = "";
      this.MediaType = "";
      this.Digest = "";
      this.Manifests = null;
      this.Configs = null;
      this.Layers = null;
      this.Blobs = null;
      this.Referrers = null;
      this.Subjects = null;
      return err;
    }
  }

  async setReferrers(artifact) {
    try {
      const response = await fetch(
        `/api/referrers?registry=${artifact.registry}/&name=${artifact.repo}&${
          (!tagList || !tagList.includes(artifact.tag)) &&
          tag.value !== "latest"
            ? "digest"
            : "tag"
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

  if (!isOutsideRegList) {
    regDropdown.classList.remove("show");
    regDropdown.classList.add("hide");
  }
  if (!isOutsideTagList) {
    tagListDropdown.classList.remove("show");
    tagListDropdown.classList.add("hide");
  }
});
window.addEventListener("popstate", async function (event) {
  if (event.state && event.state.page === "artifact") {
    const artifactUrl = event.state.artifactUrl;
    const searchParams = new URLSearchParams(artifactUrl);
    const image = searchParams.get("image");
    const regex = /^(.+?)\/(.+?)(?::|@)(.+)$/;
    const matches = image.match(regex);

    reg.value = matches[1];
    repo.value = matches[2];
    tag.value = matches[3];

    rsb.isManifestPrepared = false;
    try {
      await fetchTagList();
      await displayArtifactContents();
    } catch (error) {
      console.error(error);
    }
  }
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
