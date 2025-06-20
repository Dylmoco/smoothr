export default {
  async fetch(req) {
    const url = new URL(req.url);
    url.hostname = 'smoothr.pages.dev';
    url.protocol = 'https:';
    return fetch(new Request(url.toString(), req));
  },
};
