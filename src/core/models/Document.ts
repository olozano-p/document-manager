import { Document as IDocument, Contributor, Attachment } from '../../types/index.js';

export class DocumentModel implements IDocument {
  constructor(
    public id: string,
    public name: string,
    public contributors: Contributor[],
    public version: number,
    public createdAt: string,
    public attachments: Attachment[]
  ) {}

  static fromApiResponse(data: any): DocumentModel {
    // Map Go server response format to our internal format
    const contributors: Contributor[] = (data.Contributors || []).map((c: any) => ({
      name: c.Name,
      avatar: '' // Go server doesn't provide avatars
    }));

    const attachments: Attachment[] = (data.Attachments || []).map((name: string) => ({
      name: name,
      size: Math.floor(Math.random() * 5000000) + 100000 // Random size since server doesn't provide it
    }));

    return new DocumentModel(
      data.ID,
      data.Title,
      contributors,
      parseFloat(data.Version) || 1,
      data.CreatedAt,
      attachments
    );
  }

  static createNew(name: string, contributors: Contributor[] = []): DocumentModel {
    return new DocumentModel(
      crypto.randomUUID(),
      name,
      contributors,
      1,
      new Date().toISOString(),
      []
    );
  }

  get totalAttachmentSize(): number {
    return this.attachments.reduce((total, attachment) => total + attachment.size, 0);
  }

  get contributorNames(): string {
    return this.contributors.map(c => c.name).join(', ');
  }

  get formattedCreatedAt(): string {
    return new Date(this.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}