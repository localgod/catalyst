import { createApi } from 'unsplash-js';


const unsplash = createApi({accessKey: process.env.UNSPLASH_ACCESS_KEY}).photos

const t = await unsplash.get(
  { photoId: 'brown-wooden-blocks-on-white-table-fMbRKk2la0s' },
  { headers: { 'X-Custom-Header-2': 'bar' } },
);

console.log(t.response.urls.regular)
