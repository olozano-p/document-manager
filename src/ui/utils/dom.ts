export function createElement(tag: string, className?: string, textContent?: string): HTMLElement {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (textContent) {
    element.textContent = textContent;
  }
  return element;
}

export function createSVGIcon(iconName: string, size = 20): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', size.toString());
  svg.setAttribute('height', size.toString());
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'currentColor');

  switch (iconName) {
    case 'list':
      svg.innerHTML = '<path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>';
      break;
    case 'grid':
      svg.innerHTML = '<path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/>';
      break;
    case 'plus':
      svg.innerHTML = '<path d="M12 2v20m-10-10h20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
      break;
    case 'sort':
      svg.innerHTML = '<path d="M3 18h6l-3-3 3-3H3v6zm18 0v-6h-6l3 3-3 3h6z"/>';
      break;
    case 'document':
      svg.innerHTML = '<path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>';
      break;
    case 'attachment':
      svg.innerHTML = '<path d="M7.5 18A5.5 5.5 0 0 1 2 12.5c0-3.04 2.46-5.5 5.5-5.5h9A3.5 3.5 0 0 1 20 10.5c0 1.93-1.57 3.5-3.5 3.5h-7.5c-1.38 0-2.5-1.12-2.5-2.5S7.62 9 9 9h6v1.5H9c-.55 0-1 .45-1 1s.45 1 1 1h7.5c1.1 0 2-.9 2-2s-.9-2-2-2h-9C5.57 8.5 3.5 10.57 3.5 12.5S5.57 16.5 7.5 16.5H15V18H7.5z"/>';
      break;
    case 'close':
      svg.innerHTML = '<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
      break;
    default:
      svg.innerHTML = '<circle cx="12" cy="12" r="10"/>';
  }

  return svg;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return 'Today';
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  } else {
    const years = Math.floor(diffInDays / 365);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function sanitizeHTML(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}