const reg = document.querySelector(".inputs .i1");
const repo = document.querySelector(".inputs .i2");
const tag = document.querySelector(".inputs .i3");
const inputsParent = document.querySelector(".inputs");
const artifact = document.querySelector("#content_area");
const rows = document.querySelectorAll("#table_digest");
const tagListDropdown = document.querySelector(".inputs .dropdown > div");

let currentActiveInput = reg;

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
    if (tag.value.includes("sha256:")) {
      changeDelimiter("@");
    }
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
function hideDropdown() {
  inputsParent.classList.remove("show-dropdown");
}
function showRegList() {
  let listItems = "";
  regList.map(
    (item) =>
      (listItems += `<div data-name="${item.name}" class="items dropdown-item">
      <img src="${item.image}" />
      <p>${item.name}</p>
    </div>`)
  );
  tagListDropdown.innerHTML = listItems;
  document
    .querySelectorAll(".inputs .dropdown > div .items")
    ?.forEach((regElement) =>
      regElement.addEventListener("click", () => {
        if (reg.value !== regElement.getAttribute("data-name")) {
          tag.value = "";
          repo.value = "";
        }
        reg.value = regElement.getAttribute("data-name");
        resizeInputs();
        hideDropdown();
      })
    );
  inputsParent.classList.add("show-dropdown");
}
// ends

// enable keyboard interaction in dropdown
let activeItemIndex = -1;

function resetItemIndex() {
  activeItemIndex = -1;
}

function setActiveItem(dropdown, index, isEnterPressed = false) {
  const items = dropdown.querySelectorAll(".dropdown-item");
  items.forEach((item, i) => {
    item.classList.toggle("active", i === index);
  });

  // Set the value based on the active index
  const activeItem = dropdown.querySelector(".active");
  const val = activeItem?.textContent?.trim();
  if (currentActiveInput.classList.contains("i1")) {
    if(isEnterPressed){
      tag.value = "";
      repo.value = "";
    }
    reg.value = val;
  } else if (currentActiveInput.classList.contains("i2")) {
    if(isEnterPressed){
      tag.value = "";
    }
    repo.value = val;
  } else if (currentActiveInput.classList.contains("i3")) {
    tag.value = val;
  }
  resizeInputs();
}

// function to handle the scrolling behavior for a specific dropdown
function handleDropdownScroll(dropdown, event, activeIndex, setActiveIndex) {
  if (inputsParent.classList.contains("show-dropdown")) {
    const items = dropdown.querySelectorAll(".dropdown-item");
    if (event.key === "ArrowDown") {
      event.preventDefault();
      activeIndex = (activeIndex + 1) % items.length;
      setActiveIndex(activeIndex);
      scrollToSelectedItem(dropdown, activeIndex);
      setActiveItem(dropdown, activeIndex);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      activeIndex = (activeIndex - 1 + items.length) % items.length;
      setActiveIndex(activeIndex);
      scrollToSelectedItem(dropdown, activeIndex);
      setActiveItem(dropdown, activeIndex);
    } else if (event.key === "Enter") {
      event.preventDefault();
      hideDropdown();
      if (activeIndex === -1) {
        return;
      }
      setActiveItem(dropdown, activeIndex, true);
      if (currentActiveInput.classList.contains("i3")) {
        changeDelimiter(":");
      }
    }
  }
}

function scrollToSelectedItem(dropdown, index) {
  const items = dropdown.querySelectorAll(".dropdown-item");
  if (index >= 0 && index < items.length) {
    items[index].scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }
}

document.addEventListener("keydown", (event) => {
  handleDropdownScroll(tagListDropdown, event, activeItemIndex, (index) => {
    activeItemIndex = index;
  });
});

// list javascript
let tagList = [];
let repoList = [];
let isRepoRegChanged = false;

