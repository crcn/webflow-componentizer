// @flow
import fetch from "node-fetch";
import {Graph, GraphDependency, GraphDependencyMimeType} from './graph';

export const downloadUrl = async (url: string): Promise<GraphDependency> => {
  const response = await fetch(url);
  const content = toBuffer(await response.arrayBuffer());
  
  const contentType = response.headers.get('content-type') || '';
  const mimeType = contentType.split(';').shift();

  let dependencies = {};

  if (mimeType === 'text/html') {
    dependencies = resolveHTMLDependencies(content.toString("utf8"));
  } else if (mimeType === 'text/css') {
    dependencies = resolveCSSDependencies(content.toString("utf8"));
  } else {
    console.warn(`Cannot scan dependencies for mime-type ${mimeType}`);
  }

  return {
    mimeType: mimeType as GraphDependencyMimeType,
    url,
    dependencies,
    content,
  };
};

const toBuffer = (ab) => {
  var buf = Buffer.alloc(ab.byteLength);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buf.length; ++i) {
      buf[i] = view[i];
  }
  return buf;
}

/**
 * Scans HTML for dependencies like CSS and images.
 */

const resolveHTMLDependencies = (content: string) => {
  // Note that we don't need to cover every case here since all published WF sites
  // are the same. This may need to cover more cases if we choose to download sites outside of the WF
  // ecosystem, but that's unnecessary right now.
  return Array.from(content.match(/\<(link|img).*?\>/g) || []).reduce(
    (dependencies, tag) => {
      const tagName = (tag.match(/<([^\s]+)/) || [])[1];

      let url;

      if (tagName === 'link') {
        url = (tag.match(/href="(.*?)"/) || [])[1];
      } else if (tagName === 'img') {
        url = (tag.match(/url="(.*?)"/) || [])[1];
      }

      // Above cases were added based on observing published site content, but there still
      // may be missing cases, so throw an error here to notify the developer to add more logic
      // for handling dependencies.
      if (!url) {
        throw new Error(`Unexpected dependency tag ${String(url)}`);
      }

      return {
        ...dependencies,
        [url]: url,
      };
    },
    {}
  );
};

const resolveCSSDependencies = (content: string) => {
  return Array.from(content.match(/url\("https?:.*?"\)/) || []).reduce(
    (dependencies, urlCall) => {
      const url = (urlCall.match(/url\((.*?)\)/) || [])[1];
      return {
        ...dependencies,
        [url]: url,
      };
    },
    {}
  );
};

export const downloadDependencyGraph = async (
  url: string,
  existingGraph: Graph = {}
) => {
  if (existingGraph[url]) {
    return existingGraph;
  }

  const entry = await downloadUrl(url);

  for (const relativeUrl in entry.dependencies) {
    const dependencyUrl = entry.dependencies[relativeUrl];
    existingGraph = await downloadDependencyGraph(dependencyUrl, existingGraph);
  }

  return {
    ...existingGraph,
    [url]: entry,
  };
};
