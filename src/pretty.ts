function splitHostname(url: URL): string[] {
  return url.hostname.split(".");
}

function splitPathname(url: URL): string[] {
  return url.pathname.split("/").filter((string) => string !== "");
}

function getRootDomain(url: URL, levels = 1): string {
  return splitHostname(url).slice(-levels).join(".");
}

function getSiteOwner(url: URL): string | undefined {
  return splitHostname(url).at(-3);
}

async function checkRepoExists(owner: string, repo: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`
    );
    const status = response.status;
    alert(response.status);

    // 200 (Ok) or 304 (Not Modified) mean the repo exists
    return status == 200 || status == 304;
  } catch {
    return false;
  }
}

async function getRepo(url: URL, owner: string): Promise<string | undefined> {
  const basePathName = splitPathname(url)[0];

  if (
    basePathName !== undefined &&
    (await checkRepoExists(owner, basePathName))
  ) {
    return basePathName;
  } else if (await checkRepoExists(owner, url.hostname)) {
    return url.hostname;
  }

  return undefined;
}

async function find_repo(url: URL) {
  if (getRootDomain(url, 2) !== "github.io") {
    alert("This tool only works on pages hosted on github.io");
    return;
  }

  let owner = getSiteOwner(url);

  if (owner == undefined) {
    alert("This does not appear to be a valid github pages site");
    return;
  }

  const repo = await getRepo(url, owner);

  if (repo == undefined) {
    alert(`Could not find a matching repository under owner "${owner}"`);
    return;
  }

  const githubUrl = new URL(`https://github.com/${owner}/${repo}`);
  window.location.assign(githubUrl);
}

const url = new URL(window.location.href);
find_repo(url);
