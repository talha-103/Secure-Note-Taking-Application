import { readFile } from 'node:fs/promises';

const localConfig = new URL('./common.local.json', import.meta.url);

/** Reads local settings shared by the server and command-line scripts. */
export async function readCommonConfig(file = localConfig) {
  let contents;
  try {
    contents = await readFile(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }

  try {
    const config = JSON.parse(contents);
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      throw new Error('Expected a configuration object');
    }
    return config;
  } catch {
    throw new Error(
      'Invalid JSON configuration in src/config/common.local.json',
    );
  }
}
