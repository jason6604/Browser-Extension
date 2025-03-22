const isValidUrl = (urlString) => {
  var urlPattern = new RegExp('^(https?:\\/\\/)?' + // validate protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // validate domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // validate OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // validate port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // validate query string
      '(\\#[-a-z\\d_]*)?$', 'i'); // validate fragment locator
  return !!urlPattern.test(urlString);
}

const STORAGEID = 'extension_taburls';

const getAllUrlFromLocalStorage = async () => {
  var results;
  results = await chrome.storage.local.get(STORAGEID);

  return results.extension_taburls ? results.extension_taburls : [];  
}

const saveUrlToLocalStorage = async (taburls) => {
  let data = {'extension_taburls': taburls};
  await chrome.storage.local.set(data);
}

const removeUrlFromLocalStorage = async (e) => {
  const url = e.parentNode.innerText
    .replace(' ', '')
    .replace('Remove', '')
    .replace(/\s/g, '')
    .replace('×', '');  
  const urls = await getAllUrlFromLocalStorage();  
  const taburls = urls.filter((u) => u !== url);
  
  await saveUrlToLocalStorage(taburls);  
  createUrlList(taburls);
}

const createUrlList = (urls) => {
  let urlNode = document.getElementById('url-list');

  while (urlNode.firstChild) {
    urlNode.removeChild(urlNode.firstChild);
  }

  urls.forEach((u) => {
    const liNode = document.createElement('li');
    const imgNode = document.createElement('img');
    const wesiteIcon = document.createElement('img');
    const divNode = document.createElement('div');
    const spanNode = document.createElement('span');

    divNode.id = 'url-list-item';
    divNode.className = 'url-list-item';
    wesiteIcon.src = faviconURL(u)
    spanNode.appendChild(document.createTextNode(u))

    imgNode.src = './images/delete-button.png';
    imgNode.alt = 'Remove';
    imgNode.id = 'button-remove';
    imgNode.addEventListener('click', async function (e) {
      await removeUrlFromLocalStorage(e.currentTarget);
    });

    divNode.appendChild(wesiteIcon);    
    divNode.appendChild(spanNode);
    /*liNode.appendChild(wesiteIcon);
    liNode.appendChild(document.createTextNode(u));*/
    liNode.appendChild(divNode);
    liNode.appendChild(imgNode);
    urlNode.appendChild(liNode);
  });
}

const faviconURL= (u) => {
  const url = new URL(chrome.runtime.getURL("/_favicon/"));
  
  if (u.indexOf('http') === -1) {
    u = 'http://' + u;
  }

  url.searchParams.set("pageUrl", u);
  url.searchParams.set("size", "16");
  return url.toString();
}

const openTabs = async () => {
  const urls = await getAllUrlFromLocalStorage();
  urls.forEach((u) => {
    let direction = u;

    if (u.indexOf('http') === -1) {
      direction = 'http://' + u;
    }

    chrome.tabs.create({ url: direction });
  });
}

const init = async () => {
  const urls = await getAllUrlFromLocalStorage();  
  createUrlList(urls);  
}

document.getElementById('button-opentabs').addEventListener('click', openTabs);

document.getElementById('button-addtab').addEventListener('click', async () => {
  const url = document.getElementById('input-weburl').value;
  document.getElementById('status-message').innerText = '';

  if (!isValidUrl(url)) {
    document.getElementById('status-message').innerText = 'Invalid URL!';
    return;
  }
  const urls = await getAllUrlFromLocalStorage();
  if (urls.includes(url)) {
    document.getElementById('status-message').innerText = 'URL already exists!';
    return;
  }  
  const taburls = [...urls, url];
  await saveUrlToLocalStorage(taburls);
  createUrlList(taburls);
  document.getElementById('input-weburl').value = '';
  document.getElementById('input-weburl').focus();
});

document.querySelector('#input-weburl').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    e.preventDefault();

    var addTabButton = document.getElementById('button-addtab');
    addTabButton.click();
  }
});

init();