function fetchTagList() {
  return new Promise((resolve, reject) => {
    tagListDropdown.innerHTML =
      '<div class="skeletonLoader"></div> <div class="skeletonLoader"></div><div class="skeletonLoader"></div>';
    inputsParent.classList.add("show-dropdown");
    const URL = `/api/tags?registry=${reg.value}/&name=${repo.value}`;
    fetch(URL)
      .then((res) => res.json())
      .then((data) => {
        if(data.status === 404) {
          tagList = [];
          throw new Error(data.message);
        }
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
        console.log(err)
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
    inputsParent.classList.add("show-dropdown");
    return;
  }
  let html = "";
  filterList.map(
    (item) => (html += `<p class="tagListItem dropdown-item">${item}</p>`)
  );

  tagListDropdown.innerHTML = html;
  isRepoRegChanged = false;
  document
    .querySelectorAll(".inputs .dropdown > div > p")
    ?.forEach((tagElement) =>
      tagElement.addEventListener("click", () => {
        tag.value = tagElement.innerHTML;
        changeDelimiter(":");
        resizeInputs();
        updateTagList();
        inputsParent.classList.remove("show-dropdown");
      })
    );
  inputsParent.classList.add("show-dropdown");
  resetItemIndex();
}

function fetchRepoList() {
  return new Promise((resolve, reject) => {
    tagListDropdown.innerHTML =
      '<div class="skeletonLoader"></div> <div class="skeletonLoader"></div><div class="skeletonLoader"></div>';

    inputsParent.classList.add("show-dropdown");
    const URL = `/api/repos?registry=${reg.value}`;
    fetch(URL)
      .then((res) => res.json())
      .then((data) => {
        repoList = data;
        updateRepoList();
        resolve();
      })
      .catch((err) => {
        tagListDropdown.innerHTML = `
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
  inputsParent.classList.add("show-dropdown");

  const filterList = repoList.filter((item) => item.includes(repo.value || ""));
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
  filterList.map(
    (item) => (html += `<p class="repoListItem dropdown-item">${item}</p>`)
  );

  tagListDropdown.innerHTML = html;
  document
    .querySelectorAll(".inputs .dropdown > div > p")
    ?.forEach((repoElement) =>
      repoElement.addEventListener("click", () => {
        if (repo.value !== repoElement.innerHTML) {
          tag.value = "";
        }
        repo.value = repoElement.innerHTML;
        resizeInputs();
        updateRepoList();
        inputsParent.classList.remove("show-dropdown");
      })
    );
  resetItemIndex();
}

function listTags() {
  if (!repo.value || !reg.value) return;
  if (!tagList.length || isRepoRegChanged) {
    fetchTagList();
  } else {
    updateTagList();
  }
}

function listRepos() {
  if (!reg.value || reg.value !== "mcr.microsoft.com") return;
  if (!repoList.length) {
    fetchRepoList();
  } else {
    updateRepoList();
  }
}

repo.addEventListener("change", () => {
  isRepoRegChanged = true;
});
reg.addEventListener("change", () => {
  isRepoRegChanged = true;
});
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
  if  (!treeData.length) return "";
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

function redirectByDigest(URL, ind) {
  if (ind === 0) {
    window.location.href = URL;
  } else if (ind === 1) {
    window.open(URL, "_blank");
  }
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
    return `<span id="jsonDigest" onclick="redirectByDigest('${redirectURL}', ${
      mediaType.includes("manifest") ? 0 : 1
    })">${match}</span>`;
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

  if (tableData.title === "Annotations") {
    data.forEach((item) => {
      for (const key in item) {
        if (item.hasOwnProperty(key)) {
          const value = item[key];
          records += `
          <tr>
            <td>${key}</td>
            <td>${value}</td>
          </tr>`;
        }
      }
    });

    const table = `
    <div id="table">
      <table class="ui fixed unstackable celled table">
        <thead>
          <tr>
            <th>Key</th>
            <th>Value</th>
          </tr>
        </thead>
        ${records}
      </table>
    </div>`;

    return table;
  }

  if (tableData.title === "Manifests") {
    data.forEach((item) => {
      records += `
        <tr>
          <td colspan="3" id="mediaType">${item.mediaType}</td>
          <td>${item.size}</td>
          <td colspan="3" id="digest">
            <div id="digest">
              <a href="${
                tableData.isBlob ? "/blob?layer=" : "/artifact?image="
              }${reg.value}/${repo.value}@${item.digest}" target="_blank">
                ${item.digest}
              </a>
            </div>
            <img src="./static/images/copyIcon.svg" id="copyIcon" data-value="${
              item.digest
            }">
          </td>
          <td>${item.platform.architecture}</td>
          <td>${item.platform.os}</td>
        </tr>`;
    });

    const table = `
      <div id="table">
        <table class="ui fixed unstackable celled table">
          <thead>
            <tr>
              <th colspan="3" rowspan="2">Mediatype</th>
              <th rowspan="2">Size</th>
              <th colspan="3" rowspan="2">Digest</th>
              <th colspan="2">Platform</th>
            </tr>
            <tr>
              <th>Architecture</th>
              <th>OS</th>
            </tr>
          </thead>
          ${records}
        </table>
      </div>`;

    return table;
  }

  data.forEach((item) => {
    records += `
      <tr>
        <td colspan="4" id="mediaType">${item.mediaType}</td>
        <td>${item.size}</td>
        <td colspan="3" id="digest">
          <div id="digest">
            <a href="${tableData.isBlob ? "/blob?layer=" : "/artifact?image="}${
      reg.value
    }/${repo.value}@${item.digest}" ${
      tableData.isBlob ? 'target="_blank"' : ""
    }>
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
      <table class="ui fixed unstackable celled table">
        <thead>
          <tr>
            <th colspan="4">Mediatype</th>
            <th>Size</th>
            <th colspan="3">Digest</th>
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
    let inp = document.querySelectorAll("#content_area .metaData1 .text .textContent p");
    let copyIcons = document.querySelectorAll(
      "#content_area .metaData1 #copyIcon"
    );
    const fields = [
      { key: "Artifact", index: 0 },
      { key: "Digest", index: 1 },
      { key: "MediaType", index: 2 },
      { key: "Size", index: 3 },
    ];

    console.log(ar);
    fields.forEach((field) => {
      const value = ar[field.key] || "not available";
      inp[field.index].textContent = value;
      copyIcons[field.index].setAttribute("data-value", value);
    });

    const r = regList.find((item) => item.name === ar.Artifact.split("/")[0]);
    document.querySelector(".metaData1 .registry img").src = r.image;
    document.querySelector(".metaData1 .registry p").textContent = r.name;
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
        { title: "Config", data: ar.Configs, isBlob: true },
        { title: "Layers", data: ar.Layers, isBlob: true },
        {
          title: "Subject",
          data: ar.Subject.digest ? ar.Subject : null,
          isBlob: false,
        },
        { title: "Annotations", data: ar.Annotations, isBlob: false },
      ];

      let tableView = sections
        .filter((section) => section.data)
        .map(
          (section) => `
              <h2>${section.title}</h2>
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

// single input form js
const inputs = document.querySelectorAll(".inputs input");
const dropdown = document.querySelector(".dropdown");
const span2 = document.querySelector(".tagSpan");

function updateDropdownPosition(input) {
  currentActiveInput = input;
  resetItemIndex();
  if (
    (input.classList.contains("i2") && reg.value !== "mcr.microsoft.com") ||
    (input.classList.contains("i3") && (!reg.value || !repo.value))
  ) {
    hideDropdown();
    return;
  }
  const inputLeftOffset = input.offsetLeft;
  dropdown.style.left = inputLeftOffset + "px";
}
function changeDelimiter(symb) {
  span2.textContent = symb;
}
function resizeInputs() {
  inputs.forEach(function (input) {
    if (input.classList.contains("i1")) {
      input.style.width = "75px";
    } else if (input.classList.contains("i2")) {
      input.style.width = "95px";
    }
    input.style.width = `${
      Math.min(input.scrollWidth, input.parentElement.offsetWidth * 0.5) + 2
    }px`;
  });
}
inputs.forEach((input, index) => {
  input.addEventListener("paste", function handlePastedString(event) {
    const pastedText = event.clipboardData.getData("text/plain");
    const regex = /^(.+?)\/(.+?)(?::([^@]+))?(@(.+))?$/;
    const matches = pastedText.match(regex);

    if (matches) {
      const registry = matches[1] || "";
      const repository = matches[2] || "";
      let tagOrDigest = matches[3] || matches[5] || "";

      if (!matches[3] && !matches[5]) tagOrDigest = "latest";
      span2.textContent = ":";
      if (!matches[3]) {
        span2.textContent = "@";
      } else if (!matches[5]) {
        span2.textContent = ":";
      }

      inputs[0].value = registry;
      inputs[1].value = repository;
      inputs[2].value = tagOrDigest;
    } else {
      if (currentActiveInput.classList.contains("i1")) inputs[0].value = pastedText;
      else if (currentActiveInput.classList.contains("i2")) inputs[1].value = pastedText;
      else inputs[2].value = pastedText;
    }
    resizeInputs();
    hideDropdown();
    event.preventDefault();
  });

  input.addEventListener("focus", function (event) {
    currentActiveInput = event.target;
    if (event.target.classList.contains("i1")) {
      showRegList();
    } else if (event.target.classList.contains("i2")) {
      if (reg.value !== "mcr.microsoft.com") {
        hideDropdown();
        return;
      }
      listRepos();
    } else if (event.target.classList.contains("i3")) {
      if (!reg.value || !repo.value) {
        hideDropdown();
        return;
      }
      listTags();
    }
    updateDropdownPosition(this);
  });

  input.addEventListener("keydown", function (event) {
    if (event.key === "Tab") {
      event.preventDefault();
      updateDropdownPosition(this);
      if (index === 0) {
        inputs[1].focus();
      } else if (index === 1) {
        inputs[2].focus();
      }
    }
  });

  input.addEventListener("input", function () {
    resizeInputs();
    if (input.classList.contains("i2")) {
      const nextSpan = input.nextElementSibling;
      const thirdInput = input.nextElementSibling.nextElementSibling;
      const inputValue = input.value;

      if (inputValue.endsWith(":")) {
        nextSpan.textContent = ":";
        input.value = inputValue.slice(0, -1);
        thirdInput.placeholder = "tag";
        thirdInput.focus();
      } else if (inputValue.endsWith("@")) {
        nextSpan.textContent = "@";
        input.value = inputValue.slice(0, -1);
        thirdInput.placeholder = "digest";
        thirdInput.focus();
      }
    }
  });

  input.addEventListener("keydown", function (event) {
    if (event.key === "/" && index === 0) {
      event.preventDefault();
      inputs[1].focus();
    } else if (
      event.key === "Backspace" &&
      (input.value === "" || input.selectionStart === 0)
    ) {
      event.preventDefault();
      if (index === 2) {
        inputs[1].focus();
      } else if (index === 1) {
        inputs[0].focus();
      }
    }
  });

  input.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft" && input.selectionStart === 0) {
      event.preventDefault();
      if (index > 0) {
        inputs[index - 1].focus();
      }
    } else if (
      event.key === "ArrowRight" &&
      input.selectionEnd === input.value.length
    ) {
      event.preventDefault();
      if (index < 2) {
        inputs[index + 1].focus();
      }
    } else if (input.classList.contains("i3") && input.selectionStart === 0) {
      const preSpan = input.previousElementSibling;
      if (event.key === ":") {
        event.preventDefault();
        preSpan.textContent = ":";
        input.placeholder = "tag";
      } else if (event.key === "@") {
        event.preventDefault();
        preSpan.textContent = "@";
        input.placeholder = "digest";
      }
    }
  });
});

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
    this.Annotations = null;
    this.Manifest = null;
    this.Size = null;
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
      this.Manifest = JSON.parse(data.Manifest);
      this.Size = data.Size;
      this.Annotations = data.Annotations;

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
      this.Size = null;
      this.Annotations = null;
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
  const allowedClasses = [
    "i1",
    "i2",
    "i3",
    "dropdown",
    "repoListItem",
    "tagListItem",
    "items",
  ];
  let isHide = true;
  allowedClasses.forEach((className) => {
    if (event.target.classList.contains(className)) {
      isHide = false;
    }
  });
  if (isHide) {
    inputsParent.classList.remove("show-dropdown");
  }
});

function updateInputs(image) {
  const regex = /^(.+?)\/(.+?)(?::([^@]+))?(@(.+))?$/;
  const matches = image.match(regex);

  const registry = matches[1] || "";
  const repository = matches[2] || "";
  let tagOrDigest = matches[3] || matches[5] || "";

  if (!matches[3] && !matches[5]) {
    tagOrDigest = "latest";
    changeDelimiter(":");
  } else if (!matches[3]) {
    changeDelimiter("@");
  } else if (!matches[5]) {
    changeDelimiter(":");
  }

  reg.value = registry;
  repo.value = repository;
  tag.value = tagOrDigest;
}
function handleNavigation() {
  const pathname = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  const image = searchParams.get("image");

  if (pathname.includes("/artifact") && image) {
    updateInputs(image);
    resizeInputs();

    artifact.classList.remove("hide");
    artifact.classList.add("show");

    rsb.isManifestPrepared = false;
    try {
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
  updateInputs(image);
  resizeInputs();
  artifact.classList.remove("hide");
  artifact.classList.add("show");

  rsb.isManifestPrepared = false;
  try {
    // await fetchTagList();
    await displayArtifactContents();
  } catch (error) {
    console.error(error);
  }
});
// ends
