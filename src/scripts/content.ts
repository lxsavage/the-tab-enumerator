const origHref: string[] = [];
const isMac: boolean = window.navigator.userAgent.includes('Macintosh');

async function sendSetMsg(): Promise<void> {
  if (!chrome.runtime?.id) return;
  await chrome.runtime.sendMessage('ctrl_held');
}

async function sendUnsetMsg(): Promise<void> {
  if (!chrome.runtime?.id) return;
  await chrome.runtime.sendMessage('ctrl_released');
}

function setPageFavicons(faviconUrl: string): void {
  const favicons = getPageFavicons();
  if (origHref.length > 0) return;

  favicons.forEach((favicon) => {
    origHref.push(favicon.href);
    favicon.setAttribute('href', faviconUrl);
  });
}

function unsetPageFavicons(): void {
  const favicons = getPageFavicons();
  if (origHref.length === 0) return;

  favicons.forEach((favicon: Element, index: number) => {
    favicon.setAttribute('href', origHref[index]);
  });
  origHref.length = 0;
}

function getPageFavicons(): NodeListOf<HTMLLinkElement> {
  let favicons = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");

  // If no favicons are found, create one and add it to the head
  if (!favicons?.length ?? true) {
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/png';
    document.head.append(favicon);
    favicons = document.querySelectorAll("link[rel*='icon']");
  }

  return favicons;
}

function isCtrlOrCmd(key: string): boolean {
  return (isMac && key === 'Meta') || (!isMac && key === 'Control');
}

/* Event Listeners */

document.addEventListener('visibilitychange', sendUnsetMsg);
window.addEventListener('blur', sendUnsetMsg);

document.addEventListener('keydown', (evt) => {
  if (!isCtrlOrCmd(evt.key)) return;

  sendSetMsg();
});

document.addEventListener('keyup', (evt) => {
  if (!isCtrlOrCmd(evt.key)) return;

  sendUnsetMsg();
});

chrome.runtime.onMessage.addListener((message: CTNMessage) => {
  switch (message.action) {
    case 'set_favicon':
      setPageFavicons(message.icon as string);
      break;
    case 'unset_favicon':
      unsetPageFavicons();
      break;
    default:
      break;
  }
});
