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
    return new DocumentModel(
      data.id,
      data.name,
      data.contributors || [],
      data.version,
      data.createdAt,
      data.attachments || []
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