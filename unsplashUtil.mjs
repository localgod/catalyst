import { createApi } from 'unsplash-js';


const unsplash = createApi({accessKey: process.env.UNSPLASH_ACCESS_KEY}).photos

const t = await unsplash.photos.get(
  { photoId: '41bwXzLDEGc' },
  { headers: { 'X-Custom-Header-2': 'bar' } },
);

console.log(t.response.urls.regular)