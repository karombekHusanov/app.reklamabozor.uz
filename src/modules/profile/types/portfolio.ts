export interface PortfolioMediaDraft {
  id: number
  url: string
  name: string
  mime: string
  size: number
}

export interface PortfolioItemDraft {
  images: PortfolioMediaDraft[]
  attachments: PortfolioMediaDraft[]
  title: string
  description: string
  link_url: string
}
