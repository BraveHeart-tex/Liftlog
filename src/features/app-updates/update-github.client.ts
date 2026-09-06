import {
  UpdateNetworkError,
  type UpdateGitHubClient
} from './update-coordinator';
import type { GitHubRelease } from './update.types';

const LATEST_RELEASE_URL =
  'https://api.github.com/repos/BraveHeart-tex/Liftlog/releases/latest';
const GITHUB_API_VERSION = '2022-11-28';

const githubHeaders = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': GITHUB_API_VERSION
};

async function fetchFromGitHub(url: string, init: RequestInit) {
  try {
    return await fetch(url, init);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new UpdateNetworkError('GitHub is unreachable.');
    }

    throw error;
  }
}

export const updateGitHubClient: UpdateGitHubClient = {
  async getLatestRelease(etag) {
    const response = await fetchFromGitHub(LATEST_RELEASE_URL, {
      headers: etag
        ? { ...githubHeaders, 'If-None-Match': etag }
        : githubHeaders
    });

    if (response.status === 304) {
      return { status: 304 };
    }

    if (!response.ok) {
      return {
        status: response.status,
        rateLimited:
          response.status === 429 ||
          (response.status === 403 &&
            response.headers.get('x-ratelimit-remaining') === '0')
      };
    }

    return {
      status: 200,
      etag: response.headers.get('etag') ?? undefined,
      release: (await response.json()) as GitHubRelease
    };
  },

  async getManifest(release) {
    const assets = release.assets.filter(asset => asset.name === 'update.json');

    if (assets.length !== 1) {
      throw new Error('Release manifest is missing or duplicated.');
    }

    const response = await fetchFromGitHub(assets[0].url, {
      headers: {
        ...githubHeaders,
        Accept: 'application/octet-stream'
      }
    });

    if (!response.ok) {
      throw new Error('Release manifest could not be downloaded.');
    }

    return response.json();
  }
};
