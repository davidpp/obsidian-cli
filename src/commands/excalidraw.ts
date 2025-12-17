// Excalidraw diagram generation command

import { getVaultConfig } from '../config';
import { RestAPIClient } from '../api/rest';
import { outputSuccess, outputError } from '../utils/output';
import type { CommandOptions } from '../api/types';
import {
  type DiagramInput,
  type ExcalidrawScene,
  convertDSLToExcalidraw,
  mergeScenes,
  generateExcalidrawMd,
  parseExcalidrawMd,
  ensureExcalidrawExtension,
} from '../utils/excalidraw';

export interface ExcalidrawCreateOptions extends CommandOptions {
  fromFile?: string;
  stdin?: boolean;
}

export interface ExcalidrawGetOptions extends CommandOptions {}

export interface ExcalidrawPatchOptions extends CommandOptions {
  fromFile?: string;
  stdin?: boolean;
}

async function readDiagramInput(options: ExcalidrawCreateOptions): Promise<DiagramInput> {
  let jsonContent: string;

  if (options.fromFile) {
    const file = Bun.file(options.fromFile);
    if (!(await file.exists())) {
      throw new Error(`Source file not found: ${options.fromFile}`);
    }
    jsonContent = await file.text();
  } else if (options.stdin) {
    jsonContent = await Bun.stdin.text();
    if (!jsonContent) {
      throw new Error('No content provided via stdin');
    }
  } else {
    throw new Error('No input provided. Use --from-file or --stdin');
  }

  try {
    const input = JSON.parse(jsonContent) as DiagramInput;

    // Validate required fields
    if (!input.nodes || !Array.isArray(input.nodes)) {
      throw new Error('Input must have a "nodes" array');
    }
    if (!input.edges || !Array.isArray(input.edges)) {
      throw new Error('Input must have an "edges" array');
    }

    // Validate node structure
    for (const node of input.nodes) {
      if (!node.id || typeof node.id !== 'string') {
        throw new Error('Each node must have a string "id"');
      }
      if (!node.label || typeof node.label !== 'string') {
        throw new Error(`Node "${node.id}" must have a string "label"`);
      }
    }

    // Validate edge structure
    const nodeIds = new Set(input.nodes.map((n) => n.id));
    for (const edge of input.edges) {
      if (!edge.from || !edge.to) {
        throw new Error('Each edge must have "from" and "to" properties');
      }
      if (!nodeIds.has(edge.from)) {
        throw new Error(`Edge references unknown node: "${edge.from}"`);
      }
      if (!nodeIds.has(edge.to)) {
        throw new Error(`Edge references unknown node: "${edge.to}"`);
      }
    }

    return input;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Create a new Excalidraw diagram from DSL input
 */
export async function excalidrawCreate(
  path: string,
  options: ExcalidrawCreateOptions
): Promise<void> {
  let vaultName: string | undefined;

  try {
    const { name, config } = await getVaultConfig(options.vault);
    vaultName = name;

    const restClient = new RestAPIClient(config);

    // Read and validate input
    const input = await readDiagramInput(options);

    // Convert DSL to Excalidraw scene
    const scene = convertDSLToExcalidraw(input);

    // Generate .excalidraw.md content
    const mdContent = generateExcalidrawMd(scene);

    // Ensure proper file extension
    const finalPath = ensureExcalidrawExtension(path);

    // Create the note
    await restClient.createNote(finalPath, mdContent);

    outputSuccess(
      'excalidraw-create',
      {
        path: finalPath,
        nodeCount: input.nodes.length,
        edgeCount: input.edges.length,
        elementCount: scene.elements.length,
      },
      undefined,
      vaultName
    );
  } catch (error) {
    outputError('excalidraw-create', error as Error, vaultName);
  }
}

/**
 * Get an existing Excalidraw diagram as JSON
 */
export async function excalidrawGet(path: string, options: ExcalidrawGetOptions): Promise<void> {
  let vaultName: string | undefined;

  try {
    const { name, config } = await getVaultConfig(options.vault);
    vaultName = name;

    const restClient = new RestAPIClient(config);

    // Get the note content
    const note = await restClient.getNote(path);

    // Parse the Excalidraw content
    const scene = parseExcalidrawMd(note.content);

    outputSuccess(
      'excalidraw-get',
      {
        path,
        scene,
      },
      undefined,
      vaultName
    );
  } catch (error) {
    outputError('excalidraw-get', error as Error, vaultName);
  }
}

/**
 * Add elements to an existing Excalidraw diagram
 */
export async function excalidrawPatch(
  path: string,
  options: ExcalidrawPatchOptions
): Promise<void> {
  let vaultName: string | undefined;

  try {
    const { name, config } = await getVaultConfig(options.vault);
    vaultName = name;

    const restClient = new RestAPIClient(config);

    // Read new elements to add
    const additions = await readDiagramInput(options);

    // Get existing diagram
    const note = await restClient.getNote(path);
    const existingScene = parseExcalidrawMd(note.content);

    // Merge scenes
    const mergedScene = mergeScenes(existingScene, additions);

    // Generate new content
    const mdContent = generateExcalidrawMd(mergedScene);

    // Update the note
    await restClient.updateNote(path, mdContent);

    outputSuccess(
      'excalidraw-patch',
      {
        path,
        addedNodes: additions.nodes.length,
        addedEdges: additions.edges.length,
        totalElements: mergedScene.elements.length,
      },
      undefined,
      vaultName
    );
  } catch (error) {
    outputError('excalidraw-patch', error as Error, vaultName);
  }
}
