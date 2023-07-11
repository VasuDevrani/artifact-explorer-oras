const reg = document.querySelector('input[type="hidden"][name="registry"]');
const repo = document.querySelector("#floatingInput");
const artifact = document.querySelector("#content_area");
const rows = document.querySelectorAll("#table_digest");
const tag = document.querySelector("#digestortag input");
const tagListDropdown = document.querySelector(".tagListDropdown");

// function calls
function onSubmit() {
  if (!reg.value || !repo.value || !tag.value) return;
  const err = ar.setContents({
    registry: reg.value,
    repo: repo.value,
    tag: tag.value,
  });
  alterRightSide("manifestBlock");
}
// ends

// tag list javascript
let tagList = [];
let filteredTagList = [];
let isRepoRegChanged = false;

function fetchTagList() {
  tagListDropdown.innerHTML = "loading...";
  const URL = `/api/tags?registry=${reg.value}&name=${repo.value}`;
  fetch(URL)
    .then((res) => res.json())
    .then((data) => {
      tagList = data;
      updateTagList();
    })
    .catch((err) => {
      tagListDropdown.innerHTML = "Cannot fetch list";
    });
}

function updateTagList() {
  const filterList = tagList.filter((item) => item.includes(tag.value || ""));
  if (!filterList.length) {
    tagListDropdown.innerHTML = "No match found";
    return;
  }
  let html = "";
  filterList.map((item) => (html += `<p class="tagListItem">${item}</p>`));

  tagListDropdown.innerHTML = html;
  isRepoRegChanged = false;
  document.querySelectorAll(".tagListDropdown p")?.forEach((tagElement) =>
    tagElement.addEventListener("click", () => {
      tag.value = tagElement.innerHTML;
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

// Sidebar Javascript
const sidebarItems = document.querySelectorAll(
  "#content_area .main .leftSideBar ul li"
);

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
}
// ends

// right side javascript
function switchManifestView(contentId) {
  const contentBlocks = document.querySelectorAll(
    "#content_area .main .rightContent #manifestBlock #manifestTable .view-item"
  );
  const selectedContent = document.querySelector(
    `#content_area .main .rightContent #manifestBlock #manifestTable #${contentId}`
  );
    console.log(selectedContent)
  for (let i = 0; i < contentBlocks.length; i++) {
    contentBlocks[i].classList.remove("active");
  }
  selectedContent.classList.add("active");
}

function blockTemplate(title, table, json, views) {
  return `
    <div id=${views.id}>
    <div class="header">
    <h1>${title}</h1>
    <div class="ui tabular menu">
      <a class="item active view" onclick='switchManifestView("table")'>
        TABLE VIEW
      </a>
      <a class="item view" onclick='switchManifestView("jsonV")'>
        JSON VIEW
      </a>
      <div class="item">
        <div class="ui primary button">DOWNLOAD</div>
      </div>
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
    inp[0].value = ar.Artifact;
    inp[1].value = ar.Digest;
    inp[2].value = ar.MediaType;
  }

  prepareManifestsBlock() {
    if (this.isManifestPrepared || (!ar.Manifests && !ar.Layers && !ar.Configs))
      return;

    const b1 = document.querySelector(
      "#content_area .main .rightContent #manifestBlock"
    );
    b1.innerHTML = "";
    const loader = document.querySelector(
      "#content_area .main .rightContent .spinner-border"
    );

    loader.classList.remove("spinner");
    loader.classList.add("loader");
    window.setTimeout(() => {
      loader.classList.remove("loader");
      loader.classList.add("spinner");

      if (ar.Manifests) {
        let records = "";
        ar.Manifests.forEach((item, ind) => {
          records += `
            <tr>
              <td colspan="2">${item.mediaType}</td>
              <td>${item.size}</td>
              <td colspan="3" id="digest">
              <div> ${item.digest} </div>
              <img src="./static/images/copyIcon.svg" id="copyIcon">
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
            ${prettyPrintJson.toHtml({Manifests: ar.Manifests})}
          </pre>
          </div>
        `;
        b1.innerHTML = blockTemplate("Content Manifests", table, JSONview, {
          id: "manifestTable",
        });

        const topBar = document.querySelectorAll(
          "#content_area .main .rightContent #manifestBlock #manifestTable .header .menu .view"
        );
        
        topBar?.forEach((item) => {
          item.addEventListener("click", () => {
            topBar?.forEach((item) => item.classList.remove("active"));
            item.classList.add("active");
          });
        });
      }
      if (ar.Configs) {
      }
      if (ar.Layers) {
        let records = "";
        ar.Layers.forEach((item, ind) => {
          records += `
            <tr>
              <td colspan="2">${item.mediaType}</td>
              <td>${item.size}</td>
              <td colspan="3">${item.digest}</td>
            </tr>`;
        });
        const table = `
          <table class="ui fixed single line celled table">
          <thead>
          <tr>
            <th scope="col" colspan="3">Mediatype</th>
            <th scope="col">Size</th>
            <th scope="col" colspan="5">Digest</th>
          </tr>
          </thead>
          ${records}
          </table>`;

        b1.innerHTML += blockTemplate("Layers", table, {
          id: "layersTable",
        });
      }
    }, 500);
  }

  prepareReferrersBlock() {
    if (this.isReferrersPrepared || !ar.Referrers) return;

    // create a tree from recursive object
    // set into the DOM element
  }

  prepareBlobsBlock() {
    if (this.isBlobsPrepared || (!ar.Layers && !ar.Configs)) return;
    // generate Table
    // create Views object for download and json view
    // generate Block from BlockTemplate
    // set into the DOM element
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
    this.Referrers = null;
  }

  setContents(artifact) {
    fetch(
      `/api/artifact?registry=${artifact.registry}&name=${artifact.repo}&${
        !tagList.includes(artifact.tag) ? "digest" : "tag"
      }=${artifact.tag}`
    )
      .then((res) => res.json())
      .then((data) => {
        this.Artifact = data.Artifact;
        this.MediaType = data.MediaType;
        this.Configs = data.Configs;
        this.Manifests = data.Manifests;
        this.Layers = data.Layers;
        this.Digest = data.Digest;

        rsb.prepareMetaData();
        rsb.prepareManifestsBlock();
        return null;
      })
      .catch((err) => {
        console.log(err);
        return err;
      });
  }

  setReferrers(artifact) {
    fetch(
      `/api/referrers?registry=${artifact.registry}&name=${artifact.repo}&${
        !tagList.includes(artifact.tag) ? "digest" : "tag"
      }=${artifact.tag}`
    )
      .then((res) => res.json())
      .then((data) => {
        this.Referrers = data;
        return null;
      })
      .catch((err) => {
        console.log(err);
        return err;
      });
  }

  setBlobs() {
    this.Blobs = [...this.Configs, ...this.Layers];
  }
}

let ar = new Artifact();
// ends

// others
document.addEventListener("click", (event) => {
  isOutsideTagList =
    tagListDropdown.contains(event.target) ||
    tag.contains(event.target) ||
    event.target.classList.contains("tagListItem");
  if (!isOutsideTagList) {
    tagListDropdown.classList.remove("show");
    tagListDropdown.classList.add("hide");
  }
});
// ends
