export interface App {
  id: string;
  name: string;
  description: string;
  developer: string;
  repo: string;
  thumbnail: string;
  icon: string;
  platforms: string[];
  license: string;
  opensource: boolean;
}

export interface Release {
  tag_name: string;
  name: string;
  published_at: string;
  body: string;
  html_url: string;
  assets: ReleaseAsset[];
}

export interface ReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

export interface NavLinkItem {
  to: string;
  label: string;
  icon: string;
}
