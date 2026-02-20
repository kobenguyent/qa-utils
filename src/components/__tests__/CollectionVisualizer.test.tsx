import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CollectionVisualizer } from '../../components/utils/CollectionVisualizer';
import * as collectionParser from '../../utils/collectionParser';

// Minimal Postman v2.1 collection fixture
const POSTMAN_COLLECTION_JSON = JSON.stringify({
  info: {
    name: 'Pet Store API',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  item: [
    {
      name: 'Pets',
      item: [
        {
          name: 'List pets',
          request: {
            method: 'GET',
            url: 'https://api.example.com/pets',
            header: [],
          },
        },
        {
          name: 'Create pet',
          request: {
            method: 'POST',
            url: 'https://api.example.com/pets',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: { mode: 'raw', raw: '{"name":"Fluffy"}' },
          },
        },
      ],
    },
    {
      name: 'Get root',
      request: {
        method: 'GET',
        url: 'https://api.example.com/',
        header: [],
      },
    },
  ],
});

vi.mock('../../utils/collectionParser', async () => {
  const actual = await vi.importActual<typeof collectionParser>('../../utils/collectionParser');
  return {
    ...actual,
    parseCollectionFromFile: vi.fn(async (file: File) => {
      const text = await file.text();
      const data = JSON.parse(text);
      return actual.parseCollection(data);
    }),
  };
});

describe('CollectionVisualizer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the title and description', () => {
    render(<CollectionVisualizer />);
    expect(screen.getByText(/Collection Visualizer/)).toBeInTheDocument();
    expect(screen.getByText(/Upload a Postman/)).toBeInTheDocument();
  });

  it('shows file upload and JSON paste options initially', () => {
    render(<CollectionVisualizer />);
    expect(screen.getByText(/Upload Collection File/)).toBeInTheDocument();
    expect(screen.getByText(/Paste JSON/)).toBeInTheDocument();
    expect(screen.getByLabelText('Choose collection file to upload')).toBeInTheDocument();
    expect(screen.getByLabelText('Collection JSON input')).toBeInTheDocument();
  });

  it('Visualize button is disabled when JSON input is empty', () => {
    render(<CollectionVisualizer />);
    const btn = screen.getByLabelText('Visualize pasted JSON');
    expect(btn).toBeDisabled();
  });

  it('shows an error on invalid JSON paste', async () => {
    render(<CollectionVisualizer />);
    const textarea = screen.getByLabelText('Collection JSON input');
    fireEvent.change(textarea, { target: { value: 'not valid json' } });
    fireEvent.click(screen.getByLabelText('Visualize pasted JSON'));
    await waitFor(() => {
      expect(screen.getByText(/Invalid JSON/)).toBeInTheDocument();
    });
  });

  it('parses and visualizes a valid Postman collection from pasted JSON', async () => {
    render(<CollectionVisualizer />);
    const textarea = screen.getByLabelText('Collection JSON input');
    fireEvent.change(textarea, { target: { value: POSTMAN_COLLECTION_JSON } });
    fireEvent.click(screen.getByLabelText('Visualize pasted JSON'));

    await waitFor(() => {
      expect(screen.getByText('Pet Store API')).toBeInTheDocument();
    });

    // Folders and requests should appear (folders start expanded, so label is "Collapse folder …")
    expect(screen.getByLabelText(/Collapse folder Pets/)).toBeInTheDocument();
    expect(screen.getByLabelText(/View details for GET Get root/)).toBeInTheDocument();
  });

  it('shows stats badges after parsing', async () => {
    render(<CollectionVisualizer />);
    const textarea = screen.getByLabelText('Collection JSON input');
    fireEvent.change(textarea, { target: { value: POSTMAN_COLLECTION_JSON } });
    fireEvent.click(screen.getByLabelText('Visualize pasted JSON'));

    await waitFor(() => {
      expect(screen.getByLabelText(/Total requests/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Total folders/)).toBeInTheDocument();
    });
  });

  it('expands and collapses a folder', async () => {
    render(<CollectionVisualizer />);
    const textarea = screen.getByLabelText('Collection JSON input');
    fireEvent.change(textarea, { target: { value: POSTMAN_COLLECTION_JSON } });
    fireEvent.click(screen.getByLabelText('Visualize pasted JSON'));

    await waitFor(() => {
      expect(screen.getByText('Pet Store API')).toBeInTheDocument();
    });

    // By default folders are expanded – List pets should be visible
    expect(screen.getByLabelText(/View details for GET List pets/)).toBeInTheDocument();

    // Collapse the Pets folder (starts expanded, so label says "Collapse")
    fireEvent.click(screen.getByLabelText(/Collapse folder Pets/));
    expect(screen.queryByLabelText(/View details for GET List pets/)).not.toBeInTheDocument();

    // Expand again
    fireEvent.click(screen.getByLabelText(/Expand folder Pets/));
    expect(screen.getByLabelText(/View details for GET List pets/)).toBeInTheDocument();
  });

  it('opens request detail modal when a request is clicked', async () => {
    render(<CollectionVisualizer />);
    const textarea = screen.getByLabelText('Collection JSON input');
    fireEvent.change(textarea, { target: { value: POSTMAN_COLLECTION_JSON } });
    fireEvent.click(screen.getByLabelText('Visualize pasted JSON'));

    await waitFor(() => {
      expect(screen.getByText('Pet Store API')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/View details for GET Get root/));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText('Request URL')).toBeInTheDocument();
    });
  });

  it('clears the collection when "Load Another" is clicked', async () => {
    render(<CollectionVisualizer />);
    const textarea = screen.getByLabelText('Collection JSON input');
    fireEvent.change(textarea, { target: { value: POSTMAN_COLLECTION_JSON } });
    fireEvent.click(screen.getByLabelText('Visualize pasted JSON'));

    await waitFor(() => {
      expect(screen.getByText('Pet Store API')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Load a different collection'));
    expect(screen.queryByText('Pet Store API')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Collection JSON input')).toBeInTheDocument();
  });

  it('expand all and collapse all controls work', async () => {
    render(<CollectionVisualizer />);
    const textarea = screen.getByLabelText('Collection JSON input');
    fireEvent.change(textarea, { target: { value: POSTMAN_COLLECTION_JSON } });
    fireEvent.click(screen.getByLabelText('Visualize pasted JSON'));

    await waitFor(() => {
      expect(screen.getByText('Pet Store API')).toBeInTheDocument();
    });

    // Collapse all
    fireEvent.click(screen.getByLabelText('Collapse all folders'));
    expect(screen.queryByLabelText(/View details for GET List pets/)).not.toBeInTheDocument();

    // Expand all
    fireEvent.click(screen.getByLabelText('Expand all folders'));
    expect(screen.getByLabelText(/View details for GET List pets/)).toBeInTheDocument();
  });

  it('parses a collection from uploaded file', async () => {
    const mockResult = collectionParser.parseCollection(JSON.parse(POSTMAN_COLLECTION_JSON));
    vi.mocked(collectionParser.parseCollectionFromFile).mockResolvedValueOnce(mockResult);

    render(<CollectionVisualizer />);

    const file = new File([POSTMAN_COLLECTION_JSON], 'pets.json', { type: 'application/json' });
    const fileInput = screen.getByLabelText('Upload collection file');
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('Pet Store API')).toBeInTheDocument();
    });
  });

  it('shows error when file parsing fails', async () => {
    vi.mocked(collectionParser.parseCollectionFromFile).mockRejectedValueOnce(
      new Error('Unsupported format'),
    );

    render(<CollectionVisualizer />);
    const file = new File(['bad content'], 'bad.json', { type: 'application/json' });
    const fileInput = screen.getByLabelText('Upload collection file');
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText(/Failed to parse file: Unsupported format/)).toBeInTheDocument();
    });
  });
});
